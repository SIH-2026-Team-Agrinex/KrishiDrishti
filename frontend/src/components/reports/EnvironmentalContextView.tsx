import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizeWeatherCondition } from '../../utils/translations';
import { CloudSun, Droplets, CloudRain, Thermometer, Info } from 'lucide-react';

interface EnvironmentalContextViewProps {
  environment: {
    temperature: number;
    humidity: number;
    rainProbability: number;
    condition: string;
    recordedAt: string;
  };
  whyHappening: string;
  environmentalCorrelation: string;
}

export const EnvironmentalContextView: React.FC<EnvironmentalContextViewProps> = ({
  environment,
  whyHappening,
  environmentalCorrelation,
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-sky-100 text-sky-700 rounded-2xl">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {t('rep_env_title')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('rep_env_sub')}
          </p>
        </div>
      </div>

      {/* 4 Environment Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <Thermometer className="w-6 h-6 text-rose-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">{t('rep_temperature')}</div>
            <div className="text-base font-bold text-slate-900">{environment.temperature}°C</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <Droplets className="w-6 h-6 text-sky-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">{t('rep_humidity')}</div>
            <div className="text-base font-bold text-slate-900">{environment.humidity}%</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <CloudRain className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">{t('rep_rain_prob')}</div>
            <div className="text-base font-bold text-slate-900">{environment.rainProbability}%</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
          <CloudSun className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <div>
            <div className="text-xs text-slate-500">{t('rep_atmosphere')}</div>
            <div className="text-xs font-bold text-slate-800 truncate">
              {localizeWeatherCondition(environment.condition, language)}
            </div>
          </div>
        </div>
      </div>

      {/* AI Correlation Reasoning */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-100 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
          <Info className="w-4 h-4 text-sky-600" />
          <span>{t('rep_etiology')}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          {whyHappening}
        </p>
        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-sky-200/60">
          <strong>{t('rep_weather_impact')}</strong> {environmentalCorrelation}
        </p>
      </div>
    </div>
  );
};
