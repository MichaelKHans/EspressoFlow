import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Scan,
  RotateCcw,
  VideoOff,
  Crosshair,
  Zap,
} from 'lucide-react';
import type { ShotDataPoint } from '../types/espresso';
import { calculateSmoothedFlowRate } from '../lib/espressoMath';
import { recognizeScaleDigits, ScaleReadingFilter, type OCRResult } from '../lib/ocr7segment';
import { useTranslation } from '../i18n';

interface ScaleMonitorProps {
  isBrewing: boolean;
  onBrewStart: () => void;
  onBrewFinish: (
    finalWeight: number,
    totalTimeSeconds: number,
    preInfusionSeconds: number,
    flowTimeSeconds: number,
    points: ShotDataPoint[]
  ) => void;
  onBrewCancel?: () => void;
  targetDose: number;
  targetYield: number;
  machinePreInfusionSetting?: number;
}

export const ScaleMonitor: React.FC<ScaleMonitorProps> = ({
  isBrewing,
  onBrewStart,
  onBrewFinish,
  onBrewCancel,
  targetDose,
  targetYield,
  machinePreInfusionSetting = 5.0,
}) => {
  const { t } = useTranslation();
  const [currentWeight, setCurrentWeight] = useState<number>(0.0);
  const [currentFlow, setCurrentFlow] = useState<number>(0.0);
  const [elapsedTime, setElapsedTime] = useState<number>(0.0);
  const [isZeroDetected, setIsZeroDetected] = useState<boolean>(false);
  const [displayMode, setDisplayMode] = useState<'led' | 'lcd'>('led');
  const [cameraState, setCameraState] = useState<'standby' | 'live' | 'demo'>('live');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scale Arming & Pre-Brewing State
  const [isArmed, setIsArmed] = useState<boolean>(false);
  const isArmedRef = useRef<boolean>(false);

  // Camera Optical Zoom & Interactive ROI Alignment state
  const [zoomLevel, setZoomLevel] = useState<number>(1.8);
  const [roiSize, setRoiSize] = useState<'compact' | 'standard'>('compact');
  const [roiCenter, setRoiCenter] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [tapFeedback, setTapFeedback] = useState<{ x: number; y: number } | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);

  const zoomLevelRef = useRef<number>(1.8);
  const roiSizeRef = useRef<'compact' | 'standard'>('compact');
  const roiCenterRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // Split-Timer state
  const [firstDropTime, setFirstDropTime] = useState<number | null>(null);
  const [preInfusionDuration, setPreInfusionDuration] = useState<number>(0.0);
  const [activeFlowDuration, setActiveFlowDuration] = useState<number>(0.0);

  // Vision Inspector state
  const [showInspector, setShowInspector] = useState<boolean>(false);
  const [lastOcrResult, setLastOcrResult] = useState<OCRResult | null>(null);
  const [ocrFps, setOcrFps] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const inspectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pointsRef = useRef<ShotDataPoint[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const ocrIntervalRef = useRef<number | null>(null);
  const filterRef = useRef<ScaleReadingFilter>(new ScaleReadingFilter());
  const startTimeRef = useRef<number>(0);
  const firstDropTimeRef = useRef<number | null>(null);
  const fpsCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(Date.now());

  // Interactive Zoom, Torch & Recenter Handlers
  const handleSetZoom = async (newZoom: number) => {
    zoomLevelRef.current = newZoom;
    setZoomLevel(newZoom);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        try {
          const caps: any = track.getCapabilities ? track.getCapabilities() : {};
          if ('zoom' in caps && caps.zoom) {
            const clamped = Math.max(caps.zoom.min || 1, Math.min(caps.zoom.max || 1, newZoom));
            await track.applyConstraints({ advanced: [{ zoom: clamped } as any] });
          }
        } catch (e) {
          console.debug('Hardware zoom not applicable, optical crop active', e);
        }
      }
    }
  };

  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track || !track.applyConstraints) return;
    try {
      const next = !isTorchOn;
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setIsTorchOn(next);
    } catch (e) {
      console.debug('Torch toggle error', e);
    }
  };

  const handleSetRoiSize = (mode: 'compact' | 'standard') => {
    roiSizeRef.current = mode;
    setRoiSize(mode);
  };

  const handleRecenter = () => {
    roiCenterRef.current = { x: 0.5, y: 0.5 };
    setRoiCenter({ x: 0.5, y: 0.5 });
  };

  const handleTapViewfinder = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (cameraState !== 'live') return;
    const container = e.currentTarget.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
      clientX = (e as React.TouchEvent).touches[0].clientX;
      clientY = (e as React.TouchEvent).touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    } else {
      return;
    }

    const relX = Math.max(0.18, Math.min(0.82, (clientX - container.left) / container.width));
    const relY = Math.max(0.18, Math.min(0.82, (clientY - container.top) / container.height));

    const newCenter = { x: relX, y: relY };
    roiCenterRef.current = newCenter;
    setRoiCenter(newCenter);
    setTapFeedback({ x: clientX - container.left, y: clientY - container.top });
    setTimeout(() => setTapFeedback(null), 1400);

    // Hardware continuous focus trigger on tap if supported
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        try {
          const caps: any = track.getCapabilities ? track.getCapabilities() : {};
          if ('focusMode' in caps && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
            track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }).catch(() => {});
          }
        } catch (err) {
          console.debug('hardware focus apply failed', err);
        }
      }
    }
  };

  // Start / stop camera stream based on cameraState
  useEffect(() => {
    if (cameraState !== 'live') {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
        });
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        if (track) {
          const caps: any = track.getCapabilities ? track.getCapabilities() : {};
          if ('torch' in caps) setHasTorch(true);

          const advanced: any = {};
          if ('focusMode' in caps && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
            advanced.focusMode = 'continuous';
          }
          if ('zoom' in caps && caps.zoom) {
            const desired = Math.max(caps.zoom.min || 1, Math.min(caps.zoom.max || 1, zoomLevelRef.current));
            advanced.zoom = desired;
          }
          if (Object.keys(advanced).length > 0 && track.applyConstraints) {
            track.applyConstraints({ advanced: [advanced] }).catch((e) => {
              console.debug('applyConstraints not allowed on track', e);
            });
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.debug('video play prevented', e);
          }
        }
      } catch (err: unknown) {
        console.warn('Camera access error or unsupported:', err);
        setCameraError('Camera access not available or permission denied. Switched to Demo Simulator.');
        setCameraState('demo');
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraState]);

  // Real-time Canvas OCR processing loop (running at ~15 FPS when camera is active)
  useEffect(() => {
    if (cameraState !== 'live') {
      if (ocrIntervalRef.current) clearInterval(ocrIntervalRef.current);
      return;
    }

    const offscreen = canvasRef.current || document.createElement('canvas');
    offscreen.width = 320;
    offscreen.height = 160;
    canvasRef.current = offscreen;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });

    ocrIntervalRef.current = window.setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2 || !ctx) return;

      const video = videoRef.current;
      const vW = video.videoWidth || 1280;
      const vH = video.videoHeight || 720;

      // Dynamic optical crop based on size mode, zoom level, and interactive ROI center
      const currentMode = roiSizeRef.current;
      const currentZoom = zoomLevelRef.current;
      const currentCenter = roiCenterRef.current;

      const baseW = currentMode === 'compact' ? 0.44 : 0.60;
      const baseH = currentMode === 'compact' ? 0.22 : 0.32;

      const cropW = (vW * baseW) / currentZoom;
      const cropH = (vH * baseH) / currentZoom;

      const centerX = vW * currentCenter.x;
      const centerY = vH * currentCenter.y;

      const cropX = Math.max(0, Math.min(vW - cropW, centerX - cropW / 2));
      const cropY = Math.max(0, Math.min(vH - cropH, centerY - cropH / 2));

      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, offscreen.width, offscreen.height);
      const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);

      // Perform 7-segment digit recognition with universal auto-polarity and glare rejection
      const result = recognizeScaleDigits(imgData, displayMode);
      setLastOcrResult(result);

      if (inspectorCanvasRef.current) {
        const inspCtx = inspectorCanvasRef.current.getContext('2d');
        if (inspCtx) {
          inspCtx.drawImage(offscreen, 0, 0, inspectorCanvasRef.current.width, inspectorCanvasRef.current.height);
          if (result.boundingBox) {
            const scaleX = inspectorCanvasRef.current.width / offscreen.width;
            const scaleY = inspectorCanvasRef.current.height / offscreen.height;
            inspCtx.strokeStyle = '#10B981';
            inspCtx.lineWidth = 2;
            inspCtx.strokeRect(
              result.boundingBox.x * scaleX,
              result.boundingBox.y * scaleY,
              result.boundingBox.width * scaleX,
              result.boundingBox.height * scaleY
            );
          }
        }
      }

      fpsCountRef.current++;
      const now = Date.now();
      if (now - lastFpsCalcTimeRef.current >= 1000) {
        setOcrFps(fpsCountRef.current);
        fpsCountRef.current = 0;
        lastFpsCalcTimeRef.current = now;
      }

      // Filter and update weight
      if (result.weight !== null) {
        const sanitized = filterRef.current.sanitize(result.weight, 0.066);
        if (!sanitized.isOutlier) {
          const w = Math.round(sanitized.weight * 10) / 10;
          setCurrentWeight(w);

          // Zero / Tare detection
          if (w === 0.0) {
            setIsZeroDetected(true);
          } else if (isArmedRef.current && !isBrewing && w >= 0.2) {
            // Auto-start extraction shot ONLY when user has armed the scale and liquid flows (>= 0.2g)!
            isArmedRef.current = false;
            setIsArmed(false);
            onBrewStart();
          }
        }
      }
    }, 66);

    return () => {
      if (ocrIntervalRef.current) clearInterval(ocrIntervalRef.current);
    };
  }, [cameraState, displayMode, isZeroDetected, isBrewing, onBrewStart]);

  // Handle Shot Timeline, Split-Timer & Simulation
  useEffect(() => {
    if (!isBrewing) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    firstDropTimeRef.current = null;
    pointsRef.current = [];
    setCurrentWeight(0.0);
    setCurrentFlow(0.0);
    setElapsedTime(0.0);
    setFirstDropTime(null);
    setPreInfusionDuration(0.0);
    setActiveFlowDuration(0.0);
    filterRef.current.reset(0);

    // Timer loop running at 10 Hz (every 100ms)
    timerIntervalRef.current = window.setInterval(() => {
      const seconds = (Date.now() - startTimeRef.current) / 1000;
      const roundedSeconds = Math.round(seconds * 10) / 10;
      setElapsedTime(roundedSeconds);

      let weight = currentWeight;

      // In simulation mode, generate a realistic pre-infusion & extraction curve
      if (cameraState === 'demo') {
        let simulatedWeight = 0;
        // 0-6s: Pre-infusion saturation (pressure builds, drops start at ~5.5s)
        if (seconds < 5.5) {
          simulatedWeight = 0.0;
        } else if (seconds <= 26) {
          simulatedWeight = 0.1 + (seconds - 5.5) * 1.6;
        } else {
          simulatedWeight = Math.min(targetYield + 0.4, 32.9 + (seconds - 26) * 0.8);
        }
        weight = Math.round(simulatedWeight * 10) / 10;
        setCurrentWeight(weight);
      }

      // Check for First Drip (Split-Timer Pre-Infusion Lock)
      if (weight >= 0.1) {
        if (firstDropTimeRef.current === null) {
          firstDropTimeRef.current = roundedSeconds;
          setFirstDropTime(roundedSeconds);
          setPreInfusionDuration(roundedSeconds);
        } else {
          const flowSec = Math.max(0, roundedSeconds - firstDropTimeRef.current);
          setActiveFlowDuration(Math.round(flowSec * 10) / 10);
        }
      } else {
        // Still in pre-infusion phase
        setPreInfusionDuration(roundedSeconds);
      }

      const newPoint: ShotDataPoint = {
        timeSeconds: roundedSeconds,
        weightGrams: weight,
        flowRateGps: 0,
      };

      pointsRef.current.push(newPoint);
      const flow = calculateSmoothedFlowRate(pointsRef.current);
      newPoint.flowRateGps = flow;
      setCurrentFlow(flow);

      // Auto-finish if target reached in demo mode
      if (cameraState === 'demo' && weight >= targetYield && seconds > 25) {
        handleStopBrewing();
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isBrewing, targetYield, cameraState]);

  const handleStartBrewing = () => {
    isArmedRef.current = false;
    setIsArmed(false);
    if (cameraState === 'standby') {
      setCameraState('live');
    }
    onBrewStart();
  };

  const handleArmScale = () => {
    handleCalibrateTare();
    isArmedRef.current = true;
    setIsArmed(true);
  };

  const handleDisarm = () => {
    isArmedRef.current = false;
    setIsArmed(false);
  };

  const handleStartCamera = () => {
    setCameraError(null);
    setCameraState('live');
  };

  const handleStopCamera = () => {
    isArmedRef.current = false;
    setIsArmed(false);
    setCameraState('standby');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartDemo = () => {
    setCameraError(null);
    setCameraState('demo');
  };

  const handleCancelBrewing = () => {
    isArmedRef.current = false;
    setIsArmed(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    startTimeRef.current = 0;
    firstDropTimeRef.current = null;
    pointsRef.current = [];
    setCurrentWeight(0.0);
    setCurrentFlow(0.0);
    setElapsedTime(0.0);
    setFirstDropTime(null);
    setPreInfusionDuration(0.0);
    setActiveFlowDuration(0.0);
    setIsZeroDetected(false);
    filterRef.current.reset(0);
    if (onBrewCancel) {
      onBrewCancel();
    }
  };

  const handleStopBrewing = () => {
    isArmedRef.current = false;
    setIsArmed(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const finalWeight = currentWeight;
    const finalTime = elapsedTime;
    const finalPre = firstDropTimeRef.current !== null ? firstDropTimeRef.current : (machinePreInfusionSetting || 5.0);
    const finalFlow = Math.max(0, Math.round((finalTime - finalPre) * 10) / 10);

    onBrewFinish(finalWeight, finalTime, finalPre, finalFlow, [...pointsRef.current]);
  };

  const handleCalibrateTare = () => {
    setCurrentWeight(0.0);
    setCurrentFlow(0.0);
    setIsZeroDetected(true);
    filterRef.current.reset(0);
  };

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden">
      {/* Viewfinder Header - Responsive on mobile */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#E8DFD5] bg-[#FAF7F2] flex items-center justify-between gap-2">
        {/* Left: Mode Status with Pulsating Indicator & State Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              cameraState === 'live'
                ? 'bg-[#72806B] animate-pulse'
                : cameraState === 'demo'
                ? 'bg-amber-500'
                : 'bg-[#7A6E65]'
            }`}
          />
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#2C2018] font-mono">
            {cameraState === 'live' ? (
              <>
                <span className="sm:hidden">LIVE {ocrFps} FPS</span>
                <span className="hidden sm:inline">{t('scale.ocr_active', { fps: ocrFps })}</span>
              </>
            ) : cameraState === 'demo' ? (
              'Demo'
            ) : (
              'Standby'
            )}
          </span>

          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider ${
              isBrewing
                ? 'bg-amber-400 text-black animate-pulse'
                : isArmed
                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 animate-pulse'
                : 'bg-[#C26D52]/15 text-[#C26D52] border border-[#C26D52]/30'
            }`}
          >
            {isBrewing ? 'Brewing' : isArmed ? 'Armed' : 'Aligning'}
          </span>
        </div>

        {/* Right / Controls: Compact Action Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {cameraState === 'standby' ? (
            <>
              <button
                type="button"
                onClick={handleStartCamera}
                className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg border border-[#72806B] bg-[#72806B]/15 hover:bg-[#72806B]/25 text-[#72806B] font-mono font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Camera className="w-3 h-3" />
                <span>{t('scale.start_cam_btn')}</span>
              </button>
              <button
                type="button"
                onClick={handleStartDemo}
                className="text-[10px] sm:text-[11px] px-2 py-1 rounded-lg border border-[#E8DFD5] bg-white text-[#7A6E65] hover:text-[#2C2018] font-mono transition"
              >
                {t('scale.demo_btn')}
              </button>
            </>
          ) : cameraState === 'live' ? (
            <>
              <button
                type="button"
                onClick={handleStopCamera}
                className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg border border-[#B85B48]/40 bg-[#B85B48]/10 hover:bg-[#B85B48]/20 text-[#B85B48] font-mono font-medium transition flex items-center gap-1 shadow-xs"
                title="Stop camera and return to standby"
              >
                <VideoOff className="w-3 h-3" />
                <span>{t('scale.stop_cam_btn')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowInspector(!showInspector)}
                className={`text-[10px] sm:text-[11px] px-2 py-1 rounded-lg border font-mono transition flex items-center gap-1 ${
                  showInspector
                    ? 'border-[#C26D52] bg-[#C26D52] text-white shadow-xs font-bold'
                    : 'border-[#E8DFD5] bg-white text-[#7A6E65] hover:text-[#2C2018]'
                }`}
                title="Align scale with viewfinder crosshair and verify digit recognition"
              >
                <Scan className="w-3 h-3" />
                <span>{t('scale.align')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleStartCamera}
                className="text-[10px] sm:text-[11px] px-2.5 py-1 rounded-lg border border-[#72806B] bg-[#72806B]/15 text-[#72806B] font-mono font-bold flex items-center gap-1 shadow-xs"
              >
                <Camera className="w-3 h-3" />
                <span>{t('scale.start_cam_btn')}</span>
              </button>
              <button
                type="button"
                onClick={handleStopCamera}
                className="text-[10px] sm:text-[11px] px-2 py-1 rounded-lg border border-[#E8DFD5] bg-white text-[#7A6E65] font-mono transition"
              >
                Standby
              </button>
            </>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Viewfinder Screen */}
      <div
        onClick={handleTapViewfinder}
        className="relative aspect-16/10 bg-[#1A1412] flex items-center justify-center overflow-hidden cursor-crosshair select-none"
      >
        {cameraState === 'standby' ? (
          <div className="absolute inset-0 bg-[#1A1412] flex flex-col items-center justify-center p-4 sm:p-6 text-center z-20 select-none animate-fadeIn">
            {/* Background subtle coffee dots */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF7F2_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex flex-col items-center max-w-sm">
              <div className="w-12 h-12 rounded-2xl bg-[#2C2018] border border-[#E8DFD5]/20 flex items-center justify-center text-[#C26D52] mb-3 shadow-inner">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#FAF7F2] font-mono mb-1">
                {t('scale.standby_title')}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#E8DFD5]/75 font-mono mb-4 leading-relaxed px-2">
                {t('scale.standby_desc')}
              </p>

              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="px-5 py-2.5 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white text-xs font-bold font-mono flex items-center gap-2 shadow-sm transition active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t('scale.start_cam_btn')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartDemo}
                  className="px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-[#E8DFD5] text-xs font-mono transition"
                >
                  {t('scale.demo_btn')}
                </button>
              </div>

              <div className="mt-4 text-[10px] text-[#E8DFD5]/50 font-mono">
                {t('scale.target_in_out', { dose: targetDose, yield: targetYield })}
              </div>
            </div>
          </div>
        ) : cameraState === 'live' ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover ${
                displayMode === 'lcd' ? 'invert' : ''
              }`}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-radial from-[#2C2018] to-[#120E0B] flex flex-col items-center justify-center p-6 select-none">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF7F2_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>
        )}

        {/* OCR Region-of-Interest Targeting Crosshair (Clean, uncluttered viewfinder) */}
        {(() => {
          const isDigitLocked = (cameraState === 'live' && lastOcrResult !== null && lastOcrResult.weight !== null && lastOcrResult.confidence >= 0.70) || (cameraState === 'demo' && isBrewing);
          return (
            <div
              style={{
                left: `${roiCenter.x * 100}%`,
                top: `${roiCenter.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute z-10 rounded-xl flex flex-col items-center justify-center p-3 sm:p-4 backdrop-blur-[1px] transition-all duration-200 pointer-events-none ${
                roiSize === 'compact'
                  ? 'w-[52%] max-w-[250px] aspect-21/9'
                  : 'w-[68%] max-w-[320px] aspect-2/1'
              } ${
                isBrewing
                  ? 'border-2 border-solid border-amber-400 bg-amber-400/10 shadow-[0_0_25px_rgba(251,191,36,0.3)]'
                  : isArmed
                  ? 'border-2 border-solid border-[#10B981] bg-[#10B981]/15 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                  : isDigitLocked
                  ? 'border-2 border-solid border-[#10B981] bg-[#10B981]/10 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : 'border-2 border-dashed border-[#C26D52]/80 bg-black/25'
              }`}
            >
              {/* Target corner indicators */}
              <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 ${isBrewing ? 'border-amber-400' : isArmed || isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />
              <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 ${isBrewing ? 'border-amber-400' : isArmed || isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />
              <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 ${isBrewing ? 'border-amber-400' : isArmed || isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />
              <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 ${isBrewing ? 'border-amber-400' : isArmed || isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />

              <div className="text-[9px] sm:text-[10px] tracking-widest uppercase font-mono mb-0.5 flex items-center gap-1.5">
                {isBrewing ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-300 font-bold">[ ☕ BREWING ]</span>
                  </>
                ) : isArmed ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                    <span className="text-[#10B981] font-bold">[ 🟢 ARMED • WAITING FOR FLOW ]</span>
                  </>
                ) : isDigitLocked ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981] font-bold">
                      [ {isZeroDetected ? 'TARE LOCKED (0.0g)' : `LOCKED: ${currentWeight.toFixed(1)}g`} ]
                    </span>
                  </>
                ) : (
                  <>
                    <Scan className="w-3 h-3 text-[#C26D52]" />
                    <span className="text-amber-300 font-bold">[ 👆 TAP DIGITS TO TARGET ]</span>
                  </>
                )}
              </div>

              {/* Monospace Jitter-Free Digits */}
              <div className="font-mono text-3xl sm:text-5xl font-bold tracking-wider text-[#FAF7F2] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {currentWeight.toFixed(1)}
                <span className="text-lg sm:text-2xl font-normal text-[#FAF7F2]/70 ml-1">g</span>
              </div>

              {/* Real-Time Telemetry & Split-Timer (Only during active extraction) */}
              {isBrewing && (
                <div className="mt-1 flex flex-col items-center gap-1 font-mono">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs">
                    <span className="text-[#C26D52] font-semibold bg-[#2C2018]/80 px-2 py-0.5 rounded border border-[#C26D52]/40">
                      {currentFlow.toFixed(1)} g/s
                    </span>
                    <span className="text-[#FAF7F2]/90 font-bold">
                      {elapsedTime.toFixed(1)}s
                    </span>
                  </div>

                  {/* Split-Timer Active Phase Display */}
                  <div className="flex items-center gap-2 text-[10px] text-[#FAF7F2]/80 bg-black/50 px-2.5 py-0.5 rounded border border-white/10 mt-0.5">
                    {firstDropTime === null ? (
                      <span className="text-amber-300 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Pre-infusion: {preInfusionDuration.toFixed(1)}s (Waiting for 1st drop)
                      </span>
                    ) : (
                      <span>
                        Pre: <strong className="text-amber-300">{preInfusionDuration.toFixed(1)}s</strong> | Flow: <strong className="text-[#72806B]">{activeFlowDuration.toFixed(1)}s</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tap-to-Focus Pulsing Ring Feedback */}
        {tapFeedback && (
          <div
            className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: tapFeedback.x, top: tapFeedback.y }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-emerald-400 bg-emerald-400/30" />
            <div className="absolute top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/80 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-400/50 shadow-md whitespace-nowrap">
              🎯 Aligned & Focused
            </div>
          </div>
        )}
      </div>

      {/* External Camera Controls Toolbar (All controls outside camera viewfinder) */}
      <div className="px-3 py-2 bg-[#1A1412] border-t border-[#E8DFD5]/20 flex items-center justify-between gap-2 overflow-x-auto select-none">
        {/* Left: Optical Zoom Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] uppercase font-mono text-[#E8DFD5]/60 mr-1 hidden xs:inline">Zoom:</span>
          {[1.0, 1.8, 2.5].map((z) => (
            <button
              key={z}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSetZoom(z);
              }}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition ${
                Math.abs(zoomLevel - z) < 0.1
                  ? 'bg-[#C26D52] text-white shadow-xs'
                  : 'bg-white/10 text-[#E8DFD5]/80 hover:bg-white/20'
              }`}
            >
              {z.toFixed(1)}x
            </button>
          ))}
        </div>

        {/* Center: Recenter & Box Size */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(roiCenter.x !== 0.5 || roiCenter.y !== 0.5) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRecenter();
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1"
              title="Reset focus box to center"
            >
              <Crosshair className="w-3 h-3" />
              <span>Center</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSetRoiSize(roiSize === 'compact' ? 'standard' : 'compact');
            }}
            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/10 text-[#E8DFD5]/80 hover:bg-white/20 transition"
          >
            {roiSize === 'compact' ? 'Compact' : 'Standard'}
          </button>
        </div>

        {/* Right: Display Polarity (LED/LCD), Torch & Diagnostic Inspector */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDisplayMode(displayMode === 'led' ? 'lcd' : 'led');
            }}
            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/10 text-[#E8DFD5]/80 hover:bg-white/20 transition flex items-center gap-1"
            title="Toggle scale display type (LED bright digits or LCD dark digits)"
          >
            <span>{displayMode.toUpperCase()}</span>
          </button>

          {hasTorch && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTorch();
              }}
              className={`p-1.5 rounded-md text-xs transition ${
                isTorchOn
                  ? 'bg-amber-400 text-black shadow-xs'
                  : 'bg-white/10 text-[#E8DFD5]/80 hover:bg-white/20'
              }`}
              title="Toggle flashlight"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowInspector(!showInspector);
            }}
            className={`p-1.5 rounded-md text-xs transition ${
              showInspector
                ? 'bg-[#C26D52] text-white shadow-xs'
                : 'bg-white/10 text-[#E8DFD5]/80 hover:bg-white/20'
            }`}
            title="Toggle OCR diagnostic inspector"
          >
            <Scan className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Vision Inspector Drawer (Action-Oriented Scale Alignment) */}
      {showInspector && (
        <div className="p-4 bg-[#1A1412] text-[#FAF7F2] border-t border-[#E8DFD5]/20 font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Scan className="w-3.5 h-3.5 text-[#C26D52]" />
              <span className="font-bold text-[#FAF7F2] uppercase tracking-wider text-[11px]">
                {t('scale.inspector_title')}
              </span>
            </div>
            <div className="text-[11px] text-[#E8DFD5]/70">
              Latency: &lt;3ms • Contrast Threshold: {lastOcrResult?.thresholdUsed || 128}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Binary canvas preview */}
            <div className="bg-black rounded-lg p-2 border border-[#E8DFD5]/20 flex flex-col items-center">
              <div className="text-[10px] text-[#E8DFD5]/60 mb-1">{t('scale.processed_projection')}</div>
              <canvas
                ref={inspectorCanvasRef}
                width={240}
                height={80}
                className="w-full max-w-[240px] h-auto border border-[#E8DFD5]/30 rounded bg-black"
              />
            </div>

            {/* Digits recognition status */}
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-[#E8DFD5]/60">{t('scale.detected_digits')}: </span>
                <span className="text-[#C26D52] font-bold text-sm bg-black/40 px-2 py-0.5 rounded font-mono">
                  {lastOcrResult?.rawText || '0.0'}
                </span>
              </div>
              <div>
                <span className="text-[#E8DFD5]/60">{t('scale.confidence')}: </span>
                <span className="text-[#72806B] font-semibold">
                  {lastOcrResult ? `${Math.round(lastOcrResult.confidence * 100)}%` : '100%'}
                </span>
              </div>
              <div>
                <span className="text-[#E8DFD5]/60">{t('scale.display_mode')}: </span>
                <span className="text-[#FAF7F2]">
                  {displayMode.toUpperCase()}
                  {lastOcrResult?.detectedPolarity && (
                    <span className="text-[#E8DFD5]/50 ml-1">
                      [sensor: {lastOcrResult.detectedPolarity.toUpperCase()}]
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-[#E8DFD5]/60">{t('scale.layout')}: </span>
                <span className="text-[#FAF7F2]">
                  {lastOcrResult?.layoutType === 'side-by-side'
                    ? 'Side-by-side (Isolated Timer)'
                    : lastOcrResult?.layoutType === 'stacked'
                    ? 'Stacked Dual-Row'
                    : 'Single Row'}
                </span>
              </div>
              <div>
                <span className="text-[#E8DFD5]/60">Auto-Timer: </span>
                <span className="text-[#FAF7F2]">{t('scale.auto_timer_active')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barista Control Deck */}
      <div className="p-3.5 sm:p-4 bg-[#FFFDF9] border-t border-[#E8DFD5] flex flex-col gap-3">
        {/* Status / Guidance Banner */}
        {!isBrewing && !isArmed ? (
          <div className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#7A6E65]">
              <span className="text-[#C26D52] text-base leading-none">👆</span>
              <span className="text-[11px] sm:text-xs leading-tight">
                {t('scale.align_instruction')}
              </span>
            </div>
            <div className="shrink-0 text-right text-[11px] text-[#2C2018] font-bold">
              <span className="text-[#C26D52]">{targetDose}g</span> → <span className="text-[#72806B]">{targetYield}g</span>
            </div>
          </div>
        ) : isArmed ? (
          <div className="px-3 py-2 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#10B981] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping shrink-0" />
              <span className="text-[11px] sm:text-xs leading-tight">
                {t('scale.armed_waiting')}
              </span>
            </div>
            <div className="shrink-0 text-right text-[11px] text-[#2C2018] font-bold">
              <span className="text-[#C26D52]">{targetDose}g</span> → <span className="text-[#72806B]">{targetYield}g</span>
            </div>
          </div>
        ) : (
          <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="text-[11px] sm:text-xs leading-tight">
                {t('scale.brewing_status')}
              </span>
            </div>
            <div className="shrink-0 text-right text-[11px] text-[#2C2018] font-bold">
              <span className="text-[#C26D52]">{targetDose}g</span> → <span className="text-[#72806B]">{targetYield}g</span>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          {!isBrewing && !isArmed ? (
            <>
              <button
                type="button"
                onClick={handleCalibrateTare}
                className="px-3.5 py-2.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5]/40 text-[#2C2018] text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-xs active:scale-95 shrink-0"
                title="Tare the scale to 0.0g"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#7A6E65]" />
                <span>{t('scale.tare', { weight: '0.0' })}</span>
              </button>

              <button
                type="button"
                onClick={handleArmScale}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#C26D52] hover:bg-[#b05d43] text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>{t('scale.arm_scale')}</span>
              </button>
            </>
          ) : isArmed ? (
            <>
              <button
                type="button"
                onClick={handleDisarm}
                className="px-3.5 py-2.5 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5]/40 text-[#7A6E65] hover:text-[#2C2018] text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-xs active:scale-95 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('scale.adjust_alignment')}</span>
              </button>

              <button
                type="button"
                onClick={handleStartBrewing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-sm transition active:scale-95 animate-pulse"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{t('scale.start_shot_now')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelBrewing}
                className="px-3.5 py-2.5 rounded-xl border border-[#B85B48]/40 bg-[#B85B48]/10 hover:bg-[#B85B48]/20 text-[#B85B48] text-xs font-bold font-mono flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-xs"
                title={t('scale.reset_title')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('scale.reset')}</span>
              </button>

              <button
                type="button"
                onClick={handleStopBrewing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#B85B48] hover:bg-[#a34d3b] text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-xs transition active:scale-95 animate-pulse font-mono truncate"
              >
                <Square className="w-3.5 h-3.5 fill-white shrink-0" />
                <span className="truncate">{t('scale.stop_and_save', { duration: elapsedTime.toFixed(1) })}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
