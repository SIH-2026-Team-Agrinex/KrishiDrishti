"""
services/risk_engine.py

Fuses computer vision predictions with environmental (weather) and edaphic (soil) 
telemetry to produce a composite agricultural risk score and actionable mitigation steps.
"""

from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

from services.location_service import LocationPayload
from services.weather_service import WeatherPayload
from services.soil_service import SoilPayload


class VisionDetection(BaseModel):
    class_name: str
    confidence: float
    threshold_passed: bool


class RiskAssessment(BaseModel):
    overall_risk_score: float = Field(..., description="Unified risk score from 0.0 (Low) to 100.0 (Critical)")
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, or CRITICAL")
    disease_risk_index: float = Field(..., description="Environmental disease vulnerability (0-100)")
    pest_risk_index: float = Field(..., description="Environmental pest activity score (0-100)")
    soil_stress_index: float = Field(..., description="Soil constraint vulnerability score (0-100)")
    risk_factors: List[str] = Field(default_factory=list, description="Specific triggers elevating the risk score")
    agronomic_recommendations: List[str] = Field(default_factory=list, description="Targeted field directives")


class IntegratedRiskPayload(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    location: LocationPayload
    weather: Optional[WeatherPayload] = None
    soil: Optional[SoilPayload] = None
    detections: Dict[str, VisionDetection]
    assessment: RiskAssessment


class RiskEngine:
    """
    Multi-modal fusion engine calculating actionable agricultural risk vectors.
    """

    @classmethod
    def calculate_disease_index(cls, weather: Optional[WeatherPayload]) -> float:
        if not weather or not weather.success or not weather.current:
            return 30.0  # Default neutral risk

        curr = weather.current
        score = 0.0

        # Relative humidity driver (fungal pathogens thrive in >75% RH)
        if curr.relative_humidity_pct >= 85:
            score += 40.0
        elif curr.relative_humidity_pct >= 70:
            score += 25.0

        # Optimal temperature range for foliar diseases (18°C - 28°C)
        if 18.0 <= curr.temperature_c <= 28.0:
            score += 30.0

        # Precipitation factor
        if curr.rain_mm > 0.0:
            score += 20.0

        # High forecast probability adds remaining weight
        if weather.forecast and weather.forecast[0].precipitation_probability_pct > 60:
            score += 10.0

        return min(score, 100.0)

    @classmethod
    def calculate_pest_index(cls, weather: Optional[WeatherPayload]) -> float:
        if not weather or not weather.success or not weather.current:
            return 30.0

        curr = weather.current
        score = 0.0

        # Warm temperature range (22°C - 35°C accelerates pest life cycle)
        if 22.0 <= curr.temperature_c <= 35.0:
            score += 40.0

        # Dry conditions favor certain pests (e.g., mites, aphids)
        if curr.relative_humidity_pct < 60:
            score += 30.0

        # Low wind speed allows pest flight/dispersal
        if curr.wind_speed_kmh <= 15.0:
            score += 20.0

        if curr.rain_mm == 0.0:
            score += 10.0

        return min(score, 100.0)

    @classmethod
    def calculate_soil_stress_index(cls, soil: Optional[SoilPayload]) -> float:
        if not soil or not soil.success or not soil.properties:
            return 25.0

        sp = soil.properties
        score = 0.0

        # Non-optimal pH (<5.8 or >7.5 limits nutrient availability)
        if sp.ph_water < 5.5 or sp.ph_water > 7.8:
            score += 40.0
        elif sp.ph_water < 6.0 or sp.ph_water > 7.2:
            score += 20.0

        # High clay content causes poor drainage and aeration
        if sp.clay_pct >= 40.0:
            score += 35.0

        # Low organic matter limits biological resilience
        if sp.organic_carbon_g_kg < 10.0:
            score += 25.0

        return min(score, 100.0)

    @classmethod
    def evaluate(
        cls,
        location: LocationPayload,
        weather: Optional[WeatherPayload],
        soil: Optional[SoilPayload],
        disease_detection: VisionDetection,
        pest_detection: VisionDetection
    ) -> IntegratedRiskPayload:
        
        disease_idx = cls.calculate_disease_index(weather)
        pest_idx = cls.calculate_pest_index(weather)
        soil_idx = cls.calculate_soil_stress_index(soil)

        risk_factors = []
        recommendations = []

        # Vision Score Weighting
        vision_score = 0.0
        if disease_detection.threshold_passed and disease_detection.class_name != "Healthy":
            vision_score += disease_detection.confidence * 60.0
            risk_factors.append(f"Visual detection of {disease_detection.class_name} ({disease_detection.confidence:.1%})")
            recommendations.append(f"Isolate affected crop zones and inspect for signs of {disease_detection.class_name}.")

        if pest_detection.threshold_passed and pest_detection.class_name != "Healthy":
            vision_score += pest_detection.confidence * 40.0
            risk_factors.append(f"Visual detection of {pest_detection.class_name} ({pest_detection.confidence:.1%})")
            recommendations.append(f"Deploy sticky traps or targeted bio-pesticides for {pest_detection.class_name}.")

        # Environmental Risk triggers
        if disease_idx >= 60.0:
            risk_factors.append("High ambient humidity/rainfall favoring fungal proliferation")
            recommendations.append("Delay overhead irrigation to prevent leaf wetness duration.")

        if pest_idx >= 60.0:
            risk_factors.append("Warm, low-wind conditions favoring pest reproduction and flight")

        if soil_idx >= 50.0:
            risk_factors.append("Sub-optimal soil parameters (pH/drainage/organic carbon)")
            recommendations.append("Consider soil amendments (e.g., lime/gypsum) based on pH and texture profile.")

        # Weighted Composite Score
        vision_weight = min(vision_score, 100.0)
        overall_score = (0.40 * vision_weight) + (0.30 * disease_idx) + (0.15 * pest_idx) + (0.15 * soil_idx)
        overall_score = round(min(overall_score, 100.0), 1)

        # Categorize Risk Level
        if overall_score >= 75.0:
            level = "CRITICAL"
        elif overall_score >= 50.0:
            level = "HIGH"
        elif overall_score >= 25.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        if not recommendations:
            recommendations.append("Current conditions are favorable. Continue standard monitoring schedule.")

        assessment = RiskAssessment(
            overall_risk_score=overall_score,
            risk_level=level,
            disease_risk_index=round(disease_idx, 1),
            pest_risk_index=round(pest_idx, 1),
            soil_stress_index=round(soil_idx, 1),
            risk_factors=risk_factors,
            agronomic_recommendations=recommendations
        )

        return IntegratedRiskPayload(
            location=location,
            weather=weather,
            soil=soil,
            detections={
                "disease": disease_detection,
                "pest": pest_detection
            },
            assessment=assessment
        )
