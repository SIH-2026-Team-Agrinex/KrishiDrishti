import React from 'react';
import { ShieldCheck, AlertCircle, Microscope, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { CropAnalysisReport } from '../../types/analysis.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const QuickStats: React.FC<{ reports: CropAnalysisReport[] }> = ({ reports }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const total = reports.length;
  const criticalCount = reports.filter((r) => r.aiAdvisory.overallRiskLevel === 'CRITICAL').length;
  const healthScore = total > 0 ? Math.round(((total - criticalCount) / total) * 100) : 94;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Farm Health Gauge -> Opens History */}
      <div 
        onClick={() => navigate('/history')}
        className="glass-card rounded-3xl p-5 flex items-center justify-between cursor-pointer hover:border-agro-400 hover:shadow-glass-hover transition-all duration-200 group"
      >
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <span>{t('dash_health_index')}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {healthScore}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t('dash_optimal_vigour')}</span>
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-agro-600 to-emerald-400 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-agro-600/20 group-hover:scale-105 transition-transform">
          <ShieldCheck className="w-7 h-7" />
        </div>
      </div>

      {/* 2. Total Analyses -> Opens History */}
      <div 
        onClick={() => navigate('/history')}
        className="glass-card rounded-3xl p-5 flex items-center justify-between cursor-pointer hover:border-agro-400 hover:shadow-glass-hover transition-all duration-200 group"
      >
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <span>{t('dash_total_diag')}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            {total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {t('dash_archived')}
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Microscope className="w-7 h-7" />
        </div>
      </div>

      {/* 3. Active Disease Alerts -> Opens Crop Analysis / History */}
      <div 
        onClick={() => navigate(criticalCount > 0 ? '/history' : '/crop-analysis')}
        className="glass-card rounded-3xl p-5 flex items-center justify-between cursor-pointer hover:border-rose-300 hover:shadow-glass-hover transition-all duration-200 group"
      >
        <div>
          <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <span>{t('dash_high_alerts')}</span>
            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-heading">
            {criticalCount}
          </div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">
            {criticalCount > 0 ? t('dash_spray_req') : t('dash_no_alerts')}
          </div>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
          <AlertCircle className="w-7 h-7" />
        </div>
      </div>

      {/* 4. Quick Analyze CTA -> Opens Crop Analysis */}
      <div 
        onClick={() => navigate('/crop-analysis')}
        className="rounded-3xl p-5 bg-gradient-to-br from-agro-700 via-agro-800 to-slate-900 text-white shadow-xl shadow-agro-900/20 flex flex-col justify-between cursor-pointer hover:scale-[1.02] transition-all group"
      >
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-agro-300 uppercase tracking-wider">{t('dash_instant_check')}</span>
            <Sparkles className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="font-bold text-base text-white">{t('dash_analyze_health')}</div>
        </div>
        <div className="mt-3 w-full text-center bg-agro-500 group-hover:bg-agro-400 text-agro-950 font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-md">
          {t('dash_upload_cta')}
        </div>
      </div>
    </div>
  );
};
