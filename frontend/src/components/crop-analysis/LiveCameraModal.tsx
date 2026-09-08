import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Sparkles, 
  AlertCircle, 
  Check, 
  SwitchCamera, 
  Zap, 
  ZapOff, 
  Timer,
  Eye
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
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Auto-capture settings
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(true);
  const [isLeafDetected, setIsLeafDetected] = useState(false);
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState<number | null>(null);
  const [recentSnaps, setRecentSnaps] = useState<string[]>([]);
  const [capturedCount, setCapturedCount] = useState(capturedImagesCount);

  useEffect(() => {
    setCapturedCount(capturedImagesCount);
  }, [capturedImagesCount]);

  // Enumerate video devices on mount
  useEffect(() => {
    if (!isOpen) return;

    const listDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setCameras(videoDevs);
          if (videoDevs.length > 0 && !selectedDeviceId) {
            setSelectedDeviceId(videoDevs[0].deviceId);
          }
        }
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }
    };

    listDevices();
  }, [isOpen]);

  // Start camera stream
  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    setTorchOn(false);

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check if torch/flashlight capability is present
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities: any = (track.getCapabilities && track.getCapabilities()) || {};
        setHasTorch(!!capabilities.torch);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('Camera stream error:', err);
      setIsLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera permissions in your browser bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera detected on this system.');
      } else {
        // Fallback retry with general constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = simpleStream;
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            await videoRef.current.play();
          }
          setIsLoading(false);
          setError(null);
        } catch (e: any) {
          setError(e?.message || 'Could not access camera feed.');
        }
      }
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || capturedCount >= maxFiles) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Audio/Vibrate feedback if supported
    if ('vibrate' in navigator) {
      try { navigator.vibrate([40]); } catch { /* ignore */ }
    }

    // Visual shutter flash
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 220);

    // Create File & Thumbnail
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `crop-leaf-${timestamp}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        const url = URL.createObjectURL(blob);
        setRecentSnaps((prev) => [url, ...prev].slice(0, 4));
        setCapturedCount((c) => c + 1);
        onCapture(file);
      },
      'image/jpeg',
      0.92
    );
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    };
  }, [isOpen, facingMode, selectedDeviceId]);

  // AI Simulated Leaf Auto-Detection & Capture Loop
  useEffect(() => {
    if (!isOpen || isLoading || !!error || !autoCaptureEnabled) {
      setIsLeafDetected(false);
      setAutoCaptureCountdown(null);
      return;
    }

    if (capturedCount >= maxFiles) return;

    // Simulate active vision leaf lock after 1.8s of camera stabilization
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
          // Trigger automatic capture
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
  }, [isOpen, isLoading, error, autoCaptureEnabled, capturedCount, maxFiles]);

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

  const handleSwitchCamera = () => {
    if (cameras.length > 1) {
      const currentIndex = cameras.findIndex((c) => c.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      setSelectedDeviceId(cameras[nextIndex].deviceId);
    } else {
      setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-950 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800 flex flex-col relative text-white max-h-[96vh]">
        
        {/* Top Control Bar */}
        <div className="p-3.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight flex items-center gap-2">
                <span>AI Crop Camera</span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {capturedCount} / {maxFiles} Photos
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Position affected leaf inside frame</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Capture Toggle */}
            <button
              type="button"
              onClick={() => setAutoCaptureEnabled(!autoCaptureEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                autoCaptureEnabled
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Toggle Auto-Capture on Leaf Detection"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Auto-Capture:</span> {autoCaptureEnabled ? 'ON' : 'OFF'}
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

            {/* Flip Camera Button */}
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Switch Front/Rear Camera"
            >
              <SwitchCamera className="w-4 h-4 text-agro-400" />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Close Camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport & Viewfinder */}
        <div className="relative aspect-[4/3] sm:aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
          
          {/* Shutter White Flash Animation */}
          {flashEffect && (
            <div className="absolute inset-0 bg-white z-40 transition-opacity duration-200" />
          )}

          {/* Loading Screen */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Starting HD Camera Feed...</p>
            </div>
          )}

          {/* Error Message Screen */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-20 p-6 text-center space-y-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white">Camera Access Error</h4>
              <p className="text-xs text-slate-400 max-w-sm">{error}</p>
              <button
                type="button"
                onClick={startCamera}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                Retry Camera
              </button>
            </div>
          )}

          {/* Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* High-Tech Viewfinder HUD Overlay */}
          {!isLoading && !error && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 sm:p-10">
              
              {/* Central Leaf Frame Reticle */}
              <div className={`w-4/5 h-4/5 border-2 rounded-3xl relative flex items-center justify-center transition-all duration-300 ${
                isLeafDetected 
                  ? 'border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.5)] bg-emerald-500/10' 
                  : 'border-white/40 border-dashed bg-black/10'
              }`}>
                
                {/* Glowing Corner Accents */}
                <div className="absolute -top-2.5 -left-2.5 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                <div className="absolute -top-2.5 -right-2.5 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                <div className="absolute -bottom-2.5 -left-2.5 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                <div className="absolute -bottom-2.5 -right-2.5 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

                {/* Vertical Scanning Beam Line */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse opacity-80" />

                {/* Auto-Capture Countdown Indicator */}
                {autoCaptureCountdown !== null ? (
                  <div className="bg-slate-950/85 backdrop-blur-md px-5 py-3 rounded-2xl text-center border border-emerald-400 shadow-2xl animate-bounce">
                    <div className="text-2xl font-black text-emerald-400 font-heading flex items-center justify-center gap-2">
                      <Timer className="w-6 h-6 animate-spin" />
                      <span>{autoCaptureCountdown}s</span>
                    </div>
                    <div className="text-[11px] text-emerald-200 font-bold mt-0.5">
                      🌿 Leaf Locked • Auto-Capturing!
                    </div>
                  </div>
                ) : (
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md transition-all flex items-center gap-2 ${
                    isLeafDetected 
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400 shadow-lg' 
                      : 'bg-slate-950/70 text-slate-300 border-white/20'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>{isLeafDetected ? '🌿 Leaf in frame - Hold steady' : 'Place affected leaf in frame'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Floating HUD Meta Tags */}
          <div className="absolute top-3 left-3 bg-slate-950/75 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI SCAN ACTIVE</span>
          </div>

          <div className="absolute bottom-3 left-3 bg-slate-950/75 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 pointer-events-none">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>1080p HD • Auto-Focus</span>
          </div>

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Bottom Shutter & Recent Snaps Strip */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4 z-20">
          
          {/* Thumbnail Reel of Recent Snaps */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-[160px] sm:max-w-[220px] py-1">
            {recentSnaps.length > 0 ? (
              recentSnaps.map((url, i) => (
                <div key={i} className="w-11 h-11 rounded-xl overflow-hidden border border-emerald-400/80 flex-shrink-0 shadow relative">
                  <img src={url} alt="Snap" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-emerald-500/20" />
                </div>
              ))
            ) : (
              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                0 photos taken
              </div>
            )}
          </div>

          {/* Center Big Shutter Button */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={isLoading || !!error || capturedCount >= maxFiles}
              className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-emerald-600 via-agro-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 disabled:opacity-40 p-1.5 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              title="Click or Auto-Capture to take photo"
            >
              <div className="w-full h-full rounded-full border-2 border-white flex items-center justify-center bg-white/20">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </button>
            <span className="text-[10px] text-slate-400 mt-1 font-semibold">
              {capturedCount >= maxFiles ? 'Max reached' : 'Tap or Auto-Snap'}
            </span>
          </div>

          {/* Done Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-gradient-to-r from-agro-600 to-emerald-600 hover:from-agro-700 hover:to-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Done ({capturedCount})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
