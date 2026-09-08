import React, { useState, useEffect } from 'react';
import { useLocation } from '../contexts/LocationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { weatherService } from '../services/api/weatherService';
import { DailyForecast } from '../types/weather.types';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { AdvisoryCard } from '../components/dashboard/AdvisoryCard';
import { LocationBanner } from '../components/common/LocationBanner';
import { localizeDayName, localizeWeatherCondition } from '../utils/translations';
import { 
  CloudSun, 
  Calendar, 
  Droplets
} from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const { location } = useLocation();
  const { t, language } = useLanguage();
  const [daily, setDaily] = useState<DailyForecast[]>([]);

  useEffect(() => {
    const loadForecasts = async () => {
      try {
        const d = await weatherService.getDailyForecast(location);
        setDaily(d);
      } catch (err) {
        console.error('Failed to load forecasts:', err);
      }
    };
    loadForecasts();
  }, [location]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <LocationBanner />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-agro-700 uppercase tracking-wider mb-1">
            <CloudSun className="w-4 h-4 text-sky-600" />
            <span>{t('weather_widget_title')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            {t('weather_page_title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t('weather_page_sub')} {location.city}, {location.state}
          </p>
        </div>

        {/* Current Telemetry & AI Advisory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6">
            <WeatherWidget />
          </div>
          <div className="lg:col-span-6">
            <AdvisoryCard />
          </div>
        </div>

        {/* 7-Day Multi-Day Outlook */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-agro-100 text-agro-700 rounded-2xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('weather_7day_title')}</h3>
                <p className="text-xs text-slate-500">{t('weather_7day_sub')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
            {daily.map((day, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border text-center transition-all flex flex-col justify-between space-y-3 ${
                  idx === 0
                    ? 'bg-agro-50/80 border-agro-300 ring-2 ring-agro-100'
                    : 'bg-white border-slate-100 hover:border-agro-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{localizeDayName(day.dayName, language)}</div>
                  <div className="text-[10px] text-slate-400">{day.date}</div>
                </div>

                <div className="my-2">
                  <div className="text-lg font-extrabold text-slate-900">{day.maxTemp}°</div>
                  <div className="text-xs text-slate-400">{t('weather_min')} {day.minTemp}°</div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-1 text-xs text-sky-600 font-semibold">
                    <Droplets className="w-3 h-3" />
                    <span>{day.rainChance}% {t('weather_rain')}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {localizeWeatherCondition(day.condition, language)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};
