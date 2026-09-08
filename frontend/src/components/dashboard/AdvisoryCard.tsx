import React, { useEffect, useState } from 'react';
import { WeatherAdvisory, RiskLevel } from '../../types/weather.types';
import { advisoryService } from '../../services/api/advisoryService';
import { weatherService } from '../../services/api/weatherService';
import { useLocation } from '../../contexts/LocationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  SprayCan, 
  Waves, 
  Sprout, 
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const AdvisoryCard: React.FC = () => {
  const { location } = useLocation();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [advisory, setAdvisory] = useState<WeatherAdvisory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdvisory = async () => {
      setLoading(true);
      try {
        const weather = await weatherService.getCurrentWeather(location);
        const adv = await advisoryService.getWeatherAdvisory(weather, undefined, language);
        setAdvisory(adv);
      } catch (err) {
        console.error('Failed to compute advisory:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAdvisory();
  }, [location, language]);

  if (loading && !advisory) {
    return (
      <div className="glass-card rounded-3xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded-md w-1/2" />
        <div className="h-24 bg-slate-200 rounded-2xl w-full" />
      </div>
    );
  }

  if (!advisory) return null;

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
          label: 'CRITICAL RISK',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          label: 'HIGH RISK',
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
          label: 'MODERATE RISK',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label: 'LOW RISK',
        };
    }
  };

  const riskBadge = getRiskBadge(advisory?.overallRisk || 'LOW');
  const spraying = advisory?.sprayingRecommendation;
  const irrigation = advisory?.irrigationRecommendation;
  const fert = advisory?.fertilizationRecommendation;
  const disease = advisory?.diseaseRiskFactors;

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-glass-hover group">
      {/* Top Header with Risk Level - Clickable */}
      <div 
        onClick={() => navigate('/weather')}
        className="flex flex-wrap items-center justify-between gap-3 mb-4 cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-agro-100 text-agro-700 rounded-2xl group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5 group-hover:text-agro-700 transition-colors">
              <span>{t('advisory_card_title')}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <p className="text-xs text-slate-500">{t('advisory_card_sub')}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${riskBadge.bg} shadow-sm`}>
          {riskBadge.icon}
          <span>{riskBadge.label}</span>
        </div>
      </div>

      {/* Advisory Headline - Clickable */}
      <div 
        onClick={() => navigate('/weather')}
        className="p-4 rounded-2xl bg-gradient-to-r from-agro-50 to-emerald-50/50 border border-agro-200/80 mb-5 cursor-pointer hover:border-agro-400 transition-colors"
      >
        <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
          {advisory.headline || 'Optimal weather conditions for routine field maintenance, crop scouting, and fertigation.'}
        </p>
      </div>

      {/* 3 Core Agricultural Operation Pillars - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5">
        
        {/* Spraying */}
        <div 
          onClick={() => navigate('/weather')}
          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-agro-400 transition-all hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <SprayCan className="w-4 h-4 text-agro-600" />
                {t('advisory_spray')}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                spraying?.status === 'FAVORABLE' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : spraying?.status === 'CAUTION' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {spraying?.status || 'FAVORABLE'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {spraying?.reason || 'Clear skies and calm winds provide an optimal spray window.'}
            </p>
          </div>
          {spraying?.optimalWindow && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs text-agro-700 font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('advisory_optimal_win')}: {spraying.optimalWindow}</span>
            </div>
          )}
        </div>

        {/* Irrigation */}
        <div 
          onClick={() => navigate('/weather')}
          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-sky-400 transition-all hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-sky-600" />
                {t('advisory_irrigation')}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                irrigation?.status === 'RECOMMENDED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : irrigation?.status === 'NORMAL'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {irrigation?.status || 'NORMAL'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {irrigation?.reason || 'Standard soil moisture balance. Follow standard scheduled cycle.'}
            </p>
          </div>
          {irrigation?.amount && (
            <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
              {t('advisory_target')}: {irrigation.amount}
            </div>
          )}
        </div>

        {/* Fertilization */}
        <div 
          onClick={() => navigate('/weather')}
          className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-emerald-400 transition-all hover:shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                {t('advisory_fertilizer')}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                fert?.status === 'PROCEED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {fert?.status || 'PROCEED'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {fert?.reason || 'Favorable soil uptake conditions for micro-nutrients and NPK fertigation.'}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Risk: {disease?.fungalRisk || 'LOW'} {t('advisory_risk_fungal')}
          </div>
        </div>

      </div>

      {/* Action Footer CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-agro-100/60">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-agro-600" />
          <span>{t('advisory_notice_spots')}</span>
        </div>
        <Link
          to="/crop-analysis"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-agro-700 hover:text-agro-800 bg-agro-100/80 hover:bg-agro-200/80 px-3.5 py-1.5 rounded-full transition-colors"
        >
          <span>{t('advisory_diagnose_now')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
