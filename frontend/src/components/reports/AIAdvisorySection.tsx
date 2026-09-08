import React, { useState } from 'react';
import { AIAdvisoryOutput } from '../../types/analysis.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Sparkles, 
  Clock, 
  FlaskConical, 
  Leaf, 
  Shovel, 
  ShieldCheck, 
  CheckSquare, 
  AlertCircle,
  Calendar
} from 'lucide-react';

interface AIAdvisorySectionProps {
  aiData: AIAdvisoryOutput;
}

export const AIAdvisorySection: React.FC<AIAdvisorySectionProps> = ({ aiData }) => {
  const { t } = useLanguage();
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION A: Immediate Action Protocol */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5 border-l-4 border-l-rose-500">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-100 text-rose-700 rounded-2xl">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t('rep_imm_title')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('rep_imm_sub')}
              </p>
            </div>
          </div>
          <span className="bg-rose-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
            {t('rep_imm_priority')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5">
          {aiData.immediateActions.map((action) => (
            <div
              key={action.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-agro-400 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{action.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    action.category === 'Chemical'
                      ? 'bg-purple-100 text-purple-800'
                      : action.category === 'Organic'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {action.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{action.description}</p>
                {action.dosageOrMethod && (
                  <div className="text-xs font-semibold text-agro-700 bg-agro-50/70 p-2 rounded-xl border border-agro-100 mt-2">
                    {t('rep_dosage')} {action.dosageOrMethod}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION B: Comprehensive Treatment & Management Matrix */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-agro-100 text-agro-700 rounded-2xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {t('rep_ipm_title')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('rep_ipm_sub')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Chemical Controls */}
          <div className="p-5 rounded-3xl bg-white border border-purple-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900 pb-2 border-b border-purple-50">
              <FlaskConical className="w-4 h-4 text-purple-600" />
              <span>{t('rep_chem_title')}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {(aiData?.treatmentAndManagement?.chemicalMethods || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Organic & Bio-Control */}
          <div className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 pb-2 border-b border-emerald-50">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>{t('rep_org_title')}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {(aiData?.treatmentAndManagement?.organicBioControl || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cultural & Agronomic Practices */}
          <div className="p-5 rounded-3xl bg-white border border-amber-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 pb-2 border-b border-amber-50">
              <Shovel className="w-4 h-4 text-amber-600" />
              <span>{t('rep_cult_title')}</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {(aiData?.treatmentAndManagement?.culturalPractices || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* SECTION C: Long-Term Prevention & Monitoring Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Preventive Measures */}
        <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-agro-600" />
            <span>{t('rep_prev_title')}</span>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
            {(aiData?.preventiveMeasures || []).map((measure, idx) => (
              <li key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-white/70 border border-agro-50">
                <span className="w-5 h-5 rounded-full bg-agro-100 text-agro-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{measure}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Monitoring Checklist */}
        <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <CheckSquare className="w-5 h-5 text-sky-600" />
              <span>{t('rep_chk_title')}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-agro-600" />
              <span>{t('rep_next_days')} {aiData.followUpWindowDays}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {(aiData?.monitoringChecklist || []).map((chk, idx) => {
              const isDone = !!checkedItems[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleCheck(idx)}
                  className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900 line-through opacity-80'
                      : 'bg-white border-slate-100 hover:border-agro-300 text-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isDone && '✓'}
                  </div>
                  <span className="text-xs sm:text-sm">{chk}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Advisory Transparency Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 text-xs flex items-start gap-3 border border-slate-800">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-white">{t('rep_transparency_title')}</div>
          <p className="text-slate-400 leading-relaxed">
            {t('rep_transparency_desc')}
          </p>
        </div>
      </div>

    </div>
  );
};
