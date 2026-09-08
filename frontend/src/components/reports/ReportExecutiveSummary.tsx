import React from 'react';
import { ManualMLModelOutput, AIAdvisoryOutput, CropAnalysisReport } from '../../types/analysis.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizeRiskBadge, localizeSeverity } from '../../utils/translations';
import { ShieldAlert, AlertTriangle, CheckCircle2, Microscope, Sprout, Check } from 'lucide-react';

interface ReportExecutiveSummaryProps {
  mlData: ManualMLModelOutput;
  aiData: AIAdvisoryOutput;
  timestamp: string;
  userInputs?: CropAnalysisReport['userInputs'];
}

export const ReportExecutiveSummary: React.FC<ReportExecutiveSummaryProps> = ({ mlData, aiData, timestamp, userInputs }) => {
  const { t, language } = useLanguage();

  const getRiskBadge = (level: string) => {
    const label = localizeRiskBadge(level, language);
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
          label,
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
          label,
        };
      case 'MODERATE':
        return {
          bg: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-600" />,
          label,
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          label,
        };
    }
  };

  const risk = getRiskBadge(aiData.overallRiskLevel);
  const confidencePercent = (mlData.confidenceScore * 100).toFixed(1);

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
      
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-agro-100 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Sprout className="w-4 h-4 text-agro-600" />
          <span>{t('rep_generated_on')} {new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold border ${risk.bg} shadow-sm`}>
          {risk.icon}
          <span>{risk.label}</span>
        </div>
      </div>

      {/* Main Diagnostic Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Disease / Condition Identification */}
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-agro-700 uppercase tracking-wider bg-agro-100 px-2.5 py-0.5 rounded-full">
              {mlData.cropIdentified} {mlData.isCropAutoDetected ? '✨' : ''}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              mlData.severity === 'Severe' || mlData.severity === 'Critical' 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {t('rep_severity')}: {localizeSeverity(mlData.severity, language)}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            {mlData.diseaseOrCondition}
          </h2>

          {mlData.scientificName && (
            <div className="text-xs sm:text-sm italic text-slate-500">
              {t('rep_pathogen')} <span className="font-semibold text-slate-700">{mlData.scientificName}</span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
            {aiData.executiveSummary}
          </p>
        </div>

        {/* Confidence Gauge Circle */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 bg-gradient-to-b from-agro-50/80 to-white rounded-3xl border border-agro-200/70 text-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Microscope className="w-4 h-4 text-purple-600" />
            {t('rep_ml_confidence')}
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-agro-600 transition-all duration-1000 ease-out"
                strokeDasharray={`${confidencePercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-slate-900 font-heading">
                {confidencePercent}%
              </span>
              <span className="text-[10px] text-agro-700 font-semibold uppercase">{t('rep_certainty')}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 mt-2">
            {t('rep_affected_part')} <strong className="text-slate-800">{mlData.affectedPart}</strong>
          </div>
        </div>

      </div>

      {/* Verified Ground Truth & Field Cross-Examination Evidence */}
      {userInputs?.crossQuestionAnswers && Object.keys(userInputs.crossQuestionAnswers).length > 0 && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <strong className="text-slate-900 uppercase tracking-wider text-[11px]">
                Farmer Verified Ground Truth & Observations
              </strong>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
              100% User Data Grounded
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(userInputs.crossQuestionAnswers).map(([k, v], idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-medium">Field Observation {idx + 1}</span>
                <span className="text-slate-800 font-semibold text-[11px] leading-snug">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
