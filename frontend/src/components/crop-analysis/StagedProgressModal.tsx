import React from 'react';
import { AnalysisStage } from '../../types/analysis.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { CheckCircle2, Loader2, Sparkles, Sprout, CloudSun, Microscope, FileText } from 'lucide-react';

interface StagedProgressModalProps {
  stage: AnalysisStage;
  progress: number;
}

export const StagedProgressModal: React.FC<StagedProgressModalProps> = ({ stage, progress }) => {
  const { t } = useLanguage();

  const stages = [
    {
      id: 'uploading',
      title: t('stage_upload'),
      desc: t('stage_upload_sub'),
      icon: <Sprout className="w-5 h-5 text-agro-600" />,
    },
    {
      id: 'environmental_sync',
      title: t('stage_env'),
      desc: t('stage_env_sub'),
      icon: <CloudSun className="w-5 h-5 text-sky-600" />,
    },
    {
      id: 'ml_analyzing',
      title: t('stage_ml'),
      desc: t('stage_ml_sub'),
      icon: <Microscope className="w-5 h-5 text-purple-600" />,
    },
    {
      id: 'ai_reasoning',
      title: t('stage_ai'),
      desc: t('stage_ai_sub'),
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    },
    {
      id: 'generating_report',
      title: t('stage_report'),
      desc: t('stage_report_sub'),
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
    },
  ];

  const getStageIndex = (s: AnalysisStage) => {
    switch (s) {
      case 'uploading':
        return 0;
      case 'environmental_sync':
        return 1;
      case 'ml_analyzing':
        return 2;
      case 'ai_reasoning':
        return 3;
      case 'generating_report':
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-agro-100 text-center relative overflow-hidden">
        
        {/* Animated Background Pulse */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-agro-200/50 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-200/50 rounded-full blur-3xl" />

        {/* Center Spinner Icon */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-agro-100 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-agro-600 border-t-transparent animate-spin" />
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agro-700 to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-agro-600/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1 font-heading">
          {t('modal_title')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          {t('modal_sub')}
        </p>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-6 p-0.5 overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-agro-500 via-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Timeline Steps */}
        <div className="space-y-3 text-left">
          {stages.map((step, idx) => {
            const isFinished = idx < currentIndex || stage === 'completed';
            const isCurrent = idx === currentIndex && stage !== 'completed';

            return (
              <div
                key={step.id}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-3.5 ${
                  isFinished
                    ? 'bg-agro-50/70 border-agro-200 text-agro-950'
                    : isCurrent
                    ? 'bg-white border-agro-500 shadow-md ring-2 ring-agro-100 text-slate-900'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex-shrink-0">
                  {isFinished ? (
                    <CheckCircle2 className="w-5 h-5 text-agro-600" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-agro-600 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-xs sm:text-sm font-semibold truncate ${isCurrent ? 'text-agro-800' : ''}`}>
                    {step.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {step.desc}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {step.icon}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-xs text-slate-400 font-medium">
          {t('stage_wait')}
        </div>
      </div>
    </div>
  );
};
