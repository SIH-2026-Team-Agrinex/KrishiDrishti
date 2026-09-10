"""
db_service.py - Universal Cloud / Local Database Layer for Agri-NEX
Supports PostgreSQL (Supabase, Neon, Render, Railway) via DATABASE_URL
with automatic fallback to local SQLite (agrinex_reports.db) and graceful error handling.
"""

import os
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy import (
    create_engine, Column, String, Float, Text, DateTime, desc, inspect, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

Base = declarative_base()


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    identifier = Column(String(150), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    email = Column(String(150), default="")
    phone = Column(String(50), nullable=True)
    password_hash = Column(String(255), nullable=False)
    preferred_language = Column(String(20), default="en")
    farm_location = Column(Text, default="{}")
    crop_interests = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class CropReportModel(Base):
    __tablename__ = "crop_reports"

    id = Column(String(64), primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    crop_identified = Column(String(100), default="", index=True)
    condition_or_pest = Column(String(150), default="", index=True)
    issue_type = Column(String(50), default="disease")
    confidence = Column(Float, default=0.0)
    risk_level = Column(String(50), default="LOW", index=True)
    location_name = Column(String(150), default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    farmer_id = Column(String(64), nullable=True, index=True)
    farmer_name = Column(String(150), nullable=True)
    raw_json = Column(Text, nullable=False)


class DatabaseService:
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.db_type = "NONE"
        self._init_connection()

    def _init_connection(self):
        db_url = os.environ.get("DATABASE_URL", "").strip()

        # Normalization for Postgres URI (e.g. Supabase, Neon, Heroku give postgres:// instead of postgresql://)
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)

        if not db_url:
            # Fallback to local SQLite file
            sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "agrinex_reports.db")
            db_url = f"sqlite:///{sqlite_path}"
            self.db_type = "SQLITE"
            print(f"[DB INFO] No DATABASE_URL provided. Defaulting to local SQLite: {sqlite_path}")
        else:
            self.db_type = "POSTGRESQL" if "postgres" in db_url else "CUSTOM_DB"
            print(f"[DB INFO] Connecting to remote database: {self.db_type}")

        try:
            # Configure engine
            if self.db_type == "SQLITE":
                self.engine = create_engine(db_url, connect_args={"check_same_thread": False})
            else:
                self.engine = create_engine(db_url, pool_pre_ping=True)

            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            # Create tables automatically if they don't exist
            Base.metadata.create_all(bind=self.engine)

            # Auto-migrate columns if table existed prior to schema upgrade
            try:
                inspector = inspect(self.engine)
                columns = [col["name"] for col in inspector.get_columns("crop_reports")]
                with self.engine.begin() as conn:
                    if "farmer_id" not in columns:
                        conn.execute(text("ALTER TABLE crop_reports ADD COLUMN farmer_id VARCHAR(100)"))
                    if "farmer_name" not in columns:
                        conn.execute(text("ALTER TABLE crop_reports ADD COLUMN farmer_name VARCHAR(100)"))
            except Exception as mig_err:
                print(f"[DB WARN] Column migration check notice: {mig_err}")

            print(f"[DB INFO] Database initialized & schema verified successfully ({self.db_type}).")
        except Exception as e:
            print(f"[DB ERROR] Could not initialize database ({db_url}): {e}")
            self.engine = None
            self.SessionLocal = None

    def get_session(self) -> Optional[Session]:
        if self.SessionLocal:
            return self.SessionLocal()
        return None

    def hash_password(self, password: str) -> str:
        import hashlib
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        session = self.get_session()
        if not session:
            raise Exception("Database session unavailable")

        try:
            identifier = str(user_data.get("identifier", "")).strip().lower()
            if not identifier:
                raise ValueError("Identifier (email or mobile number) is required")

            email_val = str(user_data.get("email") or "").strip().lower()
            if not email_val:
                email_val = identifier if "@" in identifier else f"{identifier}@krishidrishti.in"

            phone_val = str(user_data.get("phone") or "").strip()
            if not phone_val and not ("@" in identifier):
                phone_val = identifier

            existing = session.query(UserModel).filter(
                (UserModel.identifier == identifier) |
                (UserModel.email == email_val)
            ).first()
            if existing:
                raise ValueError("An account with this email or mobile number already exists.")

            user_id = user_data.get("id") or f"usr-{int(datetime.now(timezone.utc).timestamp())}"
            raw_pwd = user_data.get("password") or "password123"
            pwd_hash = self.hash_password(raw_pwd)

            farm_loc = user_data.get("farmLocation", {})
            if isinstance(farm_loc, str):
                farm_loc_str = json.dumps({"villageOrCity": farm_loc, "state": "India", "lat": 20.5937, "lon": 78.9629})
            else:
                farm_loc_str = json.dumps(farm_loc)

            crops = user_data.get("cropInterests", [])
            crops_str = json.dumps(crops)

            user = UserModel(
                id=user_id,
                identifier=identifier,
                name=user_data.get("name", "Farmer User"),
                email=email_val,
                phone=phone_val if phone_val else None,
                password_hash=pwd_hash,
                preferred_language=user_data.get("preferredLanguage", "en"),
                farm_location=farm_loc_str,
                crop_interests=crops_str,
            )
            session.add(user)
            session.commit()
            session.refresh(user)

            print(f"[DB SUCCESS] Created user in database: {user.name} ({user.email}) ID: {user.id}")
            return self._user_to_dict(user)
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def authenticate_user(self, identifier: str, password: str) -> Optional[Dict[str, Any]]:
        session = self.get_session()
        if not session:
            return None

        try:
            clean_id = str(identifier).strip().lower()
            user = session.query(UserModel).filter(
                (UserModel.identifier == clean_id) |
                (UserModel.email == clean_id) |
                (UserModel.phone == clean_id)
            ).first()
            if not user:
                return None

            expected_hash = self.hash_password(password)
            if user.password_hash != expected_hash:
                return None

            return self._user_to_dict(user)
        except Exception as e:
            print(f"[DB ERROR in authenticate_user]: {e}")
            return None
        finally:
            session.close()

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        session = self.get_session()
        if not session:
            return None

        try:
            user = session.query(UserModel).filter(UserModel.id == user_id).first()
            return self._user_to_dict(user) if user else None
        except Exception as e:
            print(f"[DB ERROR in get_user_by_id]: {e}")
            return None
        finally:
            session.close()

    def update_user_profile(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        session = self.get_session()
        if not session:
            return None

        try:
            user = session.query(UserModel).filter(UserModel.id == user_id).first()
            if not user:
                return None

            if "name" in updates and updates["name"]:
                user.name = updates["name"]
            if "phone" in updates:
                user.phone = updates["phone"]
            if "email" in updates:
                user.email = updates["email"]
            if "preferredLanguage" in updates:
                user.preferred_language = updates["preferredLanguage"]
            if "cropInterests" in updates:
                user.crop_interests = json.dumps(updates["cropInterests"])
            if "farmLocation" in updates:
                farm_loc = updates["farmLocation"]
                user.farm_location = json.dumps(farm_loc) if isinstance(farm_loc, dict) else json.dumps({"villageOrCity": str(farm_loc)})

            session.commit()
            session.refresh(user)
            return self._user_to_dict(user)
        except Exception as e:
            session.rollback()
            print(f"[DB ERROR in update_user_profile]: {e}")
            return None
        finally:
            session.close()

    def _user_to_dict(self, user: UserModel) -> Dict[str, Any]:
        try:
            farm_loc = json.loads(user.farm_location) if user.farm_location else {}
        except:
            farm_loc = {}

        try:
            crops = json.loads(user.crop_interests) if user.crop_interests else []
        except:
            crops = []

        return {
            "id": user.id,
            "identifier": user.identifier,
            "name": user.name,
            "email": user.email,
            "phone": user.phone,
            "preferredLanguage": user.preferred_language,
            "farmLocation": farm_loc,
            "cropInterests": crops,
            "createdAt": user.created_at.isoformat() if user.created_at else datetime.now(timezone.utc).isoformat(),
            "isGuest": False,
        }

    def save_report(
        self,
        report: Dict[str, Any],
        farmer_id: Optional[str] = None,
        farmer_name: Optional[str] = None,
        is_guest: bool = False
    ) -> bool:
        """Saves a new scan report into the database. Skips saving for guest users to maintain local privacy."""
        if is_guest:
            # Guest user data is strictly local and never persisted to the central DB
            return True

        session = self.get_session()
        if not session:
            return False

        try:
            report_id = str(report.get("id", ""))
            ml = report.get("mlModelDetection", {})
            user_in = report.get("userInputs", {})
            advisory = report.get("aiAdvisory", {})
            loc = report.get("locationContext", {})

            crop = ml.get("cropIdentified", "")
            condition = ml.get("diseaseOrCondition", "")
            issue_type = ml.get("issueType", "disease")
            confidence = float(ml.get("confidenceScore", 0.0))
            risk_level = advisory.get("overallRiskLevel", "MODERATE")
            location_name = user_in.get("locationName", "")
            lat = float(loc.get("latitude", 0.0)) if loc.get("latitude") is not None else None
            lon = float(loc.get("longitude", 0.0)) if loc.get("longitude") is not None else None

            f_id = farmer_id or report.get("farmerId") or user_in.get("farmerId")
            f_name = farmer_name or report.get("farmerName") or user_in.get("farmerName")

            # Upsert record
            existing = session.query(CropReportModel).filter(CropReportModel.id == report_id).first()
            if existing:
                existing.crop_identified = crop
                existing.condition_or_pest = condition
                existing.issue_type = issue_type
                existing.confidence = confidence
                existing.risk_level = risk_level
                existing.location_name = location_name
                existing.latitude = lat
                existing.longitude = lon
                if f_id: existing.farmer_id = f_id
                if f_name: existing.farmer_name = f_name
                existing.raw_json = json.dumps(report)
            else:
                db_item = CropReportModel(
                    id=report_id,
                    crop_identified=crop,
                    condition_or_pest=condition,
                    issue_type=issue_type,
                    confidence=confidence,
                    risk_level=risk_level,
                    location_name=location_name,
                    latitude=lat,
                    longitude=lon,
                    farmer_id=f_id,
                    farmer_name=f_name,
                    raw_json=json.dumps(report)
                )
                session.add(db_item)

            session.commit()
            return True
        except Exception as e:
            print(f"[DB ERROR in save_report]: {e}")
            session.rollback()
            return False
        finally:
            session.close()

    def get_history(
        self,
        crop: Optional[str] = "ALL",
        risk: Optional[str] = "ALL",
        q: Optional[str] = None,
        farmer_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieves scan history with filtering, optionally scoped to a specific farmer."""
        session = self.get_session()
        if not session:
            return []

        try:
            query = session.query(CropReportModel).order_by(desc(CropReportModel.created_at))

            if farmer_id and farmer_id != "ALL":
                query = query.filter(CropReportModel.farmer_id == farmer_id)

            if crop and crop != "ALL":
                query = query.filter(CropReportModel.crop_identified.ilike(f"%{crop}%"))

            if risk and risk != "ALL":
                query = query.filter(CropReportModel.risk_level == risk)

            if q:
                pattern = f"%{q}%"
                query = query.filter(
                    (CropReportModel.crop_identified.ilike(pattern)) |
                    (CropReportModel.condition_or_pest.ilike(pattern)) |
                    (CropReportModel.location_name.ilike(pattern)) |
                    (CropReportModel.raw_json.ilike(pattern))
                )

            rows = query.limit(limit).all()
            reports = []
            for row in rows:
                try:
                    data = json.loads(row.raw_json)
                    reports.append(data)
                except Exception:
                    continue
            return reports
        except Exception as e:
            print(f"[DB ERROR in get_history]: {e}")
            return []
        finally:
            session.close()

    def get_report_by_id(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Fetches a specific scan report by its unique ID."""
        session = self.get_session()
        if not session:
            return None

        try:
            row = session.query(CropReportModel).filter(CropReportModel.id == report_id).first()
            if row and row.raw_json:
                return json.loads(row.raw_json)
            return None
        except Exception as e:
            print(f"[DB ERROR in get_report_by_id]: {e}")
            return None
        finally:
            session.close()

    def delete_report(self, report_id: str) -> bool:
        """Deletes a scan report by its unique ID."""
        session = self.get_session()
        if not session:
            return False

        try:
            row = session.query(CropReportModel).filter(CropReportModel.id == report_id).first()
            if row:
                session.delete(row)
                session.commit()
                return True
            return False
        except Exception as e:
            print(f"[DB ERROR in delete_report]: {e}")
            session.rollback()
            return False
        finally:
            session.close()

    def get_heatmap_analytics(self) -> Dict[str, Any]:
        """
        Aggregates state-wise and district-wise disease, pest, and weather analytics
        anchored directly to all tests recorded in the platform database.
        """
        session = self.get_session()
        reports: List[CropReportModel] = []
        if session:
            try:
                reports = session.query(CropReportModel).all()
            except Exception as e:
                print(f"[DB ERROR in get_heatmap_analytics]: {e}")
            finally:
                session.close()

        # Base catalog of Indian States and UTs matching @vishalvoid/react-india-map ISO IDs
        state_definitions = [
            {
                "id": "IN-MH", "name": "Maharashtra", "capital": "Mumbai",
                "base_tests": 0, "base_disease_intensity": 74, "base_pest_intensity": 68,
                "dominant_disease": "Cotton Bacterial Blight", "dominant_pest": "Pink Bollworm",
                "risk_level": "HIGH", "temp": 31.4, "humidity": 78, "rain_risk": 45, "weather_desc": "Humid / Tropical Warm",
                "districts": [
                    {"name": "Nagpur", "base_tests": 0, "disease": "Cotton Bacterial Blight", "pest": "Pink Bollworm", "risk": "HIGH", "temp": 32, "humidity": 72, "disease_intensity": 78, "pest_intensity": 70},
                    {"name": "Nashik", "base_tests": 0, "disease": "Grape Powdery Mildew", "pest": "Thrips", "risk": "HIGH", "temp": 28, "humidity": 80, "disease_intensity": 75, "pest_intensity": 64},
                    {"name": "Pune", "base_tests": 0, "disease": "Tomato Early Blight", "pest": "Whitefly", "risk": "MODERATE", "temp": 29, "humidity": 76, "disease_intensity": 58, "pest_intensity": 62},
                    {"name": "Amravati", "base_tests": 0, "disease": "Soybean Rust", "pest": "Stem Fly", "risk": "HIGH", "temp": 33, "humidity": 70, "disease_intensity": 72, "pest_intensity": 66},
                    {"name": "Kolhapur", "base_tests": 0, "disease": "Sugarcane Red Rot", "pest": "Early Shoot Borer", "risk": "MODERATE", "temp": 27, "humidity": 84, "disease_intensity": 60, "pest_intensity": 52},
                    {"name": "Aurangabad", "base_tests": 0, "disease": "Cotton Leaf Curl", "pest": "Aphids", "risk": "HIGH", "temp": 31, "humidity": 68, "disease_intensity": 69, "pest_intensity": 71},
                    {"name": "Solapur", "base_tests": 0, "disease": "Pomegranate Bacterial Nodal Blight", "pest": "Fruit Borer", "risk": "HIGH", "temp": 34, "humidity": 62, "disease_intensity": 74, "pest_intensity": 75},
                    {"name": "Jalgaon", "base_tests": 0, "disease": "Banana Sigatoka Leaf Spot", "pest": "Rhizome Weevil", "risk": "MODERATE", "temp": 33, "humidity": 65, "disease_intensity": 61, "pest_intensity": 58},
                    {"name": "Ahmednagar", "base_tests": 0, "disease": "Onion Purple Blotch", "pest": "Onion Thrips", "risk": "MODERATE", "temp": 30, "humidity": 71, "disease_intensity": 56, "pest_intensity": 64},
                ]
            },
            {
                "id": "IN-PB", "name": "Punjab", "capital": "Chandigarh",
                "base_tests": 0, "base_disease_intensity": 82, "base_pest_intensity": 59,
                "dominant_disease": "Wheat Yellow Stripe Rust", "dominant_pest": "Stem Borer",
                "risk_level": "CRITICAL", "temp": 27.2, "humidity": 83, "rain_risk": 55, "weather_desc": "Damp Morning Dew / High Spore Spread",
                "districts": [
                    {"name": "Ludhiana", "base_tests": 0, "disease": "Wheat Yellow Rust", "pest": "Stem Borer", "risk": "CRITICAL", "temp": 26, "humidity": 85, "disease_intensity": 88, "pest_intensity": 58},
                    {"name": "Amritsar", "base_tests": 0, "disease": "Paddy Bacterial Blight", "pest": "Leaf Folder", "risk": "HIGH", "temp": 25, "humidity": 87, "disease_intensity": 81, "pest_intensity": 62},
                    {"name": "Bathinda", "base_tests": 0, "disease": "Cotton Wilt", "pest": "Whitefly", "risk": "HIGH", "temp": 28, "humidity": 78, "disease_intensity": 76, "pest_intensity": 79},
                    {"name": "Patiala", "base_tests": 0, "disease": "Wheat Karnal Bunt", "pest": "Armyworm", "risk": "HIGH", "temp": 27, "humidity": 82, "disease_intensity": 74, "pest_intensity": 55},
                    {"name": "Jalandhar", "base_tests": 0, "disease": "Potato Late Blight", "pest": "Aphids", "risk": "HIGH", "temp": 26, "humidity": 84, "disease_intensity": 79, "pest_intensity": 60},
                    {"name": "Firozpur", "base_tests": 0, "disease": "Rice Blast", "pest": "Brown Plant Hopper", "risk": "HIGH", "temp": 27, "humidity": 81, "disease_intensity": 73, "pest_intensity": 65},
                    {"name": "Sangrur", "base_tests": 0, "disease": "Wheat Loose Smut", "pest": "Termites", "risk": "MODERATE", "temp": 28, "humidity": 79, "disease_intensity": 62, "pest_intensity": 51},
                ]
            },
            {
                "id": "IN-HR", "name": "Haryana", "capital": "Chandigarh",
                "base_tests": 0, "base_disease_intensity": 65, "base_pest_intensity": 72,
                "dominant_disease": "Mustard White Rust", "dominant_pest": "Mustard Aphid (Lipaphis)",
                "risk_level": "HIGH", "temp": 29.5, "humidity": 74, "rain_risk": 35, "weather_desc": "Dry Winds / Aphid Migration Threat",
                "districts": [
                    {"name": "Karnal", "base_tests": 0, "disease": "Wheat Yellow Rust", "pest": "Wheat Aphid", "risk": "HIGH", "temp": 28, "humidity": 77, "disease_intensity": 74, "pest_intensity": 70},
                    {"name": "Hisar", "base_tests": 0, "disease": "Cotton Leaf Curl", "pest": "Whitefly", "risk": "HIGH", "temp": 31, "humidity": 66, "disease_intensity": 68, "pest_intensity": 82},
                    {"name": "Sirsa", "base_tests": 0, "disease": "Cotton Bacterial Blight", "pest": "Pink Bollworm", "risk": "HIGH", "temp": 30, "humidity": 69, "disease_intensity": 70, "pest_intensity": 80},
                    {"name": "Ambala", "base_tests": 0, "disease": "Paddy Sheath Blight", "pest": "Stem Borer", "risk": "MODERATE", "temp": 27, "humidity": 81, "disease_intensity": 62, "pest_intensity": 58},
                    {"name": "Rohtak", "base_tests": 0, "disease": "Mustard White Rust", "pest": "Mustard Aphid", "risk": "HIGH", "temp": 29, "humidity": 72, "disease_intensity": 72, "pest_intensity": 75},
                    {"name": "Jind", "base_tests": 0, "disease": "Pearl Millet Downy Mildew", "pest": "Shoot Fly", "risk": "MODERATE", "temp": 30, "humidity": 70, "disease_intensity": 59, "pest_intensity": 61},
                    {"name": "Gurugram", "base_tests": 0, "disease": "Vegetable Damping Off", "pest": "Fruit Fly", "risk": "LOW", "temp": 29, "humidity": 73, "disease_intensity": 42, "pest_intensity": 45},
                ]
            },
            {
                "id": "IN-UP", "name": "Uttar Pradesh", "capital": "Lucknow",
                "base_tests": 0, "base_disease_intensity": 78, "base_pest_intensity": 70,
                "dominant_disease": "Potato Late Blight", "dominant_pest": "Sugarcane Top Borer",
                "risk_level": "CRITICAL", "temp": 30.1, "humidity": 81, "rain_risk": 50, "weather_desc": "Elevated Night Moisture & Fog Threat",
                "districts": [
                    {"name": "Meerut", "base_tests": 0, "disease": "Sugarcane Red Rot", "pest": "Top Borer", "risk": "CRITICAL", "temp": 29, "humidity": 82, "disease_intensity": 85, "pest_intensity": 78},
                    {"name": "Agra", "base_tests": 0, "disease": "Potato Late Blight", "pest": "Tuber Moth", "risk": "HIGH", "temp": 31, "humidity": 76, "disease_intensity": 82, "pest_intensity": 69},
                    {"name": "Varanasi", "base_tests": 0, "disease": "Paddy Bacterial Leaf Streak", "pest": "Rice Hispa", "risk": "HIGH", "temp": 32, "humidity": 80, "disease_intensity": 75, "pest_intensity": 68},
                    {"name": "Bareilly", "base_tests": 0, "disease": "Wheat Brown Rust", "pest": "Armyworm", "risk": "HIGH", "temp": 28, "humidity": 84, "disease_intensity": 76, "pest_intensity": 64},
                    {"name": "Gorakhpur", "base_tests": 0, "disease": "Paddy False Smut", "pest": "Leaf Roller", "risk": "HIGH", "temp": 30, "humidity": 86, "disease_intensity": 79, "pest_intensity": 66},
                    {"name": "Aligarh", "base_tests": 0, "disease": "Mustard Alternaria Blight", "pest": "Mustard Sawfly", "risk": "MODERATE", "temp": 30, "humidity": 77, "disease_intensity": 64, "pest_intensity": 65},
                    {"name": "Prayagraj", "base_tests": 0, "disease": "Guava Wilt", "pest": "Bark Eating Caterpillar", "risk": "MODERATE", "temp": 32, "humidity": 75, "disease_intensity": 61, "pest_intensity": 63},
                    {"name": "Saharanpur", "base_tests": 0, "disease": "Mango Anthracnose", "pest": "Mango Hopper", "risk": "HIGH", "temp": 28, "humidity": 83, "disease_intensity": 73, "pest_intensity": 76},
                ]
            },
            {
                "id": "IN-GJ", "name": "Gujarat", "capital": "Gandhinagar",
                "base_tests": 0, "base_disease_intensity": 61, "base_pest_intensity": 81,
                "dominant_disease": "Groundnut Tikka Leaf Spot", "dominant_pest": "Cotton Pink Bollworm",
                "risk_level": "HIGH", "temp": 33.8, "humidity": 65, "rain_risk": 25, "weather_desc": "Hot & Dry Spells / High Pest Incubation",
                "districts": [
                    {"name": "Rajkot", "base_tests": 0, "disease": "Groundnut Tikka Spot", "pest": "White Grub", "risk": "HIGH", "temp": 34, "humidity": 62, "disease_intensity": 68, "pest_intensity": 84},
                    {"name": "Surat", "base_tests": 0, "disease": "Banana Panama Wilt", "pest": "Pink Bollworm", "risk": "HIGH", "temp": 32, "humidity": 74, "disease_intensity": 62, "pest_intensity": 80},
                    {"name": "Ahmedabad", "base_tests": 0, "disease": "Cotton Root Rot", "pest": "Cotton Aphids", "risk": "MODERATE", "temp": 35, "humidity": 59, "disease_intensity": 57, "pest_intensity": 76},
                    {"name": "Junagadh", "base_tests": 0, "disease": "Sesame Phyllody", "pest": "Jassids", "risk": "HIGH", "temp": 33, "humidity": 67, "disease_intensity": 64, "pest_intensity": 81},
                    {"name": "Vadodara", "base_tests": 0, "disease": "Tobacco Mosaic Virus", "pest": "Caterpillar", "risk": "MODERATE", "temp": 34, "humidity": 64, "disease_intensity": 54, "pest_intensity": 73},
                    {"name": "Mehsana", "base_tests": 0, "disease": "Cumin Blight", "pest": "Thrips", "risk": "HIGH", "temp": 34, "humidity": 58, "disease_intensity": 71, "pest_intensity": 78},
                ]
            },
            {
                "id": "IN-MP", "name": "Madhya Pradesh", "capital": "Bhopal",
                "base_tests": 0, "base_disease_intensity": 71, "base_pest_intensity": 75,
                "dominant_disease": "Soybean Yellow Mosaic Virus", "dominant_pest": "Girdle Beetle",
                "risk_level": "HIGH", "temp": 32.0, "humidity": 70, "rain_risk": 40, "weather_desc": "Warm Afternoon Convection / Vector Active",
                "districts": [
                    {"name": "Indore", "base_tests": 0, "disease": "Soybean Yellow Mosaic", "pest": "Girdle Beetle", "risk": "HIGH", "temp": 31, "humidity": 71, "disease_intensity": 74, "pest_intensity": 78},
                    {"name": "Ujjain", "base_tests": 0, "disease": "Wheat Loose Smut", "pest": "Semilooper", "risk": "HIGH", "temp": 32, "humidity": 68, "disease_intensity": 69, "pest_intensity": 74},
                    {"name": "Bhopal", "base_tests": 0, "disease": "Gram Wilt (Fusarium)", "pest": "Pod Borer (Helicoverpa)", "risk": "HIGH", "temp": 32, "humidity": 70, "disease_intensity": 72, "pest_intensity": 82},
                    {"name": "Jabalpur", "base_tests": 0, "disease": "Paddy Bacterial Blight", "pest": "Stem Borer", "risk": "MODERATE", "temp": 31, "humidity": 73, "disease_intensity": 66, "pest_intensity": 67},
                    {"name": "Hoshangabad", "base_tests": 0, "disease": "Wheat Powdery Mildew", "pest": "Armyworm", "risk": "MODERATE", "temp": 32, "humidity": 72, "disease_intensity": 63, "pest_intensity": 64},
                    {"name": "Khargone", "base_tests": 0, "disease": "Chilli Leaf Curl Virus", "pest": "Mites", "risk": "HIGH", "temp": 34, "humidity": 63, "disease_intensity": 76, "pest_intensity": 80},
                ]
            },
            {
                "id": "IN-KA", "name": "Karnataka", "capital": "Bengaluru",
                "base_tests": 0, "base_disease_intensity": 67, "base_pest_intensity": 63,
                "dominant_disease": "Coffee Leaf Rust", "dominant_pest": "Fall Armyworm (Maize)",
                "risk_level": "HIGH", "temp": 28.6, "humidity": 79, "rain_risk": 45, "weather_desc": "Monsoon Showers / High Canopy Moisture",
                "districts": [
                    {"name": "Belagavi", "base_tests": 0, "disease": "Sugarcane Smut", "pest": "Woolly Aphid", "risk": "HIGH", "temp": 28, "humidity": 80, "disease_intensity": 71, "pest_intensity": 69},
                    {"name": "Dharwad", "base_tests": 0, "disease": "Maize Turcicum Leaf Blight", "pest": "Fall Armyworm", "risk": "HIGH", "temp": 29, "humidity": 77, "disease_intensity": 73, "pest_intensity": 78},
                    {"name": "Shivamogga", "base_tests": 0, "disease": "Arecanut Koleroga", "pest": "Spindle Bug", "risk": "HIGH", "temp": 27, "humidity": 86, "disease_intensity": 78, "pest_intensity": 59},
                    {"name": "Mysuru", "base_tests": 0, "disease": "Paddy Blast", "pest": "Rice Gall Midge", "risk": "MODERATE", "temp": 28, "humidity": 78, "disease_intensity": 61, "pest_intensity": 57},
                    {"name": "Ballari", "base_tests": 0, "disease": "Chilli Anthracnose", "pest": "Chilli Thrips", "risk": "HIGH", "temp": 32, "humidity": 68, "disease_intensity": 70, "pest_intensity": 75},
                    {"name": "Vijayapura", "base_tests": 0, "disease": "Grape Downy Mildew", "pest": "Flea Beetle", "risk": "MODERATE", "temp": 31, "humidity": 69, "disease_intensity": 59, "pest_intensity": 62},
                ]
            },
            {
                "id": "IN-AP", "name": "Andhra Pradesh", "capital": "Amaravati",
                "base_tests": 0, "base_disease_intensity": 70, "base_pest_intensity": 76,
                "dominant_disease": "Chilli Anthracnose", "dominant_pest": "Black Thrips (Thrips parvispinus)",
                "risk_level": "HIGH", "temp": 32.7, "humidity": 82, "rain_risk": 40, "weather_desc": "Coastal Humidity Spike / Severe Thrips Spread",
                "districts": [
                    {"name": "Guntur", "base_tests": 0, "disease": "Chilli Die Back", "pest": "Black Thrips", "risk": "CRITICAL", "temp": 33, "humidity": 80, "disease_intensity": 79, "pest_intensity": 90},
                    {"name": "Kurnool", "base_tests": 0, "disease": "Groundnut Leaf Spot", "pest": "Red Hairy Caterpillar", "risk": "HIGH", "temp": 34, "humidity": 72, "disease_intensity": 68, "pest_intensity": 77},
                    {"name": "Krishna", "base_tests": 0, "disease": "Paddy Sheath Rot", "pest": "Brown Plant Hopper", "risk": "HIGH", "temp": 32, "humidity": 85, "disease_intensity": 72, "pest_intensity": 73},
                    {"name": "East Godavari", "base_tests": 0, "disease": "Coconut Root Wilt", "pest": "Rhinoceros Beetle", "risk": "MODERATE", "temp": 31, "humidity": 87, "disease_intensity": 60, "pest_intensity": 58},
                    {"name": "Anantapur", "base_tests": 0, "disease": "Groundnut Rust", "pest": "Spodoptera litura", "risk": "MODERATE", "temp": 34, "humidity": 66, "disease_intensity": 58, "pest_intensity": 67},
                ]
            },
            {
                "id": "IN-TG", "name": "Telangana", "capital": "Hyderabad",
                "base_tests": 0, "base_disease_intensity": 66, "base_pest_intensity": 73,
                "dominant_disease": "Cotton Leaf Spot (Cercospora)", "dominant_pest": "Cotton Pink Bollworm",
                "risk_level": "HIGH", "temp": 32.2, "humidity": 75, "rain_risk": 35, "weather_desc": "Intermittent Drizzle & Warm Humidity",
                "districts": [
                    {"name": "Warangal", "base_tests": 0, "disease": "Cotton Bacterial Blight", "pest": "Pink Bollworm", "risk": "HIGH", "temp": 32, "humidity": 76, "disease_intensity": 75, "pest_intensity": 83},
                    {"name": "Karimnagar", "base_tests": 0, "disease": "Paddy Bacterial Blight", "pest": "Stem Borer", "risk": "HIGH", "temp": 33, "humidity": 74, "disease_intensity": 71, "pest_intensity": 72},
                    {"name": "Nizamabad", "base_tests": 0, "disease": "Turmeric Leaf Spot (Colletotrichum)", "pest": "Rhizome Scale", "risk": "MODERATE", "temp": 31, "humidity": 78, "disease_intensity": 63, "pest_intensity": 65},
                    {"name": "Nalgonda", "base_tests": 0, "disease": "Sweet Orange Greening (HLB)", "pest": "Citrus Psyllid", "risk": "MODERATE", "temp": 33, "humidity": 71, "disease_intensity": 59, "pest_intensity": 64},
                    {"name": "Khammam", "base_tests": 0, "disease": "Chilli Wilt", "pest": "Chilli Thrips", "risk": "HIGH", "temp": 33, "humidity": 77, "disease_intensity": 68, "pest_intensity": 78},
                ]
            },
            {
                "id": "IN-TN", "name": "Tamil Nadu", "capital": "Chennai",
                "base_tests": 0, "base_disease_intensity": 63, "base_pest_intensity": 65,
                "dominant_disease": "Paddy False Smut", "dominant_pest": "Fall Armyworm",
                "risk_level": "MODERATE", "temp": 31.8, "humidity": 84, "rain_risk": 40, "weather_desc": "Tropical Coastal Warmth / Moderate Rust",
                "districts": [
                    {"name": "Thanjavur", "base_tests": 0, "disease": "Paddy Sheath Blight", "pest": "Rice Gall Midge", "risk": "HIGH", "temp": 31, "humidity": 86, "disease_intensity": 74, "pest_intensity": 66},
                    {"name": "Coimbatore", "base_tests": 0, "disease": "Coconut Tanjore Wilt", "pest": "Red Palm Weevil", "risk": "MODERATE", "temp": 30, "humidity": 79, "disease_intensity": 61, "pest_intensity": 63},
                    {"name": "Madurai", "base_tests": 0, "disease": "Jasmine Leaf Spot", "pest": "Bud Worm", "risk": "MODERATE", "temp": 33, "humidity": 78, "disease_intensity": 58, "pest_intensity": 62},
                    {"name": "Salem", "base_tests": 0, "disease": "Tapioca Mosaic Disease", "pest": "Whitefly", "risk": "HIGH", "temp": 32, "humidity": 77, "disease_intensity": 70, "pest_intensity": 72},
                    {"name": "Tiruchirappalli", "base_tests": 0, "disease": "Banana Bunchy Top Virus", "pest": "Banana Aphid", "risk": "MODERATE", "temp": 33, "humidity": 81, "disease_intensity": 55, "pest_intensity": 59},
                ]
            },
            {
                "id": "IN-RJ", "name": "Rajasthan", "capital": "Jaipur",
                "base_tests": 0, "base_disease_intensity": 58, "base_pest_intensity": 79,
                "dominant_disease": "Mustard Downy Mildew", "dominant_pest": "Desert Locust / White Grub",
                "risk_level": "HIGH", "temp": 35.1, "humidity": 48, "rain_risk": 15, "weather_desc": "Arid Heat / Strong Pest Activity",
                "districts": [
                    {"name": "Sri Ganganagar", "base_tests": 0, "disease": "Cotton Leaf Curl", "pest": "Whitefly", "risk": "HIGH", "temp": 34, "humidity": 55, "disease_intensity": 69, "pest_intensity": 86},
                    {"name": "Jaipur", "base_tests": 0, "disease": "Pearl Millet Ergot", "pest": "Termites", "risk": "MODERATE", "temp": 35, "humidity": 48, "disease_intensity": 58, "pest_intensity": 74},
                    {"name": "Kota", "base_tests": 0, "disease": "Soybean Rust", "pest": "Semilooper", "risk": "HIGH", "temp": 33, "humidity": 62, "disease_intensity": 67, "pest_intensity": 76},
                    {"name": "Alwar", "base_tests": 0, "disease": "Mustard White Rust", "pest": "Painted Bug", "risk": "HIGH", "temp": 33, "humidity": 54, "disease_intensity": 70, "pest_intensity": 78},
                    {"name": "Jodhpur", "base_tests": 0, "disease": "Cumin Wilt", "pest": "Aphids", "risk": "MODERATE", "temp": 37, "humidity": 40, "disease_intensity": 52, "pest_intensity": 72},
                ]
            },
            {
                "id": "IN-WB", "name": "West Bengal", "capital": "Kolkata",
                "base_tests": 0, "base_disease_intensity": 76, "base_pest_intensity": 62,
                "dominant_disease": "Rice Bacterial Sheath Blight", "dominant_pest": "Yellow Stem Borer",
                "risk_level": "HIGH", "temp": 30.5, "humidity": 89, "rain_risk": 60, "weather_desc": "High Atmospheric Moisture / Fungal Vector",
                "districts": [
                    {"name": "Burdwan", "base_tests": 0, "disease": "Rice Blast", "pest": "Yellow Stem Borer", "risk": "HIGH", "temp": 30, "humidity": 88, "disease_intensity": 79, "pest_intensity": 68},
                    {"name": "Hooghly", "base_tests": 0, "disease": "Potato Late Blight", "pest": "Cutworm", "risk": "HIGH", "temp": 30, "humidity": 90, "disease_intensity": 83, "pest_intensity": 61},
                    {"name": "Nadia", "base_tests": 0, "disease": "Jute Stem Rot", "pest": "Jute Semilooper", "risk": "HIGH", "temp": 31, "humidity": 87, "disease_intensity": 72, "pest_intensity": 65},
                    {"name": "Murshidabad", "base_tests": 0, "disease": "Mustard Alternaria", "pest": "Mustard Aphid", "risk": "MODERATE", "temp": 31, "humidity": 85, "disease_intensity": 64, "pest_intensity": 60},
                    {"name": "Malda", "base_tests": 0, "disease": "Mango Malformation", "pest": "Mango Shoot Borer", "risk": "MODERATE", "temp": 31, "humidity": 86, "disease_intensity": 61, "pest_intensity": 59},
                ]
            },
            {
                "id": "IN-BR", "name": "Bihar", "capital": "Patna",
                "base_tests": 0, "base_disease_intensity": 73, "base_pest_intensity": 67,
                "dominant_disease": "Wheat Spot Blotch", "dominant_pest": "Maize Stem Borer",
                "risk_level": "HIGH", "temp": 31.0, "humidity": 83, "rain_risk": 45, "weather_desc": "Humid Subtropical / High Spore Germination",
                "districts": [
                    {"name": "Muzaffarpur", "base_tests": 0, "disease": "Litchi Fruit Rot", "pest": "Litchi Mite", "risk": "HIGH", "temp": 30, "humidity": 85, "disease_intensity": 78, "pest_intensity": 72},
                    {"name": "Patna", "base_tests": 0, "disease": "Rice Tungro Virus", "pest": "Green Leafhopper", "risk": "HIGH", "temp": 31, "humidity": 82, "disease_intensity": 74, "pest_intensity": 69},
                    {"name": "Samastipur", "base_tests": 0, "disease": "Maize Maydis Leaf Blight", "pest": "Chilo partellus", "risk": "HIGH", "temp": 31, "humidity": 84, "disease_intensity": 71, "pest_intensity": 68},
                    {"name": "Gaya", "base_tests": 0, "disease": "Chickpea Wilt", "pest": "Gram Pod Borer", "risk": "MODERATE", "temp": 32, "humidity": 78, "disease_intensity": 62, "pest_intensity": 63},
                    {"name": "Bhagalpur", "base_tests": 0, "disease": "Silk Mulberry Leaf Rust", "pest": "Mealybug", "risk": "MODERATE", "temp": 31, "humidity": 81, "disease_intensity": 59, "pest_intensity": 60},
                ]
            },
            {
                "id": "IN-DL", "name": "Delhi", "capital": "New Delhi",
                "base_tests": 0, "base_disease_intensity": 59, "base_pest_intensity": 55,
                "dominant_disease": "Leaf Spot / Foliage Mold", "dominant_pest": "Urban Crop Whitefly",
                "risk_level": "MODERATE", "temp": 29.8, "humidity": 73, "rain_risk": 20, "weather_desc": "Urban Peri-Agricultural Zone",
                "districts": [
                    {"name": "Central Delhi", "base_tests": 0, "disease": "Cotton Bacterial Blight", "pest": "Aphids", "risk": "HIGH", "temp": 30, "humidity": 72, "disease_intensity": 68, "pest_intensity": 60},
                    {"name": "North Delhi", "base_tests": 0, "disease": "Wheat Black Rust", "pest": "Stem Borer", "risk": "MODERATE", "temp": 29, "humidity": 75, "disease_intensity": 62, "pest_intensity": 58},
                    {"name": "South Delhi", "base_tests": 0, "disease": "Vegetable Mildew", "pest": "Whitefly", "risk": "LOW", "temp": 30, "humidity": 71, "disease_intensity": 45, "pest_intensity": 48},
                    {"name": "West Delhi", "base_tests": 0, "disease": "Tomato Leaf Curl", "pest": "Fruit Fly", "risk": "LOW", "temp": 30, "humidity": 74, "disease_intensity": 44, "pest_intensity": 46},
                    {"name": "East Delhi", "base_tests": 0, "disease": "Inconclusive Foliage Pattern", "pest": "Mites", "risk": "LOW", "temp": 30, "humidity": 73, "disease_intensity": 40, "pest_intensity": 42},
                ]
            },
            {
                "id": "IN-OR", "name": "Odisha", "capital": "Bhubaneswar",
                "base_tests": 0, "base_disease_intensity": 68, "base_pest_intensity": 62,
                "dominant_disease": "Rice Brown Spot", "dominant_pest": "Brown Plant Hopper",
                "risk_level": "HIGH", "temp": 31.6, "humidity": 86, "rain_risk": 55, "weather_desc": "Bay of Bengal Moisture Depressions",
                "districts": [
                    {"name": "Cuttack", "base_tests": 0, "disease": "Rice Blast", "pest": "Gundhi Bug", "risk": "HIGH", "temp": 31, "humidity": 87, "disease_intensity": 75, "pest_intensity": 66},
                    {"name": "Bhubaneswar", "base_tests": 0, "disease": "Paddy Sheath Blight", "pest": "Stem Borer", "risk": "HIGH", "temp": 32, "humidity": 85, "disease_intensity": 70, "pest_intensity": 63},
                    {"name": "Sambalpur", "base_tests": 0, "disease": "Rice Bacterial Blight", "pest": "Leaf Folder", "risk": "MODERATE", "temp": 32, "humidity": 82, "disease_intensity": 64, "pest_intensity": 61},
                    {"name": "Balasore", "base_tests": 0, "disease": "Betelvine Foot Rot", "pest": "Whitefly", "risk": "MODERATE", "temp": 30, "humidity": 89, "disease_intensity": 61, "pest_intensity": 58},
                ]
            },
            {
                "id": "IN-KL", "name": "Kerala", "capital": "Thiruvananthapuram",
                "base_tests": 0, "base_disease_intensity": 72, "base_pest_intensity": 56,
                "dominant_disease": "Cardamom Capsule Rot (Azhukal)", "dominant_pest": "Tea Mosquito Bug",
                "risk_level": "HIGH", "temp": 28.3, "humidity": 91, "rain_risk": 70, "weather_desc": "High Precipitation & Saturated Soils",
                "districts": [
                    {"name": "Idukki", "base_tests": 0, "disease": "Black Pepper Quick Wilt", "pest": "Tea Mosquito Bug", "risk": "HIGH", "temp": 23, "humidity": 93, "disease_intensity": 80, "pest_intensity": 64},
                    {"name": "Wayanad", "base_tests": 0, "disease": "Coffee Berry Disease", "pest": "Coffee Berry Borer", "risk": "HIGH", "temp": 25, "humidity": 91, "disease_intensity": 76, "pest_intensity": 61},
                    {"name": "Palakkad", "base_tests": 0, "disease": "Paddy Sheath Rot", "pest": "Rice Bug", "risk": "MODERATE", "temp": 31, "humidity": 85, "disease_intensity": 63, "pest_intensity": 54},
                    {"name": "Kottayam", "base_tests": 0, "disease": "Rubber Abnormal Leaf Fall", "pest": "Scale Insect", "risk": "MODERATE", "temp": 29, "humidity": 90, "disease_intensity": 62, "pest_intensity": 51},
                ]
            },
            {
                "id": "IN-AS", "name": "Assam", "capital": "Dispur",
                "base_tests": 0, "base_disease_intensity": 69, "base_pest_intensity": 64,
                "dominant_disease": "Tea Blister Blight", "dominant_pest": "Tea Looper Caterpillar",
                "risk_level": "HIGH", "temp": 27.8, "humidity": 88, "rain_risk": 65, "weather_desc": "Humid River Valleys / Heavy Leaf Wetness",
                "districts": [
                    {"name": "Dibrugarh", "base_tests": 0, "disease": "Tea Blister Blight", "pest": "Tea Looper", "risk": "HIGH", "temp": 27, "humidity": 90, "disease_intensity": 77, "pest_intensity": 71},
                    {"name": "Jorhat", "base_tests": 0, "disease": "Tea Red Rust", "pest": "Red Spider Mite", "risk": "HIGH", "temp": 28, "humidity": 87, "disease_intensity": 72, "pest_intensity": 68},
                    {"name": "Nagaon", "base_tests": 0, "disease": "Rice Blast", "pest": "Hispa", "risk": "MODERATE", "temp": 29, "humidity": 86, "disease_intensity": 62, "pest_intensity": 59},
                    {"name": "Kamrup", "base_tests": 0, "disease": "Vegetable Soft Rot", "pest": "Aphids", "risk": "LOW", "temp": 29, "humidity": 85, "disease_intensity": 49, "pest_intensity": 52},
                ]
            },
            {
                "id": "IN-JH", "name": "Jharkhand", "capital": "Ranchi",
                "base_tests": 0, "base_disease_intensity": 56, "base_pest_intensity": 54,
                "dominant_disease": "Pigeonpea Sterility Mosaic", "dominant_pest": "Blister Beetle",
                "risk_level": "MODERATE", "temp": 29.4, "humidity": 76, "rain_risk": 35, "weather_desc": "Plateau Climate / Moderate Vector Activity",
                "districts": [
                    {"name": "Ranchi", "base_tests": 0, "disease": "Tomato Bacterial Wilt", "pest": "Fruit Borer", "risk": "MODERATE", "temp": 28, "humidity": 78, "disease_intensity": 61, "pest_intensity": 58},
                    {"name": "Hazaribagh", "base_tests": 0, "disease": "Rice Blast", "pest": "Stem Borer", "risk": "MODERATE", "temp": 29, "humidity": 75, "disease_intensity": 57, "pest_intensity": 55},
                    {"name": "Dhanbad", "base_tests": 0, "disease": "Vegetable Blight", "pest": "Aphids", "risk": "LOW", "temp": 31, "humidity": 73, "disease_intensity": 48, "pest_intensity": 49},
                    {"name": "Palamu", "base_tests": 0, "disease": "Pulses Wilt", "pest": "Pod Borer", "risk": "LOW", "temp": 32, "humidity": 68, "disease_intensity": 46, "pest_intensity": 51},
                ]
            },
            {
                "id": "IN-CT", "name": "Chhattisgarh", "capital": "Raipur",
                "base_tests": 0, "base_disease_intensity": 65, "base_pest_intensity": 68,
                "dominant_disease": "Paddy Bacterial Leaf Blight", "dominant_pest": "Rice Gall Midge",
                "risk_level": "HIGH", "temp": 32.5, "humidity": 77, "rain_risk": 40, "weather_desc": "Rice Bowl Tropical Humidity",
                "districts": [
                    {"name": "Raipur", "base_tests": 0, "disease": "Paddy Sheath Blight", "pest": "Gall Midge", "risk": "HIGH", "temp": 33, "humidity": 76, "disease_intensity": 71, "pest_intensity": 73},
                    {"name": "Bilaspur", "base_tests": 0, "disease": "Rice Blast", "pest": "Stem Borer", "risk": "HIGH", "temp": 32, "humidity": 78, "disease_intensity": 68, "pest_intensity": 70},
                    {"name": "Durg", "base_tests": 0, "disease": "Pigeonpea Wilt", "pest": "Pod Fly", "risk": "MODERATE", "temp": 33, "humidity": 75, "disease_intensity": 59, "pest_intensity": 62},
                    {"name": "Bastar", "base_tests": 0, "disease": "Finger Millet Blast", "pest": "Shoot Fly", "risk": "LOW", "temp": 29, "humidity": 82, "disease_intensity": 49, "pest_intensity": 48},
                ]
            },
            {
                "id": "IN-UT", "name": "Uttarakhand", "capital": "Dehradun",
                "base_tests": 0, "base_disease_intensity": 63, "base_pest_intensity": 51,
                "dominant_disease": "Apple Scab", "dominant_pest": "Woolly Apple Aphid",
                "risk_level": "MODERATE", "temp": 22.4, "humidity": 82, "rain_risk": 50, "weather_desc": "Sub-Himalayan Cool & Damp Nights",
                "districts": [
                    {"name": "Nainital", "base_tests": 0, "disease": "Apple Scab", "pest": "Woolly Aphid", "risk": "HIGH", "temp": 20, "humidity": 86, "disease_intensity": 75, "pest_intensity": 58},
                    {"name": "Dehradun", "base_tests": 0, "disease": "Basmati Rice Blast", "pest": "Leaf Folder", "risk": "MODERATE", "temp": 25, "humidity": 80, "disease_intensity": 62, "pest_intensity": 54},
                    {"name": "Udham Singh Nagar", "base_tests": 0, "disease": "Wheat Yellow Rust", "pest": "Stem Borer", "risk": "HIGH", "temp": 27, "humidity": 82, "disease_intensity": 71, "pest_intensity": 59},
                ]
            },
            {
                "id": "IN-HP", "name": "Himachal Pradesh", "capital": "Shimla",
                "base_tests": 0, "base_disease_intensity": 67, "base_pest_intensity": 49,
                "dominant_disease": "Apple Powdery Mildew", "dominant_pest": "San Jose Scale",
                "risk_level": "HIGH", "temp": 18.2, "humidity": 84, "rain_risk": 45, "weather_desc": "Temperate Mountain Air / High Spore Lodging",
                "districts": [
                    {"name": "Shimla", "base_tests": 0, "disease": "Apple Powdery Mildew", "pest": "San Jose Scale", "risk": "HIGH", "temp": 17, "humidity": 86, "disease_intensity": 76, "pest_intensity": 56},
                    {"name": "Kullu", "base_tests": 0, "disease": "Apple Collar Rot", "pest": "Mites", "risk": "HIGH", "temp": 19, "humidity": 82, "disease_intensity": 70, "pest_intensity": 53},
                    {"name": "Kangra", "base_tests": 0, "disease": "Tea Blister Blight", "pest": "Tea Thrips", "risk": "MODERATE", "temp": 23, "humidity": 81, "disease_intensity": 60, "pest_intensity": 46},
                ]
            },
            {
                "id": "IN-JK", "name": "Jammu and Kashmir", "capital": "Srinagar",
                "base_tests": 0, "base_disease_intensity": 64, "base_pest_intensity": 48,
                "dominant_disease": "Apple Scab (Venturia inaequalis)", "dominant_pest": "Codling Moth",
                "risk_level": "HIGH", "temp": 17.5, "humidity": 80, "rain_risk": 40, "weather_desc": "Kashmir Valley Microclimate",
                "districts": [
                    {"name": "Baramulla", "base_tests": 0, "disease": "Apple Scab", "pest": "Codling Moth", "risk": "HIGH", "temp": 16, "humidity": 82, "disease_intensity": 76, "pest_intensity": 54},
                    {"name": "Shopian", "base_tests": 0, "disease": "Apple Alternaria Leaf Blotch", "pest": "Apple Stem Borer", "risk": "HIGH", "temp": 15, "humidity": 84, "disease_intensity": 71, "pest_intensity": 51},
                    {"name": "Jammu", "base_tests": 0, "disease": "Wheat Yellow Rust", "pest": "Aphids", "risk": "MODERATE", "temp": 24, "humidity": 75, "disease_intensity": 58, "pest_intensity": 50},
                ]
            },
            {
                "id": "IN-GA", "name": "Goa", "capital": "Panaji",
                "base_tests": 0, "base_disease_intensity": 48, "base_pest_intensity": 45,
                "dominant_disease": "Cashew Anthracnose", "dominant_pest": "Tea Mosquito Bug",
                "risk_level": "LOW", "temp": 30.2, "humidity": 86, "rain_risk": 40, "weather_desc": "Coastal Marine Climate",
                "districts": [
                    {"name": "North Goa", "base_tests": 0, "disease": "Cashew Anthracnose", "pest": "Tea Mosquito Bug", "risk": "LOW", "temp": 30, "humidity": 85, "disease_intensity": 51, "pest_intensity": 47},
                    {"name": "South Goa", "base_tests": 0, "disease": "Coconut Bud Rot", "pest": "Rhinoceros Beetle", "risk": "LOW", "temp": 30, "humidity": 87, "disease_intensity": 44, "pest_intensity": 42},
                ]
            },
            {
                "id": "IN-TR", "name": "Tripura", "capital": "Agartala",
                "base_tests": 0, "base_disease_intensity": 52, "base_pest_intensity": 46,
                "dominant_disease": "Rubber Powdery Mildew", "dominant_pest": "Shoot Borer",
                "risk_level": "LOW", "temp": 29.1, "humidity": 88, "rain_risk": 50, "weather_desc": "Humid Northeast Foothills",
                "districts": [
                    {"name": "West Tripura", "base_tests": 0, "disease": "Paddy Blast", "pest": "Stem Borer", "risk": "LOW", "temp": 29, "humidity": 87, "disease_intensity": 54, "pest_intensity": 48},
                    {"name": "South Tripura", "base_tests": 0, "disease": "Rubber Mildew", "pest": "Scale Insect", "risk": "LOW", "temp": 29, "humidity": 89, "disease_intensity": 49, "pest_intensity": 44},
                ]
            },
            {
                "id": "IN-ML", "name": "Meghalaya", "capital": "Shillong",
                "base_tests": 0, "base_disease_intensity": 55, "base_pest_intensity": 42,
                "dominant_disease": "Turmeric Rhizome Rot", "dominant_pest": "Citrus Trunk Borer",
                "risk_level": "LOW", "temp": 20.4, "humidity": 92, "rain_risk": 75, "weather_desc": "Cloud Forest & High Rainfall",
                "districts": [
                    {"name": "East Khasi Hills", "base_tests": 0, "disease": "Potato Late Blight", "pest": "Aphids", "risk": "MODERATE", "temp": 19, "humidity": 94, "disease_intensity": 61, "pest_intensity": 45},
                    {"name": "West Garo Hills", "base_tests": 0, "disease": "Arecanut Rot", "pest": "Trunk Borer", "risk": "LOW", "temp": 24, "humidity": 90, "disease_intensity": 49, "pest_intensity": 39},
                ]
            },
            {
                "id": "IN-SK", "name": "Sikkim", "capital": "Gangtok",
                "base_tests": 0, "base_disease_intensity": 46, "base_pest_intensity": 38,
                "dominant_disease": "Large Cardamom Chirke / Furkey", "dominant_pest": "Cardamom Aphid",
                "risk_level": "LOW", "temp": 17.6, "humidity": 89, "rain_risk": 60, "weather_desc": "Organic Mountain Agriculture",
                "districts": [
                    {"name": "East Sikkim", "base_tests": 0, "disease": "Cardamom Chirke Virus", "pest": "Aphid vector", "risk": "LOW", "temp": 18, "humidity": 88, "disease_intensity": 48, "pest_intensity": 40},
                    {"name": "West Sikkim", "base_tests": 0, "disease": "Ginger Soft Rot", "pest": "Shoot Borer", "risk": "LOW", "temp": 17, "humidity": 90, "disease_intensity": 43, "pest_intensity": 36},
                ]
            },
            {
                "id": "IN-MN", "name": "Manipur", "capital": "Imphal",
                "base_tests": 0, "base_disease_intensity": 49, "base_pest_intensity": 42,
                "dominant_disease": "Black Rice Blast", "dominant_pest": "Leaf Folder",
                "risk_level": "LOW", "temp": 24.2, "humidity": 86, "rain_risk": 45, "weather_desc": "Valley High Basin Moisture",
                "districts": [
                    {"name": "Imphal West", "base_tests": 0, "disease": "Chak-Hao Black Rice Blast", "pest": "Leaf Folder", "risk": "LOW", "temp": 24, "humidity": 85, "disease_intensity": 52, "pest_intensity": 44},
                    {"name": "Bishnupur", "base_tests": 0, "disease": "Vegetable Wilt", "pest": "Fruit Borer", "risk": "LOW", "temp": 25, "humidity": 87, "disease_intensity": 45, "pest_intensity": 40},
                ]
            },
            {
                "id": "IN-NL", "name": "Nagaland", "capital": "Kohima",
                "base_tests": 0, "base_disease_intensity": 47, "base_pest_intensity": 41,
                "dominant_disease": "Naga King Chilli Anthracnose", "dominant_pest": "Chilli Mites",
                "risk_level": "LOW", "temp": 21.3, "humidity": 87, "rain_risk": 50, "weather_desc": "Mountain Agro-Ecosystem",
                "districts": [
                    {"name": "Kohima", "base_tests": 0, "disease": "King Chilli Anthracnose", "pest": "Chilli Mites", "risk": "LOW", "temp": 20, "humidity": 88, "disease_intensity": 50, "pest_intensity": 43},
                    {"name": "Dimapur", "base_tests": 0, "disease": "Pineapple Heart Rot", "pest": "Mealybug", "risk": "LOW", "temp": 25, "humidity": 85, "disease_intensity": 43, "pest_intensity": 38},
                ]
            },
            {
                "id": "IN-MZ", "name": "Mizoram", "capital": "Aizawl",
                "base_tests": 0, "base_disease_intensity": 45, "base_pest_intensity": 39,
                "dominant_disease": "Ginger Bacterial Wilt", "dominant_pest": "Stem Fly",
                "risk_level": "LOW", "temp": 22.8, "humidity": 88, "rain_risk": 55, "weather_desc": "Sub-Tropical Highland Climate",
                "districts": [
                    {"name": "Aizawl", "base_tests": 0, "disease": "Ginger Bacterial Wilt", "pest": "Stem Fly", "risk": "LOW", "temp": 22, "humidity": 87, "disease_intensity": 48, "pest_intensity": 41},
                    {"name": "Lunglei", "base_tests": 0, "disease": "Banana Sigatoka", "pest": "Weevil", "risk": "LOW", "temp": 24, "humidity": 89, "disease_intensity": 42, "pest_intensity": 36},
                ]
            },
            {
                "id": "IN-AR", "name": "Arunachal Pradesh", "capital": "Itanagar",
                "base_tests": 0, "base_disease_intensity": 44, "base_pest_intensity": 37,
                "dominant_disease": "Citrus Greening", "dominant_pest": "Trunk Borer",
                "risk_level": "LOW", "temp": 21.0, "humidity": 86, "rain_risk": 55, "weather_desc": "Sub-Alpine & Tropical Transition",
                "districts": [
                    {"name": "Papum Pare", "base_tests": 0, "disease": "Mandarin Orange Scab", "pest": "Citrus Psylla", "risk": "LOW", "temp": 23, "humidity": 85, "disease_intensity": 47, "pest_intensity": 40},
                    {"name": "West Kameng", "base_tests": 0, "disease": "Apple Rust", "pest": "Aphids", "risk": "LOW", "temp": 17, "humidity": 88, "disease_intensity": 40, "pest_intensity": 33},
                ]
            },
            {
                "id": "IN-CH", "name": "Chandigarh", "capital": "Chandigarh",
                "base_tests": 0, "base_disease_intensity": 45, "base_pest_intensity": 42,
                "dominant_disease": "Rose Powdery Mildew", "dominant_pest": "Aphids",
                "risk_level": "LOW", "temp": 27.5, "humidity": 78, "rain_risk": 25, "weather_desc": "Northern Plains Micro-climate",
                "districts": [
                    {"name": "Chandigarh Urban/Rural", "base_tests": 0, "disease": "Ornamental Leaf Spot", "pest": "Aphids", "risk": "LOW", "temp": 27.5, "humidity": 78, "disease_intensity": 45, "pest_intensity": 42}
                ]
            },
            {
                "id": "IN-LA", "name": "Ladakh", "capital": "Leh",
                "base_tests": 0, "base_disease_intensity": 35, "base_pest_intensity": 30,
                "dominant_disease": "Apricot Dieback", "dominant_pest": "Codling Moth",
                "risk_level": "LOW", "temp": 12.0, "humidity": 35, "rain_risk": 5, "weather_desc": "Cold Arid High Altitude",
                "districts": [
                    {"name": "Leh", "base_tests": 0, "disease": "Apricot Gummosis", "pest": "Codling Moth", "risk": "LOW", "temp": 12, "humidity": 34, "disease_intensity": 38, "pest_intensity": 32},
                    {"name": "Kargil", "base_tests": 0, "disease": "Barley Rust", "pest": "Cutworm", "risk": "LOW", "temp": 13, "humidity": 37, "disease_intensity": 31, "pest_intensity": 28}
                ]
            },
            {
                "id": "IN-AN", "name": "Andaman and Nicobar", "capital": "Port Blair",
                "base_tests": 0, "base_disease_intensity": 58, "base_pest_intensity": 52,
                "dominant_disease": "Coconut Wilt", "dominant_pest": "Rhinoceros Beetle",
                "risk_level": "MODERATE", "temp": 29.5, "humidity": 92, "rain_risk": 75, "weather_desc": "Tropical Island Maritime",
                "districts": [
                    {"name": "South Andaman", "base_tests": 0, "disease": "Coconut Root Rot", "pest": "Rhinoceros Beetle", "risk": "MODERATE", "temp": 29.5, "humidity": 91, "disease_intensity": 60, "pest_intensity": 54},
                    {"name": "North & Middle Andaman", "base_tests": 0, "disease": "Arecanut Rot", "pest": "Stem Borer", "risk": "LOW", "temp": 29, "humidity": 93, "disease_intensity": 53, "pest_intensity": 48}
                ]
            },
            {
                "id": "IN-DN", "name": "Dadra and Nagar Haveli and Daman and Diu", "capital": "Daman",
                "base_tests": 0, "base_disease_intensity": 46, "base_pest_intensity": 48,
                "dominant_disease": "Paddy Blast", "dominant_pest": "Stem Borer",
                "risk_level": "LOW", "temp": 30.5, "humidity": 80, "rain_risk": 35, "weather_desc": "Coastal Western Plains",
                "districts": [
                    {"name": "Daman & Diu", "base_tests": 0, "disease": "Paddy Leaf Spot", "pest": "Stem Borer", "risk": "LOW", "temp": 30, "humidity": 81, "disease_intensity": 48, "pest_intensity": 49},
                    {"name": "Dadra & Nagar Haveli", "base_tests": 0, "disease": "Vegetable Mildew", "pest": "Fruit Fly", "risk": "LOW", "temp": 31, "humidity": 79, "disease_intensity": 44, "pest_intensity": 46}
                ]
            },
            {
                "id": "IN-LD", "name": "Lakshadweep", "capital": "Kavaratti",
                "base_tests": 0, "base_disease_intensity": 42, "base_pest_intensity": 40,
                "dominant_disease": "Coconut Leaf Blight", "dominant_pest": "Eriophyid Mite",
                "risk_level": "LOW", "temp": 30.0, "humidity": 89, "rain_risk": 60, "weather_desc": "Equatorial Archipelago",
                "districts": [
                    {"name": "Kavaratti / Agatti", "base_tests": 0, "disease": "Coconut Leaf Blight", "pest": "Eriophyid Mite", "risk": "LOW", "temp": 30, "humidity": 89, "disease_intensity": 42, "pest_intensity": 40}
                ]
            },
            {
                "id": "IN-PY", "name": "Puducherry", "capital": "Puducherry",
                "base_tests": 0, "base_disease_intensity": 54, "base_pest_intensity": 51,
                "dominant_disease": "Paddy Blast", "dominant_pest": "Stem Borer",
                "risk_level": "LOW", "temp": 31.2, "humidity": 84, "rain_risk": 40, "weather_desc": "Coromandel Coast Warmth",
                "districts": [
                    {"name": "Puducherry & Karaikal", "base_tests": 0, "disease": "Paddy Sheath Blight", "pest": "Stem Borer", "risk": "LOW", "temp": 31.2, "humidity": 84, "disease_intensity": 54, "pest_intensity": 51}
                ]
            }
        ]

        # Process real platform diagnosis tests from database
        db_tests_count = len(reports)
        state_tests_map: Dict[str, List[CropReportModel]] = {}
        district_tests_map: Dict[str, Dict[str, List[CropReportModel]]] = {}

        for rep in reports:
            loc = (rep.location_name or "").lower()
            issue = rep.condition_or_pest or rep.crop_identified or "Diagnosed Crop Anomaly"
            issue_type = rep.issue_type or "disease"

            matched_id = None
            if "maharashtra" in loc or "nagpur" in loc or "nashik" in loc or "pune" in loc:
                matched_id = "IN-MH"
            elif "punjab" in loc or "ludhiana" in loc or "amritsar" in loc:
                matched_id = "IN-PB"
            elif "haryana" in loc or "karnal" in loc or "hisar" in loc or "harsaru" in loc:
                matched_id = "IN-HR"
            elif "delhi" in loc:
                matched_id = "IN-DL"
            elif "uttar pradesh" in loc or "up" in loc or "lucknow" in loc or "meerut" in loc or "agra" in loc:
                matched_id = "IN-UP"
            elif "gujarat" in loc or "surat" in loc or "rajkot" in loc:
                matched_id = "IN-GJ"
            elif "madhya pradesh" in loc or "mp" in loc or "indore" in loc or "bhopal" in loc:
                matched_id = "IN-MP"
            elif "karnataka" in loc or "bengaluru" in loc:
                matched_id = "IN-KA"
            elif "andhra" in loc or "guntur" in loc:
                matched_id = "IN-AP"
            elif "telangana" in loc or "hyderabad" in loc:
                matched_id = "IN-TG"
            elif "tamil nadu" in loc or "chennai" in loc or "coimbatore" in loc:
                matched_id = "IN-TN"
            elif "rajasthan" in loc or "jaipur" in loc:
                matched_id = "IN-RJ"
            elif "bengal" in loc or "kolkata" in loc:
                matched_id = "IN-WB"
            elif "bihar" in loc or "patna" in loc:
                matched_id = "IN-BR"
            else:
                matched_id = "IN-DL"

            if matched_id not in state_tests_map:
                state_tests_map[matched_id] = []
            state_tests_map[matched_id].append(rep)

            # Match district
            matched_dist = None
            for s_def in state_definitions:
                if s_def["id"] == matched_id:
                    for d_def in s_def.get("districts", []):
                        d_name_lower = d_def["name"].lower()
                        if d_name_lower in loc or any(part in loc for part in d_name_lower.split()):
                            matched_dist = d_def["name"]
                            break
                    if not matched_dist and s_def.get("districts"):
                        matched_dist = s_def["districts"][0]["name"]
                    break

            if matched_id and matched_dist:
                if matched_id not in district_tests_map:
                    district_tests_map[matched_id] = {}
                if matched_dist not in district_tests_map[matched_id]:
                    district_tests_map[matched_id][matched_dist] = []
                district_tests_map[matched_id][matched_dist].append(rep)

        # Assemble finalized telemetry records according ONLY to actual tests conducted
        result_states = []
        total_platform_tests = db_tests_count
        total_high_risk_states = 0
        total_critical_states = 0

        for s in state_definitions:
            sid = s["id"]
            state_reports = state_tests_map.get(sid, [])
            tests_total = len(state_reports)

            if tests_total == 0:
                # No tests conducted yet for this state: default to 0
                dis_int = 0
                pest_int = 0
                overall_int = 0
                dominant_dis = "No disease reports logged"
                dominant_pst = "No pest reports logged"
                risk = "LOW"
            else:
                # Calculate strictly from real reports
                disease_count = 0
                pest_count = 0
                disease_names: Dict[str, int] = {}
                pest_names: Dict[str, int] = {}
                severity_scores: List[int] = []

                for r in state_reports:
                    issue = r.condition_or_pest or r.crop_identified or "Anomaly"
                    r_type = (r.issue_type or "disease").lower()
                    r_risk = (r.risk_level or "LOW").upper()

                    score = 25 if r_risk == "LOW" else (50 if r_risk == "MEDIUM" or r_risk == "MODERATE" else (75 if r_risk == "HIGH" else 95))
                    severity_scores.append(score)

                    if "pest" in r_type or any(k in issue.lower() for k in ["aphid", "pest", "borer", "thrips", "bug", "mite", "whitefly"]):
                        pest_count += 1
                        pest_names[issue] = pest_names.get(issue, 0) + 1
                    else:
                        disease_count += 1
                        disease_names[issue] = disease_names.get(issue, 0) + 1

                avg_sev = int(sum(severity_scores) / len(severity_scores)) if severity_scores else 50
                dis_int = avg_sev if disease_count > 0 else 0
                pest_int = avg_sev if pest_count > 0 else 0
                overall_int = avg_sev

                if overall_int >= 80:
                    risk = "CRITICAL"
                    total_critical_states += 1
                elif overall_int >= 65:
                    risk = "HIGH"
                    total_high_risk_states += 1
                elif overall_int >= 45:
                    risk = "MODERATE"
                else:
                    risk = "LOW"

                dominant_dis = max(disease_names, key=disease_names.get) if disease_names else "None diagnosed"
                dominant_pst = max(pest_names, key=pest_names.get) if pest_names else "None diagnosed"

            # District telemetry strictly based on real tests
            districts = []
            for d in s.get("districts", []):
                d_name = d["name"]
                d_reports = district_tests_map.get(sid, {}).get(d_name, [])
                d_tests = len(d_reports)

                if d_tests == 0:
                    dist_dis = 0
                    dist_pest = 0
                    dist_overall = 0
                    dist_risk = "LOW"
                    top_dis = "None logged"
                    top_pst = "None logged"
                else:
                    d_dis_names: Dict[str, int] = {}
                    d_pst_names: Dict[str, int] = {}
                    d_scores: List[int] = []
                    for r in d_reports:
                        issue = r.condition_or_pest or r.crop_identified or "Anomaly"
                        r_type = (r.issue_type or "disease").lower()
                        r_risk = (r.risk_level or "LOW").upper()
                        score = 25 if r_risk == "LOW" else (50 if r_risk == "MEDIUM" or r_risk == "MODERATE" else (75 if r_risk == "HIGH" else 95))
                        d_scores.append(score)
                        if "pest" in r_type or any(k in issue.lower() for k in ["aphid", "pest", "borer", "thrips", "bug", "mite", "whitefly"]):
                            d_pst_names[issue] = d_pst_names.get(issue, 0) + 1
                        else:
                            d_dis_names[issue] = d_dis_names.get(issue, 0) + 1

                    dist_overall = int(sum(d_scores) / len(d_scores)) if d_scores else 50
                    dist_dis = dist_overall if d_dis_names else 0
                    dist_pest = dist_overall if d_pst_names else 0
                    dist_risk = "CRITICAL" if dist_overall >= 80 else ("HIGH" if dist_overall >= 65 else ("MODERATE" if dist_overall >= 45 else "LOW"))
                    top_dis = max(d_dis_names, key=d_dis_names.get) if d_dis_names else "None diagnosed"
                    top_pst = max(d_pst_names, key=d_pst_names.get) if d_pst_names else "None diagnosed"

                districts.append({
                    "name": d_name,
                    "tests": d_tests,
                    "top_disease": top_dis,
                    "top_pest": top_pst,
                    "risk_level": dist_risk,
                    "temperature": d["temp"],
                    "humidity": d["humidity"],
                    "disease_intensity": dist_dis,
                    "pest_intensity": dist_pest,
                    "overall_intensity": dist_overall,
                })

            result_states.append({
                "id": sid,
                "name": s["name"],
                "capital": s["capital"],
                "total_tests": tests_total,
                "live_tests_conducted": tests_total,
                "disease_intensity": dis_int,
                "pest_intensity": pest_int,
                "overall_intensity": overall_int,
                "dominant_disease": dominant_dis,
                "dominant_pest": dominant_pst,
                "risk_level": risk,
                "weather": {
                    "temperature": s["temp"],
                    "humidity": s["humidity"],
                    "rain_risk": s["rain_risk"],
                    "description": s["weather_desc"]
                },
                "districts": districts,
                "district_count": len(districts),
            })

        return {
            "status": "success",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": {
                "total_field_tests": total_platform_tests,
                "verified_db_tests": db_tests_count,
                "total_states_monitored": len(result_states),
                "critical_zones_count": total_critical_states,
                "high_risk_zones_count": total_high_risk_states,
                "national_avg_humidity": 76,
                "highest_threat_crop": "Wheat & Cotton Foliage" if db_tests_count > 0 else "Awaiting Tests",
            },
            "states": result_states
        }


# Singleton Instance
db_service = DatabaseService()

