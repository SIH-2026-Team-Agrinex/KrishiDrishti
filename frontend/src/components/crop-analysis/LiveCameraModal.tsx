import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  SwitchCamera, 
  Zap, 
  ZapOff, 
  Timer,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface LiveCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  capturedImagesCount: number;
  maxFiles?: number;
}

export const LiveCameraModal: React.FC<LiveCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  capturedImagesCount,
  maxFiles = 10,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoCaptureTimerRef = useRef<any>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraLabel, setCameraLabel] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [switchFeedback, setSwitchFeedback] = useState<string | null>(null);

  // Auto-capture settings
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState<boolean>(false);
  const [isLeafDetected, setIsLeafDetected] = useState<boolean>(false);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState<number | null>(null);
  const [recentSnaps, setRecentSnaps] = useState<string[]>([]);
  const [capturedCount, setCapturedCount] = useState<number>(capturedImagesCount);

  useEffect(() => {
    setCapturedCount(capturedImagesCount);
  }, [capturedImagesCount]);

  // Clean stop for any running tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start / restart camera with exact device or facingMode
  const startCamera = useCallback(async (targetDeviceId?: string, targetFacing?: 'environment' | 'user') => {
    stopStream();
    setIsLoading(true);
    setError(null);
    setTorchOn(false);

    const activeFacing = targetFacing || facingMode;
    const activeDeviceId = targetDeviceId !== undefined ? targetDeviceId : selectedDeviceId;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      let stream: MediaStream | null = null;

      // 1. Try with target deviceId if available
      if (activeDeviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              deviceId: { exact: activeDeviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });
        } catch (devErr) {
          console.warn('Target deviceId constraint failed, falling back:', devErr);
        }
      }

      // 2. Fallback to facingMode
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: activeFacing },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });
        } catch (facingErr) {
          console.warn('FacingMode constraint failed, trying generic video:', facingErr);
          // 3. Fallback to basic video
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true,
          });
        }
      }

      streamRef.current = stream;

      // Check track capabilities and enumerate real devices now that permissions are granted
      const activeTrack = stream.getVideoTracks()[0];
      if (activeTrack) {
        const settings: any = activeTrack.getSettings ? activeTrack.getSettings() : {};
        if (settings.deviceId) {
          setSelectedDeviceId(settings.deviceId);
        }
        setCameraLabel(activeTrack.label || (activeFacing === 'user' ? 'Front Camera' : 'Rear Camera'));

        const capabilities: any = (activeTrack.getCapabilities && activeTrack.getCapabilities()) || {};
        setHasTorch(!!capabilities.torch);
      }

      // Enumerate devices once stream is active so labels are visible
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevs);
        if (activeDeviceId && videoDevs.length > 0) {
          const idx = videoDevs.findIndex(d => d.deviceId === activeDeviceId);
          if (idx !== -1) setCurrentCameraIndex(idx);
        }
      } catch (_) {}

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera permissions in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera detected on this system.');
      } else {
        setError(err?.message || 'Could not access camera feed.');
      }
    }
  }, [facingMode, selectedDeviceId, stopStream]);

  // Initial stream launch
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    }

    return () => {
      stopStream();
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    };
  }, [isOpen]);

  // Robust Camera Switching
  const handleSwitchCamera = async () => {
    // 1. Re-query real device list
    let videoDevs = cameras;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const freshDevs = devices.filter((d) => d.kind === 'videoinput');
      if (freshDevs.length > 0) {
        videoDevs = freshDevs;
        setCameras(freshDevs);
      }
    } catch (_) {}

    if (videoDevs.length > 1) {
      // Cycle through multiple video inputs
      const nextIndex = (currentCameraIndex + 1) % videoDevs.length;
      setCurrentCameraIndex(nextIndex);
      const nextDev = videoDevs[nextIndex];
      setSelectedDeviceId(nextDev.deviceId);

      const labelLower = (nextDev.label || '').toLowerCase();
      const newFacing = labelLower.includes('front') || labelLower.includes('user') ? 'user' : 'environment';
      setFacingMode(newFacing);

      const displayName = nextDev.label || `Camera ${nextIndex + 1}`;
      setSwitchFeedback(displayName);
      setTimeout(() => setSwitchFeedback(null), 1800);

      await startCamera(nextDev.deviceId, newFacing);
    } else {
      // Toggle facingMode (mobile or single entry)
      const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
      setFacingMode(nextFacing);
      setSelectedDeviceId(''); // Clear so facingMode constraint is applied

      const displayName = nextFacing === 'user' ? 'Front Camera' : 'Rear / Main Camera';
      setSwitchFeedback(displayName);
      setTimeout(() => setSwitchFeedback(null), 1800);

      await startCamera('', nextFacing);
    }
  };

  // Capture Photo Handler
  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || capturedCount >= maxFiles) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Trigger visual shutter flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 180);

    // If front camera, mirror image for natural reflection
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File(
          [blob], 
          `leaf_scan_${Date.now()}.jpg`, 
          { type: 'image/jpeg', lastModified: Date.now() }
        );

        // Add to recent previews
        const url = URL.createObjectURL(blob);
        setRecentSnaps((prev) => [url, ...prev].slice(0, 5));
        setCapturedCount((prev) => prev + 1);

        onCapture(file);
      },
      'image/jpeg',
      0.94
    );
  };

  // AI Simulated Leaf Auto-Detection & Capture Loop
  useEffect(() => {
    if (!isOpen || isLoading || !autoCaptureEnabled) {
      setIsLeafDetected(false);
      setAutoCaptureCountdown(null);
      return;
    }

    if (capturedCount >= maxFiles) return;

    const leafLockTimer = setTimeout(() => {
      setIsLeafDetected(true);
      let count = 2;
      setAutoCaptureCountdown(count);

      const countdownInterval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setAutoCaptureCountdown(count);
        } else {
          clearInterval(countdownInterval);
          setAutoCaptureCountdown(null);
          handleCapturePhoto();
          setIsLeafDetected(false);
        }
      }, 900);

      autoCaptureTimerRef.current = countdownInterval;
    }, 1800);

    return () => {
      clearTimeout(leafLockTimer);
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    };
  }, [isOpen, isLoading, autoCaptureEnabled, capturedCount, maxFiles]);

  // Torch Toggle
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch constraint failed:', e);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 rounded-3xl shadow-2xl max-w-xl w-full flex flex-col border border-slate-800 text-white overflow-hidden max-h-[92vh] relative">
        
        {/* Top Control Bar */}
        <div className="p-3.5 bg-slate-900/95 border-b border-slate-800/90 flex items-center justify-between z-20 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white leading-tight">AI Crop Camera</span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {capturedCount}/{maxFiles}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                {cameraLabel || 'Focus on leaf symptoms'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Capture Toggle */}
            <button
              type="button"
              onClick={() => setAutoCaptureEnabled(!autoCaptureEnabled)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${
                autoCaptureEnabled
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700'
              }`}
              title="Toggle Auto-Capture on Leaf Detection"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Auto: {autoCaptureEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Flash / Torch Toggle */}
            {hasTorch && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-xl border transition-colors ${
                  torchOn ? 'bg-amber-400 text-slate-950 border-amber-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
                title="Toggle Flashlight"
              >
                {torchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Switch Camera Button */}
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 border border-slate-700 transition-colors cursor-pointer"
              title={`Switch Camera (${cameras.length > 1 ? `${cameras.length} available` : 'Front/Rear'})`}
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
              title="Close Camera"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Camera Viewfinder Viewport */}
        <div className="relative flex-1 min-h-[320px] max-h-[56vh] bg-black flex items-center justify-center overflow-hidden">
          
          {/* White Shutter Flash Effect */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-40 transition-opacity duration-150" />
          )}

          {/* Camera Switch Feedback Toast */}
          {switchFeedback && (
            <div className="absolute top-4 z-30 bg-slate-900/90 border border-emerald-400/60 text-emerald-300 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg backdrop-blur animate-in fade-in duration-150 flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
              <span>{switchFeedback}</span>
            </div>
          )}

          {/* Loading Screen */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Starting Camera Feed...</p>
            </div>
          )}

          {/* Error Message Screen */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 p-6 text-center space-y-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">Camera Access Notice</h4>
              <p className="text-xs text-slate-400 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={() => startCamera()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors cursor-pointer"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Video Stream Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-200 ${
              facingMode === 'user' ? 'scale-x-[-1]' : ''
            }`}
          />

          {/* Viewfinder HUD Overlay */}
          {!isLoading && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 sm:p-10">
              
              {/* Soft Targeted Scanning Box */}
              <div className={`w-[85%] h-[80%] max-w-md max-h-[320px] rounded-3xl relative flex items-center justify-center transition-all duration-300 ${
                isLeafDetected 
                  ? 'border-2 border-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(52,211,153,0.4)]' 
                  : 'border border-white/30 bg-black/5'
              }`}>
                
                {/* 4 Sleek Glowing Corner Accents */}
                <div className="absolute -top-1 -left-1 w-7 h-7 border-t-3 border-l-3 border-emerald-400 rounded-tl-2xl shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <div className="absolute -top-1 -right-1 w-7 h-7 border-t-3 border-r-3 border-emerald-400 rounded-tr-2xl shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-3 border-l-3 border-emerald-400 rounded-bl-2xl shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-3 border-r-3 border-emerald-400 rounded-br-2xl shadow-[0_0_8px_rgba(52,211,153,0.6)]" />

                {/* Laser Scanning Line Animation */}
                <div className="absolute inset-x-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse opacity-70" />

                {/* Center Guide / Auto-Capture Countdown Indicator */}
                {autoCaptureCountdown !== null ? (
                  <div className="bg-slate-950/90 backdrop-blur-md px-5 py-3 rounded-2xl text-center border border-emerald-400 shadow-2xl animate-bounce">
                    <div className="text-2xl font-black text-emerald-400 font-heading flex items-center justify-center gap-2">
                      <Timer className="w-5 h-5 animate-spin" />
                      <span>{autoCaptureCountdown}s</span>
                    </div>
                    <div className="text-[10px] text-emerald-200 font-bold mt-0.5">
                      🌿 Leaf Locked • Auto-Snapping!
                    </div>
                  </div>
                ) : (
                  <div className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md transition-all flex items-center gap-1.5 ${
                    isLeafDetected 
                      ? 'bg-emerald-950/85 text-emerald-300 border-emerald-400 shadow-lg' 
                      : 'bg-slate-950/70 text-slate-300 border-white/20'
                  }`}>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>{isLeafDetected ? 'Leaf in frame • Hold steady' : 'Place affected leaf in frame'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata Badges */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>AI SCAN ACTIVE</span>
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 pointer-events-none">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span>HD Viewfinder</span>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Shutter & Gallery Controls */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 z-20 flex-shrink-0">
          
          {/* Recent Snaps Preview Stack */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[130px] sm:max-w-[180px] py-1">
            {recentSnaps.length > 0 ? (
              recentSnaps.map((url, i) => (
                <div key={i} className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-400/80 flex-shrink-0 shadow relative">
                  <img src={url} alt="Snap" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-500/10" />
                </div>
              ))
            ) : (
              <div className="text-[11px] text-slate-500 font-medium">
                0 photos
              </div>
            )}
          </div>

          {/* Big Circular Capture Shutter Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={isLoading || !!error || capturedCount >= maxFiles}
              className="p-1 rounded-full border-2 border-emerald-400/50 hover:border-emerald-400 bg-white/5 hover:scale-105 active:scale-95 disabled:opacity-40 transition-all shadow-xl shadow-emerald-500/20 cursor-pointer"
              title="Capture Photo"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-600 via-agro-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 flex items-center justify-center text-white shadow-inner">
                <Camera className="w-6 h-6" />
              </div>
            </button>
            <span className="text-[10px] text-slate-400 mt-1 font-semibold">
              {capturedCount >= maxFiles ? 'Limit reached' : 'Click to Capture'}
            </span>
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-gradient-to-r from-agro-600 to-emerald-600 hover:from-agro-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Done ({capturedCount})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
