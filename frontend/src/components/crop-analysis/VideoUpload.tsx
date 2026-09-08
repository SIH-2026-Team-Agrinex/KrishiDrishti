import React, { useRef, useState } from 'react';
import { Video, X, FileVideo, AlertCircle, Clock } from 'lucide-react';

interface VideoUploadProps {
  video: File | null;
  onChange: (video: File | null) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ video, onChange }) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please upload a valid video format (MP4, WebM, MOV, 3GP).');
      return;
    }
    if (file.size > 150 * 1024 * 1024) {
      setErrorMsg('Video file size must be below 150 MB.');
      return;
    }
    onChange(file);
  };

  const removeVideo = () => {
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
          <Video className="w-4 h-4 text-agro-600" />
          <span>Upload Field Canopy Video (Up to 1 Minute)</span>
          <span className="text-[11px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            Optional
          </span>
        </label>
        {video && (
          <button
            type="button"
            onClick={removeVideo}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
          >
            Remove Video
          </button>
        )}
      </div>

      {!video ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer border border-dashed border-slate-300 hover:border-agro-400 bg-slate-50/50 hover:bg-agro-50/30 rounded-2xl p-4 text-center transition-all flex items-center justify-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4, video/webm, video/quicktime, video/3gpp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="p-2.5 bg-agro-100 text-agro-700 rounded-2xl">
            <FileVideo className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <span>Click to select a field video (Up to 1 minute / 60s)</span>
              <Clock className="w-3.5 h-3.5 text-agro-600" />
            </div>
            <div className="text-[11px] text-slate-400">
              Captures overall plant density, wind canopy movement and multi-angle leaf foliage (Max 150MB)
            </div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-agro-200 bg-slate-950 p-3 flex items-center gap-4">
          <video
            src={URL.createObjectURL(video)}
            className="w-36 h-24 object-cover rounded-xl border border-slate-800"
            controls
          />
          <div className="text-xs text-slate-300 flex-1 truncate">
            <div className="font-semibold text-white truncate text-sm">{video.name}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Size: {(video.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI temporal frame extraction
            </div>
          </div>
          <button
            type="button"
            onClick={removeVideo}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Remove"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
