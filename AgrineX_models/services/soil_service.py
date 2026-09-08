"""
services/soil_service.py

Retrieves topsoil properties (0-15cm) from ISRIC SoilGrids REST API using farm coordinates.
Transforms raw physical/chemical properties into structured payloads for disease/soil health risk scoring.
"""

from datetime import datetime, timezone
from typing import Optional
import requests
from pydantic import BaseModel, Field

from services.location_service import LocationPayload


class SoilProperties(BaseModel):
    ph_water: float = Field(..., description="Soil pH measured in H2O (4.0 - 9.0 scale)")
    clay_pct: float = Field(..., description="Clay content percentage (0-100%)")
    sand_pct: float = Field(..., description="Sand content percentage (0-100%)")
    silt_pct: float = Field(..., description="Silt content percentage (0-100%)")
    organic_carbon_g_kg: float = Field(..., description="Soil organic carbon in g/kg")
    bulk_density_cg_cm3: float = Field(..., description="Soil bulk density in cg/cm³ (compaction indicator)")
    texture_class: str = Field(..., description="Estimated soil texture class (e.g., Clay, Loam, Sandy Loam)")


class SoilPayload(BaseModel):
    latitude: float
    longitude: float
    properties: Optional[SoilProperties] = None
    source: str = "ISRIC SoilGrids v2.0 REST API"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp in UTC"
    )
    success: bool = True
    error_message: Optional[str] = None


class SoilService:
    """
    Service responsible for querying ISRIC SoilGrids REST API for geospatial topsoil parameters.
    """

    BASE_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"

    @staticmethod
    def _determine_texture(clay: float, sand: float, silt: float) -> str:
        """Simple USDA soil texture triangle classification heuristic."""
        if clay >= 40:
            return "Clay"
        elif sand >= 65:
            return "Sandy"
        elif silt >= 50:
            return "Silty"
        elif 20 <= clay <= 35 and sand >= 45:
            return "Sandy Clay Loam"
        elif 27 <= clay <= 40 and sand <= 20:
            return "Silty Clay Loam"
        else:
            return "Loam"

    @classmethod
    def get_soil_data(
        cls,
        latitude: float,
        longitude: float,
        timeout_sec: int = 12
    ) -> SoilPayload:
        """
        Fetches topsoil properties for 0-5cm and 5-15cm depths and computes weighted mean.
        """
        params = {
            "lat": latitude,
            "lon": longitude,
            "property": ["phh2o", "clay", "sand", "silt", "soc", "bdod"],
            "depth": ["0-5cm", "5-15cm"],
            "value": "mean"
        }

        try:
            response = requests.get(cls.BASE_URL, params=params, timeout=timeout_sec)
            response.raise_for_status()
            data = response.json()

            layers = data.get("properties", {}).get("layers", [])
            extracted = {}

            for layer in layers:
                prop_name = layer.get("name")
                depths = layer.get("depths", [])
                
                # Average values across 0-5cm and 5-15cm depths
                values = [
                    d.get("values", {}).get("mean") 
                    for d in depths 
                    if d.get("values", {}).get("mean") is not None
                ]

                if values:
                    avg_val = sum(values) / len(values)
                    extracted[prop_name] = avg_val

            # Standard SoilGrids unit scaling:
            # phh2o: pH * 10
            # clay/sand/silt: g/kg (divide by 10 to get %)
            # soc: dg/kg (divide by 10 to get g/kg)
            # bdod: cg/cm³
            ph = extracted.get("phh2o", 65.0) / 10.0
            clay = extracted.get("clay", 250.0) / 10.0
            sand = extracted.get("sand", 400.0) / 10.0
            silt = extracted.get("silt", 350.0) / 10.0
            soc = extracted.get("soc", 150.0) / 10.0
            bdod = float(extracted.get("bdod", 130.0))

            texture = cls._determine_texture(clay, sand, silt)

            soil_props = SoilProperties(
                ph_water=round(ph, 2),
                clay_pct=round(clay, 1),
                sand_pct=round(sand, 1),
                silt_pct=round(silt, 1),
                organic_carbon_g_kg=round(soc, 2),
                bulk_density_cg_cm3=round(bdod, 1),
                texture_class=texture
            )

            return SoilPayload(
                latitude=latitude,
                longitude=longitude,
                properties=soil_props,
                source="ISRIC SoilGrids v2.0 REST API",
                success=True
            )

        except requests.RequestException as e:
            return SoilPayload(
                latitude=latitude,
                longitude=longitude,
                properties=None,
                source="ISRIC SoilGrids v2.0 REST API",
                success=False,
                error_message=f"Network error fetching soil data: {str(e)}"
            )
        except Exception as e:
            return SoilPayload(
                latitude=latitude,
                longitude=longitude,
                properties=None,
                source="ISRIC SoilGrids v2.0 REST API",
                success=False,
                error_message=f"Failed to parse soil payload: {str(e)}"
            )

    @classmethod
    def get_soil_for_location(cls, location: LocationPayload) -> SoilPayload:
        """
        Convenience wrapper accepting a LocationPayload object directly.
        """
        return cls.get_soil_data(
            latitude=location.latitude,
            longitude=location.longitude
        )
