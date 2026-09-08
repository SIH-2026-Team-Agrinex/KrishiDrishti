import { CurrentWeather, DailyForecast, HourlyForecast, LocationInfo } from '../../types/weather.types';
import { INITIAL_WEATHER_DATA } from '../db/seedData';
import { apiClient, ENV_CONFIG } from './apiClient';

export const weatherService = {
  async getCurrentWeather(location?: LocationInfo): Promise<CurrentWeather> {
    // 1. Check custom FastAPI backend endpoint if configured
    if (!ENV_CONFIG.USE_LOCAL_DB && ENV_CONFIG.WEATHER_API_URL) {
      try {
        return await apiClient<CurrentWeather>(`${ENV_CONFIG.WEATHER_API_URL}/current`, {
          params: {
            lat: location?.latitude || 19.9975,
            lon: location?.longitude || 73.7898,
          },
        });
      } catch (e) {
        console.warn('Backend weather endpoint error, attempting Open-Meteo or local fallback', e);
      }
    }

    // 2. Optional Live Open-Meteo free API for live real-time GPS telemetry
    if (ENV_CONFIG.ENABLE_LIVE_OPEN_METEO && location?.latitude && location?.longitude) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m&daily=sunrise,sunset,uv_index_max&timezone=auto`
        );
        if (res.ok) {
          const data = await res.json();
          const current = data.current;
          const daily = data.daily;
          
          return {
            temperature: Math.round(current.temperature_2m * 10) / 10,
            feelsLike: Math.round(current.apparent_temperature * 10) / 10,
            humidity: Math.round(current.relative_humidity_2m),
            windSpeed: Math.round(current.wind_speed_10m * 10) / 10,
            windDirection: `${Math.round(current.wind_direction_10m)}°`,
            rainfall: current.rain || 0,
            precipitationProbability: current.precipitation > 0 ? 80 : 15,
            pressure: Math.round(current.surface_pressure),
            uvIndex: daily?.uv_index_max?.[0] || 6,
            visibility: 9.2,
            cloudCover: current.cloud_cover,
            condition: getWeatherConditionFromCode(current.weather_code),
            conditionCode: `code-${current.weather_code}`,
            icon: getWeatherIconFromCode(current.weather_code),
            sunrise: daily?.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "05:48 AM",
            sunset: daily?.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "06:45 PM",
            lastUpdated: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn('Open-Meteo live API unreachable, using local telemetry seed:', err);
      }
    }

    // 3. Realistic Seed Fallback
    return {
      ...INITIAL_WEATHER_DATA,
      lastUpdated: new Date().toISOString(),
    };
  },

  async getHourlyForecast(location?: LocationInfo): Promise<HourlyForecast[]> {
    const hours = ['Now', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM', '12 AM', '6 AM', '9 AM'];
    const temps = [28, 30, 29, 27, 25, 23, 22, 24, 27];
    const rains = [10, 15, 35, 40, 25, 10, 5, 5, 10];

    return hours.map((hour, idx) => ({
      time: hour,
      temp: temps[idx],
      rainChance: rains[idx],
      icon: rains[idx] > 30 ? 'cloud-rain' : 'sun',
      condition: rains[idx] > 30 ? 'Showers' : 'Partly Cloudy',
    }));
  },

  async getDailyForecast(location?: LocationInfo): Promise<DailyForecast[]> {
    const days = ['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days.map((day, i) => ({
      date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
      dayName: day,
      maxTemp: 31 - (i % 3),
      minTemp: 21 + (i % 2),
      rainChance: [35, 60, 20, 10, 15, 40, 25][i],
      condition: [
        'Scattered Showers',
        'Thunderstorms',
        'Partly Sunny',
        'Clear & Sunny',
        'Breezy Sunshine',
        'Afternoon Rain',
        'Mild & Clear'
      ][i],
      icon: [
        'cloud-sun-rain',
        'cloud-lightning',
        'cloud-sun',
        'sun',
        'sun',
        'cloud-rain',
        'sun'
      ][i],
    }));
  }
};

function getWeatherConditionFromCode(code: number): string {
  if (code === 0) return 'Clear Sky & Bright Sunshine';
  if (code >= 1 && code <= 3) return 'Partly Cloudy with Good Visibility';
  if (code >= 45 && code <= 48) return 'Morning Fog / Mist';
  if (code >= 51 && code <= 55) return 'Light Drizzle & High Humidity';
  if (code >= 61 && code <= 65) return 'Moderate to Heavy Rainfall';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm Activity';
  return 'Overcast / Mildly Humid';
}

function getWeatherIconFromCode(code: number): string {
  if (code === 0) return 'sun';
  if (code >= 1 && code <= 3) return 'cloud-sun';
  if (code >= 45 && code <= 48) return 'cloud-fog';
  if (code >= 51 && code <= 65) return 'cloud-rain';
  if (code >= 95) return 'cloud-lightning';
  return 'cloud';
}
