"""
services/weather_service.py

Retrieves current weather and forecast telemetry from Open-Meteo API using farm coordinates.
Transforms raw environmental data into structured payloads for downstream risk assessment.
"""

from datetime import datetime, timezone
from typing import List, Optional
import requests
from pydantic import BaseModel, Field

from services.location_service import LocationPayload


class CurrentWeather(BaseModel):
    temperature_c: float = Field(..., description="Current temperature in Celsius")
    relative_humidity_pct: float = Field(..., description="Relative humidity percentage (0-100)")
    precipitation_mm: float = Field(..., description="Current precipitation rate in mm")
    rain_mm: float = Field(..., description="Current rainfall rate in mm")
    wind_speed_kmh: float = Field(..., description="Current wind speed in km/h")


class DailyForecast(BaseModel):
    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    temp_max_c: float = Field(..., description="Daily maximum temperature in Celsius")
    temp_min_c: float = Field(..., description="Daily minimum temperature in Celsius")
    precipitation_total_mm: float = Field(..., description="Total expected precipitation in mm")
    rain_total_mm: float = Field(..., description="Total expected rain in mm")
    precipitation_probability_pct: int = Field(..., description="Probability of precipitation (0-100)")


class WeatherPayload(BaseModel):
    latitude: float
    longitude: float
    current: Optional[CurrentWeather] = None
    forecast: List[DailyForecast] = Field(default_factory=list)
    source: str = "Open-Meteo API"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp in UTC"
    )
    success: bool = True
    error_message: Optional[str] = None


class WeatherService:
    """
    Service responsible for fetching and parsing agricultural weather metrics.
    """

    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    @classmethod
    def get_weather(
        cls,
        latitude: float,
        longitude: float,
        forecast_days: int = 3,
        timeout_sec: int = 10
    ) -> WeatherPayload:
        """
        Fetches current weather and N-day forecast from Open-Meteo API.
        """
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "precipitation",
                "rain",
                "wind_speed_10m"
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "rain_sum",
                "precipitation_probability_max"
            ],
            "timezone": "auto",
            "forecast_days": min(max(forecast_days, 1), 7)
        }

        try:
            response = requests.get(cls.BASE_URL, params=params, timeout=timeout_sec)
            response.raise_for_status()
            data = response.json()

            # Parse Current Weather
            curr_raw = data.get("current", {})
            current_weather = CurrentWeather(
                temperature_c=float(curr_raw.get("temperature_2m", 0.0)),
                relative_humidity_pct=float(curr_raw.get("relative_humidity_2m", 0.0)),
                precipitation_mm=float(curr_raw.get("precipitation", 0.0)),
                rain_mm=float(curr_raw.get("rain", 0.0)),
                wind_speed_kmh=float(curr_raw.get("wind_speed_10m", 0.0))
            )

            # Parse Daily Forecast
            daily_raw = data.get("daily", {})
            dates = daily_raw.get("time", [])
            t_max = daily_raw.get("temperature_2m_max", [])
            t_min = daily_raw.get("temperature_2m_min", [])
            p_sum = daily_raw.get("precipitation_sum", [])
            r_sum = daily_raw.get("rain_sum", [])
            p_prob = daily_raw.get("precipitation_probability_max", [])

            forecast_list = []
            for i in range(len(dates)):
                forecast_list.append(
                    DailyForecast(
                        date=dates[i],
                        temp_max_c=float(t_max[i]) if i < len(t_max) and t_max[i] is not None else 0.0,
                        temp_min_c=float(t_min[i]) if i < len(t_min) and t_min[i] is not None else 0.0,
                        precipitation_total_mm=float(p_sum[i]) if i < len(p_sum) and p_sum[i] is not None else 0.0,
                        rain_total_mm=float(r_sum[i]) if i < len(r_sum) and r_sum[i] is not None else 0.0,
                        precipitation_probability_pct=int(p_prob[i]) if i < len(p_prob) and p_prob[i] is not None else 0
                    )
                )

            return WeatherPayload(
                latitude=latitude,
                longitude=longitude,
                current=current_weather,
                forecast=forecast_list,
                source="Open-Meteo API",
                success=True
            )

        except requests.RequestException as e:
            return WeatherPayload(
                latitude=latitude,
                longitude=longitude,
                current=None,
                forecast=[],
                source="Open-Meteo API",
                success=False,
                error_message=f"Network error fetching weather data: {str(e)}"
            )
        except Exception as e:
            return WeatherPayload(
                latitude=latitude,
                longitude=longitude,
                current=None,
                forecast=[],
                source="Open-Meteo API",
                success=False,
                error_message=f"Failed to parse weather payload: {str(e)}"
            )

    @classmethod
    def get_weather_for_location(
        cls,
        location: LocationPayload,
        forecast_days: int = 3
    ) -> WeatherPayload:
        """
        Convenience wrapper accepting a LocationPayload object directly.
        """
        return cls.get_weather(
            latitude=location.latitude,
            longitude=location.longitude,
            forecast_days=forecast_days
        )
