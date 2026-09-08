import React, { useState, useEffect } from 'react';
import { CurrentWeather, HourlyForecast } from '../../types/weather.types';
import { weatherService } from '../../services/api/weatherService';
import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizeWeatherCondition } from '../../utils/translations';
import { useNavigate } from 'react-router-dom';
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Sun, 
  CloudRain, 
  RefreshCw, 
  Sunrise,
  Sunset,
  ArrowRight
} from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const { location } = useLocation();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const [current, hours] = await Promise.all([
        weatherService.getCurrentWeather(location),
        weatherService.getHourlyForecast(location),
      ]);
      setWeather(current);
      setHourly(hours);
    } catch (e) {
      console.error('Failed to load weather:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [location]);

  if (loading && !weather) {
    return (
      <div className="glass-card rounded-3xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded-md w-1/3" />
        <div className="h-20 bg-slate-200 rounded-2xl w-full" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-slate-200 rounded-xl" />
          <div className="h-16 bg-slate-200 rounded-xl" />
          <div className="h-16 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-glass-hover hover:border-sky-300 group">
      {/* Subtle background glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-agro-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar - Clickable to open weather dashboard */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div 
          onClick={() => navigate('/weather')}
          className="flex items-center gap-2.5 cursor-pointer flex-1"
        >
          <div className="p-2 bg-sky-100 text-sky-700 rounded-2xl group-hover:scale-105 transition-transform">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5 group-hover:text-sky-700 transition-colors">
              <span>{t('weather_widget_title')}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-500">
              {location.city}, {location.state} • {t('weather_updated')} {new Date(weather.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fetchWeather();
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-agro-600 hover:bg-agro-50 transition-colors"
          title="Refresh Weather Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-agro-600' : ''}`} />
        </button>
      </div>

      {/* Hero Temperature Presentation - Clickable */}
      <div 
        onClick={() => navigate('/weather')}
        className="flex flex-wrap items-end justify-between gap-4 py-2 border-b border-agro-100/60 pb-5 mb-5 cursor-pointer hover:opacity-95"
      >
        <div className="flex items-baseline gap-3">
          <div className="text-5xl sm:text-6xl font-extrabold text-slate-900 tracking-tight font-heading">
            {weather.temperature}°<span className="text-2xl text-slate-500 font-normal">C</span>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-700">{t('weather_feels_like')} {weather.feelsLike}°C</div>
            <div className="text-xs text-agro-700 font-medium bg-agro-100/80 px-2 py-0.5 rounded-full inline-block">
              {localizeWeatherCondition(weather.condition, language)}
            </div>
          </div>
        </div>

        {/* Sun Times */}
        <div className="flex items-center gap-4 text-xs text-slate-600 bg-white/70 px-3.5 py-2 rounded-2xl border border-agro-100">
          <div className="flex items-center gap-1.5">
            <Sunrise className="w-4 h-4 text-amber-500" />
            <span>{weather.sunrise}</span>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5">
            <Sunset className="w-4 h-4 text-orange-500" />
            <span>{weather.sunset}</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards - Clickable */}
      <div 
        onClick={() => navigate('/weather')}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 cursor-pointer"
      >
        {/* Humidity */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-agro-100 shadow-sm flex flex-col justify-between hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('weather_humidity')}</span>
            <Droplets className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">{weather.humidity}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {weather.humidity > 75 ? t('weather_humidity_high') : t('weather_optimal')}
          </div>
        </div>

        {/* Rain Probability */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-agro-100 shadow-sm flex flex-col justify-between hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('weather_rain_chance')}</span>
            <CloudRain className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">{weather.precipitationProbability}%</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {weather.rainfall > 0 ? `${weather.rainfall}mm ${t('weather_fallen')}` : t('weather_dry_canopy')}
          </div>
        </div>

        {/* Wind Speed */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-agro-100 shadow-sm flex flex-col justify-between hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('weather_wind_speed')}</span>
            <Wind className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">{weather.windSpeed} km/h</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Dir: {weather.windDirection}</div>
        </div>

        {/* UV Index */}
        <div className="p-3.5 rounded-2xl bg-white/80 border border-agro-100 shadow-sm flex flex-col justify-between hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('weather_uv_index')}</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900">{weather.uvIndex} / 10</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {weather.uvIndex >= 6 ? t('weather_uv_high') : t('weather_uv_mod')}
          </div>
        </div>
      </div>

      {/* Hourly Timeline Slider - Clickable to full forecast */}
      <div 
        onClick={() => navigate('/weather')}
        className="pt-2 cursor-pointer"
      >
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2.5">
          <span>{t('weather_hourly_title')}</span>
          <span className="text-sky-600 hover:underline flex items-center gap-1 font-bold">
            {language === 'hi' ? '7-दिवसीय मौसम पूर्वानुमान देखें →' : language === 'haryanvi' ? '7-Din ka Pura Mausam Dekho →' : language === 'hinglish' ? '7-Din ka Forecast Dekhein →' : 'View 7-Day Agronomic Forecast →'}
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {hourly.map((hour, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 bg-white/70 border border-agro-100 hover:border-sky-200 rounded-2xl p-2.5 text-center min-w-[72px] transition-colors"
            >
              <div className="text-[11px] text-slate-500 mb-1">{hour.time}</div>
              <div className="text-sm font-bold text-slate-800">{hour.temp}°</div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-sky-600 mt-1">
                <Droplets className="w-2.5 h-2.5" />
                <span>{hour.rainChance}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
