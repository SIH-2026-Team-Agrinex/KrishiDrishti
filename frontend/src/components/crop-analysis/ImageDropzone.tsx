import React, { useRef, useState } from 'react';
import { Camera, UploadCloud, X, Image as ImageIcon, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { LiveCameraModal } from './LiveCameraModal';
import { useLanguage } from '../../contexts/LanguageContext';
import { validateCropSpecimen, getLocalizedCropErrorMessage } from '../../utils/cropValidator';

interface ImageDropzoneProps {
  images: File[];
  onChange: (images: File[]) => void;
  maxFiles?: number;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ images, onChange, maxFiles = 10 }) => {
  const { language, t } = useLanguage();
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (newFiles: FileList | File[]) => {
    setErrorMsg(null);
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const candidates: File[] = [];

    Array.from(newFiles).forEach((file) => {
      if (!validExtensions.includes(file.type)) {
        setErrorMsg('Please upload standard image formats (JPEG, PNG, WebP).');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setErrorMsg('Image size should be below 20 MB.');
        return;
      }
      candidates.push(file);
    });

    if (candidates.length === 0) return;

    setIsValidating(true);

    const validCrops: File[] = [];
    let rejectedCount = 0;

    for (const candidate of candidates) {
      const validation = await validateCropSpecimen(candidate);
      if (validation.isCrop) {
        validCrops.push(candidate);
      } else {
        rejectedCount++;
      }
    }

    setIsValidating(false);

    if (rejectedCount > 0) {
      const localizedErr = getLocalizedCropErrorMessage(language);
      setErrorMsg(localizedErr);
      if (validCrops.length === 0) {
        // Reset file input so user can choose another file
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    const combined = [...images, ...validCrops].slice(0, maxFiles);
    onChange(combined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCameraCapture = async (capturedFile: File) => {
    setErrorMsg(null);
    setIsValidating(true);

    const validation = await validateCropSpecimen(capturedFile);
    setIsValidating(false);

    if (!validation.isCrop) {
      const localizedErr = getLocalizedCropErrorMessage(language);
      setErrorMsg(localizedErr);
      return;
    }

    if (images.length >= maxFiles) {
      setErrorMsg(`Maximum of ${maxFiles} images reached.`);
      return;
    }
    onChange([...images, capturedFile]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
          isDragOver
            ? 'border-agro-600 bg-agro-50/90 scale-[1.01]'
            : images.length > 0
            ? 'border-agro-300 bg-agro-50/40'
            : 'border-slate-300 bg-slate-50/70 hover:border-agro-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-agro-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-agro-600/20 mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
            {t('drop_drag_title')}
          </h4>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            {t('drop_drag_desc')}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-agro-600 hover:bg-agro-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{t('drop_browse_btn')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-md transition-all flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>{t('drop_camera_btn')}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </button>
          </div>
        </div>

        {isValidating && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Verifying crop specimen foliar authenticity...</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-left text-xs sm:text-sm text-rose-900 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900 text-sm">{errorMsg}</p>
                <p className="text-[11px] sm:text-xs text-rose-700 mt-1 leading-relaxed">
                  KrishiDrishti AI only analyzes authentic photos of crops, leaves, and agricultural specimens. Please change the image.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    fileInputRef.current?.click();
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose Another Image</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {images.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={idx}
                className="relative rounded-2xl overflow-hidden border border-agro-200 group bg-slate-900 aspect-square shadow-sm"
              >
                <img
                  src={url}
                  alt={`Crop preview ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/30 opacity-80" />

                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>#{idx + 1}</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-full transition-colors shadow"
                  title="Remove Image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="absolute bottom-2 left-2 right-2 text-[10px] text-slate-200 truncate font-medium">
                  {file.name}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Live Camera Modal */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        capturedImagesCount={images.length}
        maxFiles={maxFiles}
      />
    </div>
  );
};
