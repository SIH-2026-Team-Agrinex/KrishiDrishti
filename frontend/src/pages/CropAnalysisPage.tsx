import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from '../contexts/LocationContext';
import { useNotification } from '../contexts/NotificationContext';
import { cropAnalysisService } from '../services/api/cropAnalysisService';
import { AnalysisStage } from '../types/analysis.types';
import { ImageDropzone } from '../components/crop-analysis/ImageDropzone';
import { VideoUpload } from '../components/crop-analysis/VideoUpload';
import { StagedProgressModal } from '../components/crop-analysis/StagedProgressModal';
import { LocationBanner } from '../components/common/LocationBanner';
import { localizeCropName } from '../utils/translations';
import { 
  Microscope, 
  CloudSun, 
  ArrowRight,
  Globe2,
  Check,
  Plus
} from 'lucide-react';

export const CropAnalysisPage: React.FC = () => {
  const { language, setLanguage, languages, t } = useLanguage();
  const { location } = useLocation();
  const { showToast } = useNotification();
  const navigate = useNavigate();

  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [cropName, setCropName] = useState('');
  const [customCropInput, setCustomCropInput] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [soilMoisture, setSoilMoisture] = useState('Normal');
  
  // Progress modal state
  const [stage, setStage] = useState<AnalysisStage>('idle');
  const [progress, setProgress] = useState(0);

  const isFormValid = images.length > 0;

  const [cropOptions, setCropOptions] = useState([
    'Tomato', 'Wheat', 'Rice / Paddy', 'Cotton', 'Potato', 'Onion', 'Chilli', 
    'Mustard', 'Soybean', 'Sugarcane', 'Maize', 'Apple', 'Mango', 'Banana', 
    'Ginger', 'Garlic', 'Groundnut', 'Chickpea', 'Turmeric', 'Tea', 'Coffee'
  ]);

  const handleAddCustomCrop = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customCropInput.trim();
    if (!trimmed) return;
    if (!cropOptions.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCropOptions(prev => [trimmed, ...prev]);
    }
    setCropName(trimmed);
    setCustomCropInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      showToast('Please upload at least one crop leaf photo', undefined, 'error');
      return;
    }

    try {
      const report = await cropAnalysisService.runAnalysis(
        {
          images,
          video,
          cropName: cropName.trim() || undefined,
          additionalInfo: additionalInfo.trim() || undefined,
          soilMoistureObserved: soilMoisture,
          location: {
            latitude: location.latitude,
            longitude: location.longitude,
            city: location.city,
            state: location.state,
          },
          language,
        },
        (currentStage, currentProgress) => {
          setStage(currentStage);
          setProgress(currentProgress);
        }
      );

      setTimeout(() => {
        setStage('idle');
        navigate(`/analysis/${report.id}`);
      }, 500);

    } catch (err: any) {
      setStage('idle');
      showToast(err.message || 'Diagnostic analysis failed. Please retry.', undefined, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <LocationBanner />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8">
        
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-agro-100/80 text-agro-800 text-xs font-bold border border-agro-300 shadow-sm">
            <Microscope className="w-3.5 h-3.5 text-agro-600" />
            <span>{t('analyze_badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-heading">
            {t('analyze_heading')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {t('analyze_subheading')}
          </p>
        </div>

        {/* Main Analysis Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. Language Feature Selection Bar */}
          <div className="glass-card rounded-3xl p-6 sm:p-7 space-y-4 border border-agro-200/80 bg-gradient-to-br from-white via-agro-50/30 to-emerald-50/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-agro-100 text-agro-700 rounded-2xl">
                  <Globe2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {t('analyze_lang_label')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('analyze_lang_desc')}
                  </p>
                </div>
              </div>

              {/* Language Dropdown Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-3.5 py-2 bg-white rounded-2xl border border-agro-200 text-xs sm:text-sm font-bold text-slate-800 focus:border-agro-500 focus:outline-none shadow-sm cursor-pointer"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.flag} {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Language Pill Selection Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-agro-100/70">
              {languages.map((l) => {
                const isSelected = language === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setLanguage(l.code)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-agro-600 border-agro-600 text-white font-bold shadow-sm scale-105'
                        : 'bg-white/80 border-slate-200 text-slate-700 hover:border-agro-300 hover:bg-white'
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.nativeName}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Image Upload Section */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <span className="w-6 h-6 rounded-full bg-agro-600 text-white flex items-center justify-center text-xs">1</span>
                <span>{t('analyze_step1_title')}</span>
              </div>
              <span className="text-xs text-rose-600 font-bold">{t('analyze_step1_req')}</span>
            </div>

            <ImageDropzone images={images} onChange={setImages} maxFiles={10} />
          </div>

          {/* 3. Optional Video Input */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs">2</span>
              <span>{t('analyze_step2_title')}</span>
            </div>

            <VideoUpload video={video} onChange={setVideo} />
          </div>

          {/* 4. Choose Any Crop & Environmental Observation */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs">3</span>
              <span>{t('analyze_step3_title')}</span>
            </div>

            {/* Any Crop Name Input & Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {t('analyze_crop_label')} (Choose or type any crop name)
                </label>
                <span className="text-[11px] text-agro-700 font-semibold bg-agro-50 px-2 py-0.5 rounded-full">
                  {t('analyze_crop_auto_tag')}
                </span>
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cropName}
                  onChange={(e) => setCropName(e.target.value)}
                  placeholder="Type ANY crop name (e.g. Cardamom, Mango, Mustard, Wheat, Rubber...)"
                  className="flex-1 px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm"
                />
                {cropName && (
                  <button
                    type="button"
                    onClick={() => setCropName('')}
                    className="px-3 text-xs text-slate-400 hover:text-slate-700 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Crop Tag Chips with custom crop creator */}
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold">{t('analyze_quick_select')}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-50/50 rounded-2xl border border-slate-100">
                  {cropOptions.map((c) => {
                    const isSelected = cropName.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCropName(c)}
                        className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-agro-600 text-white font-bold border-agro-600 shadow-sm scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-agro-300'
                        }`}
                      >
                        {localizeCropName(c, language)}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Crop Field */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customCropInput}
                    onChange={(e) => setCustomCropInput(e.target.value)}
                    placeholder="+ Add other crop name..."
                    className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs focus:border-agro-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCrop}
                    disabled={!customCropInput.trim()}
                    className="px-3 py-1.5 bg-agro-100 hover:bg-agro-200 disabled:opacity-40 text-agro-800 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Additional User Symptoms & Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('analyze_notes_label')}
              </label>
              <textarea
                rows={3}
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder={t('analyze_notes_placeholder')}
                className="w-full px-4 py-3 bg-white rounded-2xl border border-slate-200 focus:border-agro-500 focus:outline-none text-xs sm:text-sm shadow-sm resize-none"
              />
            </div>

            {/* Auto Environmental Sync Note */}
            <div className="p-4 rounded-2xl bg-agro-50/80 border border-agro-200/80 flex items-start gap-3">
              <CloudSun className="w-5 h-5 text-agro-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 leading-relaxed">
                <strong className="text-slate-900">{t('analyze_env_sync_title')}</strong> {t('analyze_env_sync_desc')} ({location.city}, {location.state})
              </div>
            </div>

          </div>

          {/* Submit Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || stage !== 'idle'}
              className="w-full py-4 px-6 bg-gradient-to-r from-agro-700 via-agro-600 to-emerald-500 hover:from-agro-800 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-xl shadow-agro-600/30 hover:shadow-agro-600/50 hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
            >
              <Microscope className="w-5 h-5" />
              <span>{t('analyze_submit_btn')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </form>

      </main>

      {/* Multi-Stage Animated Diagnostic Modal */}
      {stage !== 'idle' && (
        <StagedProgressModal stage={stage} progress={progress} />
      )}
    </div>
  );
};
