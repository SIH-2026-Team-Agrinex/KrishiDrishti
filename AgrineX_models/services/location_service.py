"""
services/location_service.py

Handles farm-level GPS coordinate intake, validation, source-tracking,
and normalization into a standardized location payload for downstream services.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class LocationSource(str, Enum):
    GPS = "gps"
    BROWSER_GPS = "browser_gps"
    OS_LOCATION = "os_location"
    MANUAL = "manual"
    IP_GEOLOCATION = "ip_geolocation"  # Fallback only - flagged low accuracy
    UNKNOWN = "unknown"


class LocationPayload(BaseModel):
    latitude: float = Field(..., description="Latitude in decimal degrees (-90.0 to 90.0)")
    longitude: float = Field(..., description="Longitude in decimal degrees (-180.0 to 180.0)")
    accuracy_m: Optional[float] = Field(default=None, description="Accuracy radius in meters")
    source: LocationSource = Field(default=LocationSource.UNKNOWN, description="Origin mechanism of location data")
    permission_granted: bool = Field(default=True, description="Whether location permission was granted by user/device")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp in UTC"
    )

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError(f"Latitude must be between -90 and 90 degrees. Got: {v}")
        return round(v, 6)

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError(f"Longitude must be between -180 and 180 degrees. Got: {v}")
        return round(v, 6)

    @field_validator("accuracy_m")
    @classmethod
    def validate_accuracy(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError(f"Accuracy in meters must be non-negative. Got: {v}")
        return round(v, 2) if v is not None else None


class LocationService:
    """
    Service responsible for constructing and validating location payloads.
    """

    @staticmethod
    def create_location(
        latitude: float,
        longitude: float,
        accuracy_m: Optional[float] = None,
        source: str = "manual",
        permission_granted: bool = True,
        timestamp: Optional[str] = None
    ) -> LocationPayload:
        """
        Validates and returns a standardized LocationPayload object.
        """
        try:
            enum_source = LocationSource(source.lower())
        except ValueError:
            enum_source = LocationSource.UNKNOWN

        iso_timestamp = timestamp or datetime.now(timezone.utc).isoformat()

        return LocationPayload(
            latitude=latitude,
            longitude=longitude,
            accuracy_m=accuracy_m,
            source=enum_source,
            permission_granted=permission_granted,
            timestamp=iso_timestamp
        )

    @staticmethod
    def get_manual_fallback(
        default_lat: float = 21.1458, 
        default_lon: float = 79.0882,
        notes: str = "Nagpur, MH Default"
    ) -> LocationPayload:
        """
        Provides a explicit manual fallback when hardware GPS/browser positioning fails or is denied.
        """
        return LocationPayload(
            latitude=default_lat,
            longitude=default_lon,
            accuracy_m=None,
            source=LocationSource.MANUAL,
            permission_granted=False,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
