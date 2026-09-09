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

        <div className="flex flex-col items-center justify-center max-w-lg mx-auto py-2">
          <div className="relative mb-4 group">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-agro-700 via-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xl shadow-agro-600/30 group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border-2 border-white">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </div>

          <h4 className="text-base sm:text-xl font-extrabold text-slate-900 mb-1.5 font-heading">
            {t('drop_drag_title') || 'Drag & Drop Leaf Photos Here'}
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-sm leading-relaxed text-center">
            {t('drop_drag_desc') || 'Take clear, close-up photos of affected leaves, stems, or pests'}
          </p>

          {/* Redesigned Action Buttons: Choose and Click */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 w-full max-w-sm">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-w-[130px] bg-white hover:bg-emerald-50/70 text-slate-800 hover:text-agro-800 font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl border-2 border-slate-200 hover:border-agro-400 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2.5 group cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-agro-600 group-hover:scale-110 transition-transform" />
              <span>Choose</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="flex-1 min-w-[130px] bg-gradient-to-r from-agro-700 via-agro-600 to-emerald-500 hover:from-agro-800 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-agro-600/30 hover:shadow-agro-600/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Click</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            </button>
          </div>

          <div className="mt-4 text-[11px] text-slate-400 flex items-center gap-2">
            <span>JPEG, PNG, WebP</span>
            <span>•</span>
            <span>Up to 10 photos (Max 20MB)</span>
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
