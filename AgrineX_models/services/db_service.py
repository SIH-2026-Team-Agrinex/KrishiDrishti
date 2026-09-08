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
    create_engine, Column, String, Float, Text, DateTime, desc
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session

Base = declarative_base()


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
            print(f"[DB INFO] Database initialized & schema verified successfully ({self.db_type}).")
        except Exception as e:
            print(f"[DB ERROR] Could not initialize database ({db_url}): {e}")
            self.engine = None
            self.SessionLocal = None

    def get_session(self) -> Optional[Session]:
        if self.SessionLocal:
            return self.SessionLocal()
        return None

    def save_report(self, report: Dict[str, Any]) -> bool:
        """Saves a new scan report into the database."""
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
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Retrieves scan history with filtering."""
        session = self.get_session()
        if not session:
            return []

        try:
            query = session.query(CropReportModel).order_by(desc(CropReportModel.created_at))

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
