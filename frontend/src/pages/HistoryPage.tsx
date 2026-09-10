import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { historyService } from '../services/api/historyService';
import { CropAnalysisReport } from '../types/analysis.types';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { localizeRiskBadge, localizeCropName, formatLocalizedDate } from '../utils/translations';
import { localizeReportData } from '../utils/reportLocalizer';
import { 
  History, 
  Search, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Microscope,
  AlertCircle
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { showToast } = useNotification();
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<CropAnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('ALL');
  const [selectedRisk, setSelectedRisk] = useState('ALL');
  const [reportToDelete, setReportToDelete] = useState<{ id: string; crop: string; condition: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await historyService.getAllReports({
        crop: selectedCrop,
        riskLevel: selectedRisk,
        searchQuery,
      });
      setReports(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedCrop, selectedRisk]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports();
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      setIsDeleting(true);
      await historyService.deleteReport(reportToDelete.id);
      showToast('Diagnostic report permanently deleted from database', undefined, 'success');
      setReportToDelete(null);
      await loadReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
      showToast('Failed to delete report from database', undefined, 'error');
    } finally {
      setIsDeleting(false);
    }
  };


  const availableCrops = ['ALL', 'Tomato', 'Wheat', 'Rice / Paddy', 'Cotton', 'Potato'];
  const riskLevels = ['ALL', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-agro-700 uppercase tracking-wider mb-1">
              <History className="w-4 h-4 text-agro-600" />
              <span>{t('hist_badge')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
              {t('hist_title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('hist_sub')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/crop-analysis"
              className="px-4 py-2 bg-agro-600 hover:bg-agro-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Microscope className="w-4 h-4" />
              <span>{t('hist_new_btn')}</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('hist_search_placeholder')}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            {/* Crop Filter */}
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-3.5 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 focus:border-agro-500 focus:outline-none shadow-sm cursor-pointer"
            >
              {availableCrops.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? t('hist_filter_crop') : localizeCropName(c, language)}
                </option>
              ))}
            </select>

            {/* Risk Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3.5 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 focus:border-agro-500 focus:outline-none shadow-sm cursor-pointer"
            >
              {riskLevels.map((r) => (
                <option key={r} value={r}>
                  {r === 'ALL' ? t('hist_filter_risk') : localizeRiskBadge(r, language)}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm"
            >
              {t('hist_search_btn')}
            </button>
          </form>
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card rounded-3xl p-6 h-48 animate-pulse" />
            <div className="glass-card rounded-3xl p-6 h-48 animate-pulse" />
            <div className="glass-card rounded-3xl p-6 h-48 animate-pulse" />
          </div>
        ) : reports.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center space-y-3">
            <Microscope className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-lg font-bold text-slate-700">{t('hist_no_results')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {t('hist_no_results_sub')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((rawRep) => {
              const rep = localizeReportData(rawRep, language);
              const isCritical = rep.aiAdvisory.overallRiskLevel === 'CRITICAL';
              return (
                <div
                  key={rep.id}
                  className="glass-card rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-agro-300 hover:shadow-glass-hover transition-all group"
                >
                  <Link
                    to={`/analysis/${rep.id}`}
                    className="space-y-3 block focus:outline-none"
                  >
                    {/* Card Top Meta */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatLocalizedDate(rep.timestamp, language, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        isCritical 
                          ? 'bg-rose-100 text-rose-800 border-rose-300' 
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {localizeRiskBadge(rep.aiAdvisory.overallRiskLevel, language)}
                      </span>
                    </div>

                    {/* Image & Main Titles */}
                    <div className="flex items-start gap-3.5">
                      {rep.userInputs.imageUrls?.[0] ? (
                        <img
                          src={rep.userInputs.imageUrls[0]}
                          alt={rep.mlModelDetection.cropIdentified}
                          className="w-16 h-16 object-cover rounded-2xl border border-slate-200 flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-agro-100 text-agro-700 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <Microscope className="w-8 h-8" />
                        </div>
                      )}

                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-bold text-agro-700 truncate">
                          {rep.mlModelDetection.cropIdentified}
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 leading-tight group-hover:text-agro-700 transition-colors truncate">
                          {rep.mlModelDetection.diseaseOrCondition}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          <span className="text-[11px] text-slate-500">
                            {(rep.mlModelDetection.confidenceScore * 100).toFixed(1)}% {t('dash_certainty')}
                          </span>
                          {rep.pestDetection && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              rep.pestDetection.detected 
                                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {rep.pestDetection.detected ? `🐛 ${rep.pestDetection.pestIdentified}` : '🌿 No Pests'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {rep.aiAdvisory.executiveSummary}
                    </p>
                  </Link>

                  {/* Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {rep.userInputs.locationName || 'Farm Field'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReportToDelete({
                          id: rep.id,
                          crop: rep.mlModelDetection.cropIdentified,
                          condition: rep.mlModelDetection.diseaseOrCondition,
                        })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete test report from database"
                        aria-label="Delete test report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/analysis/${rep.id}`}
                        className="text-agro-700 font-bold flex items-center gap-1 hover:underline"
                      >
                        {t('hist_view_dossier')}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {reportToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div 
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-scaleUp"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Trash2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Delete Diagnostic Report?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete the test report for{' '}
                  <strong className="text-slate-900 font-semibold">{reportToDelete.crop} ({reportToDelete.condition})</strong>{' '}
                  from the database? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setReportToDelete(null)}
                  className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Report'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
