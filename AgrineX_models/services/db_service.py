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


# Singleton Instance
db_service = DatabaseService()
