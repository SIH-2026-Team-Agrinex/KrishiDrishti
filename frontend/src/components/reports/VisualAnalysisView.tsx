import React, { useState } from 'react';
import { ManualMLModelOutput } from '../../types/analysis.types';
import { useLanguage } from '../../contexts/LanguageContext';
import { Layers, Eye, Target, Sparkles } from 'lucide-react';

interface VisualAnalysisViewProps {
  imageUrls: string[];
  mlData: ManualMLModelOutput;
}

export const VisualAnalysisView: React.FC<VisualAnalysisViewProps> = ({ imageUrls, mlData }) => {
  const { t } = useLanguage();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const activeImage = imageUrls[selectedIdx] || imageUrls[0];

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-5">
      
      {/* Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            {t('rep_cv_title')}
          </h3>
          <p className="text-xs text-slate-500">
            {t('rep_cv_sub')}
          </p>
        </div>

        {/* Toggle View Options */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              showAnnotations
                ? 'bg-purple-100 text-purple-800 border-purple-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{t('rep_bbox_toggle')} {showAnnotations ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              showHeatmap
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('rep_heatmap_toggle')}</span>
          </button>
        </div>
      </div>

      {/* Main Image Viewer Stage */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video max-h-[460px] flex items-center justify-center shadow-inner group">
        <img
          src={activeImage}
          alt="Analyzed crop specimen"
          className="w-full h-full object-contain"
        />

        {/* Simulated Pathology Heatmap Overlay */}
        {showHeatmap && (
          <div className="absolute inset-0 bg-gradient-radial from-rose-500/40 via-amber-500/20 to-transparent pointer-events-none mix-blend-color-dodge transition-opacity duration-300 animate-pulse" />
        )}

        {/* Bounding Box Annotations */}
        {showAnnotations && mlData.boundingBoxes && mlData.boundingBoxes.map((box, i) => (
          <div
            key={i}
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
            className="absolute border-2 border-emerald-400 bg-emerald-500/15 rounded-lg shadow-lg pointer-events-none transition-all animate-in fade-in"
          >
            {/* Box Header Badge */}
            <div className="absolute -top-7 left-0 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span>{box.label}</span>
            </div>
          </div>
        ))}

        {/* Floating Watermark & Info */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-white text-[11px] px-3 py-1 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
          <Eye className="w-3.5 h-3.5 text-agro-400" />
          <span>{t('rep_inference_res')}</span>
        </div>
      </div>

      {/* Multi-Image Thumbnail Selector */}
      {imageUrls.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`relative rounded-2xl overflow-hidden aspect-square w-16 h-16 border-2 transition-all flex-shrink-0 ${
                selectedIdx === idx ? 'border-agro-600 ring-2 ring-agro-200' : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
