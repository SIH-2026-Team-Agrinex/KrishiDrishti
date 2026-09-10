import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from '../contexts/LocationContext';
import { WeatherWidget } from '../components/dashboard/WeatherWidget';
import { AdvisoryCard } from '../components/dashboard/AdvisoryCard';
import { QuickStats } from '../components/dashboard/QuickStats';
import { LocationBanner } from '../components/common/LocationBanner';
import { historyService } from '../services/api/historyService';
import { CropAnalysisReport } from '../types/analysis.types';
import { localizeRiskBadge, formatLocalizedDate } from '../utils/translations';
import { localizeReportData } from '../utils/reportLocalizer';
import { 
  Microscope, 
  ChevronRight, 
  Calendar, 
  ArrowUpRight, 
  Sparkles, 
  FileText
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { location, refreshLocation } = useLocation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<CropAnalysisReport[]>([]);

  // Refetch and refresh fresh location and weather whenever entering dashboard
  useEffect(() => {
    refreshLocation();
  }, []);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await historyService.getAllReports();
        setReports(data);
      } catch (e) {
        console.error('Failed to load reports:', e);
      }
    };
    loadReports();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      {/* Location Bar */}
      <LocationBanner />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Farmer Header Greeting */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-agro-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('dash_console_subtitle')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
              {t('dash_welcome')}, {user?.name || 'Farmer Friend'} 🌾
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('dash_overview_for')} {location.city}, {location.state} • {formatLocalizedDate(new Date(), language, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Quick Action */}
          <Link
            to="/crop-analysis"
            className="bg-agro-600 hover:bg-agro-700 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-md shadow-agro-600/25 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Microscope className="w-4 h-4" />
            <span>{t('dash_analyze_btn')}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Quick Diagnostic Metrics - Clickable to respective views */}
        <QuickStats reports={reports} />

        {/* Main Grid: Weather Telemetry & AI Advisory - Clickable to full dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Weather Telemetry */}
          <div className="lg:col-span-5 space-y-6">
            <WeatherWidget />
          </div>

          {/* Right Column: AI Agronomist Advisory */}
          <div className="lg:col-span-7 space-y-6">
            <AdvisoryCard />
          </div>

        </div>

        {/* Recent Field Diagnostics Section */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div 
              onClick={() => navigate('/history')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="p-2 bg-purple-100 text-purple-700 rounded-2xl group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-agro-700 transition-colors flex items-center gap-1.5">
                  <span>{t('dash_recent_diag')}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500">{t('dash_recent_desc')}</p>
              </div>
            </div>

            <Link
              to="/history"
              className="text-xs font-bold text-agro-700 hover:text-agro-800 flex items-center gap-1 hover:underline"
            >
              <span>{t('dash_view_all')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs sm:text-sm text-slate-500 mb-3">{t('dash_no_history')}</p>
              <Link
                to="/crop-analysis"
                className="inline-flex items-center gap-2 px-4 py-2 bg-agro-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Microscope className="w-4 h-4" />
                <span>{t('dash_first_diag')}</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.slice(0, 3).map((rawRep) => {
                const rep = localizeReportData(rawRep, language);
                const isCritical = rep.aiAdvisory.overallRiskLevel === 'CRITICAL';
                return (
                  <div
                    key={rep.id}
                    onClick={() => navigate(`/analysis/${rep.id}`)}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-agro-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group cursor-pointer bg-white"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatLocalizedDate(rep.timestamp, language, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isCritical 
                            ? 'bg-rose-100 text-rose-800 border-rose-300' 
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {localizeRiskBadge(rep.aiAdvisory.overallRiskLevel, language)}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        {rep.userInputs.imageUrls?.[0] && (
                          <img
                            src={rep.userInputs.imageUrls[0]}
                            alt={rep.mlModelDetection.cropIdentified}
                            className="w-14 h-14 object-cover rounded-2xl border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div>
                          <div className="text-xs font-semibold text-agro-700">
                            {rep.mlModelDetection.cropIdentified}
                          </div>
                          <div className="text-sm font-bold text-slate-900 leading-tight group-hover:text-agro-700 transition-colors">
                            {rep.mlModelDetection.diseaseOrCondition}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {(rep.mlModelDetection.confidenceScore * 100).toFixed(0)}% {t('dash_certainty')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full text-center py-2 px-3 bg-slate-50 group-hover:bg-agro-50 text-slate-700 group-hover:text-agro-800 rounded-xl text-xs font-semibold border border-slate-200/80 transition-colors flex items-center justify-center gap-1.5">
                      <span>{t('dash_view_dossier')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
