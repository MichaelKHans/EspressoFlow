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
import { wakeLock } from '../lib/wakeLock';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

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
  onLivePointsUpdate?: (points: ShotDataPoint[]) => void;
  targetDose: number;
  targetYield: number;
  machinePreInfusionSetting?: number;
}

export const ScaleMonitor: React.FC<ScaleMonitorProps> = ({
  isBrewing,
  onBrewStart,
  onBrewFinish,
  onBrewCancel,
  onLivePointsUpdate,
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

  // Camera Optical Zoom & Interactive ROI Alignment state
  const [zoomLevel, setZoomLevel] = useState<number>(1.8);
  const [roiSize, setRoiSize] = useState<'compact' | 'standard'>('compact');
  const [roiCenter, setRoiCenter] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [tapFeedback, setTapFeedback] = useState<{ x: number; y: number } | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [tiltAngle, setTiltAngle] = useState<number | null>(null);

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
  const currentWeightRef = useRef<number>(0.0);
  const startTimeRef = useRef<number>(0);
  const firstDropTimeRef = useRef<number | null>(null);
  const fpsCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(Date.now());
  const hasVibratedTargetRef = useRef<boolean>(false);
  const hasVibratedChannelingRef = useRef<boolean>(false);

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

  const requestOrientationPermission = () => {
    try {
      if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((state: string) => {
            if (state === 'granted') {
              const handleOrientation = (e: DeviceOrientationEvent) => {
                if (e.beta !== null) setTiltAngle(Math.round(e.beta));
              };
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(() => {});
      }
    } catch {
      // Ignored
    }
  };

  const handleRecenter = () => {
    requestOrientationPermission();
    roiCenterRef.current = { x: 0.5, y: 0.5 };
    setRoiCenter({ x: 0.5, y: 0.5 });
  };

  const handleTapViewfinder = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    requestOrientationPermission();
    if (cameraState !== 'live') return;
    const container = e.currentTarget.getBoundingClientRect();
    let clientX: number, clientY: number;
    // Prefer changedTouches (available in touchend) for precise lift-off coordinates
    if ('changedTouches' in e && (e as React.TouchEvent).changedTouches.length > 0) {
      clientX = (e as React.TouchEvent).changedTouches[0].clientX;
      clientY = (e as React.TouchEvent).changedTouches[0].clientY;
    } else if ('touches' in e && (e as React.TouchEvent).touches.length > 0) {
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

    // Hardware focus with point-of-interest targeting for precise tap-to-focus
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.applyConstraints) {
        try {
          const caps: any = track.getCapabilities ? track.getCapabilities() : {};
          const advanced: any = {};

          // Point-of-interest targeting (supported on newer Android devices)
          if ('pointsOfInterest' in caps) {
            advanced.pointsOfInterest = [{ x: relX, y: relY }];
          }

          // Single-shot focus for precise tap targeting, falling back to continuous
          if ('focusMode' in caps && Array.isArray(caps.focusMode)) {
            if (caps.focusMode.includes('single-shot')) {
              advanced.focusMode = 'single-shot';
            } else if (caps.focusMode.includes('continuous')) {
              advanced.focusMode = 'continuous';
            }
          }

          if (Object.keys(advanced).length > 0) {
            track.applyConstraints({ advanced: [advanced] as any }).catch(() => {});
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

  // Device Orientation Tilt Meter (accelerometer-based angle indicator for alignment help)
  useEffect(() => {
    if (cameraState !== 'live') {
      setTiltAngle(null);
      return;
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // beta = front-to-back tilt (0° = flat on table, 90° = upright)
      if (e.beta !== null) {
        setTiltAngle(Math.round(e.beta));
      }
    };

    // On non-iOS devices, attach orientation listener directly
    if (typeof (DeviceOrientationEvent as any)?.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [cameraState]);

  // Keep screen awake while monitoring scale or active brewing
  useEffect(() => {
    if (cameraState === 'live' || isBrewing) {
      wakeLock.acquire();
    } else {
      wakeLock.release();
    }
    return () => {
      wakeLock.release();
    };
  }, [cameraState, isBrewing]);

  // Real-time Canvas OCR processing loop (adaptive FPS: ~12.5 FPS standby, ~30 FPS active brewing)
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

    const ocrIntervalMs = isBrewing ? 33 : 80;
    const dt = isBrewing ? 0.033 : 0.080;

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
        const sanitized = filterRef.current.sanitize(result.weight, dt);
        if (!sanitized.isOutlier) {
          const w = Math.round(sanitized.weight * 10) / 10;
          setCurrentWeight(w);
          currentWeightRef.current = w;

          // Zero / Tare detection with tactile haptic pulse
          if (w === 0.0) {
            if (!isZeroDetected) {
              Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
            }
            setIsZeroDetected(true);
          }
        }
      }
    }, ocrIntervalMs);

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
    hasVibratedTargetRef.current = false;
    hasVibratedChannelingRef.current = false;
    pointsRef.current = [];
    setCurrentWeight(0.0);
    currentWeightRef.current = 0.0;
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

      let weight = currentWeightRef.current;

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
        currentWeightRef.current = weight;
      }

      // Check for First Drip with vibration filter (≥ 0.4g ensures only real espresso drops trigger flow phase)
      if (weight >= 0.4) {
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
      if (onLivePointsUpdate) {
        onLivePointsUpdate([...pointsRef.current]);
      }

      // Tactile haptic notification on reaching target yield
      if (weight >= targetYield && !hasVibratedTargetRef.current) {
        hasVibratedTargetRef.current = true;
        Haptics.notification({ type: NotificationType.Success }).catch(() => {});
      }

      // Channeling detection haptic alert (sudden spike > 4.2 g/s after pre-infusion)
      if (firstDropTimeRef.current !== null && flow > 4.2 && !hasVibratedChannelingRef.current) {
        hasVibratedChannelingRef.current = true;
        Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
      }

      // Auto-finish if target reached in demo mode
      if (cameraState === 'demo' && weight >= targetYield && seconds > 25) {
        handleStopBrewing();
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isBrewing, targetYield, cameraState, onLivePointsUpdate]);

  const handleStartBrewing = () => {
    requestOrientationPermission();
    Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
    if (cameraState === 'standby') {
      setCameraState('live');
    }
    onBrewStart();
  };

  const handleStartCamera = () => {
    requestOrientationPermission();
    setCameraError(null);
    setCameraState('live');
  };

  const handleStopCamera = () => {
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
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    startTimeRef.current = 0;
    firstDropTimeRef.current = null;
    pointsRef.current = [];
    setCurrentWeight(0.0);
    currentWeightRef.current = 0.0;
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
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const finalWeight = currentWeightRef.current;
    const finalTime = elapsedTime;
    const finalPre = firstDropTimeRef.current !== null ? firstDropTimeRef.current : (machinePreInfusionSetting || 5.0);
    const finalFlow = Math.max(0, Math.round((finalTime - finalPre) * 10) / 10);

    onBrewFinish(finalWeight, finalTime, finalPre, finalFlow, [...pointsRef.current]);
  };

  const handleCalibrateTare = () => {
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    setCurrentWeight(0.0);
    currentWeightRef.current = 0.0;
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
                : 'bg-[#C26D52]/15 text-[#C26D52] border border-[#C26D52]/30'
            }`}
          >
            {isBrewing ? 'Brewing' : 'Ready'}
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
                onClick={handleRecenter}
                className="text-[10px] sm:text-[11px] px-2 py-1 rounded-lg border border-[#E8DFD5] bg-white text-[#7A6E65] hover:text-[#2C2018] font-mono transition flex items-center gap-1 shadow-xs active:scale-95"
                title="Re-center alignment target box on display"
              >
                <Crosshair className="w-3 h-3 text-[#C26D52]" />
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
        onTouchEnd={(e) => { e.preventDefault(); handleTapViewfinder(e); }}
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
              className={`absolute z-10 rounded-xl transition-all duration-200 pointer-events-none ${
                roiSize === 'compact'
                  ? 'w-[52%] max-w-[250px] aspect-21/9'
                  : 'w-[68%] max-w-[320px] aspect-2/1'
              } ${
                isBrewing
                  ? 'border-2 border-solid border-amber-400/90 bg-amber-400/5 shadow-[0_0_20px_rgba(251,191,36,0.25)]'
                  : isDigitLocked
                  ? 'border-2 border-solid border-[#10B981] bg-[#10B981]/5 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'border-2 border-dashed border-[#C26D52]/80 bg-black/10'
              }`}
            >
              {/* Target corner indicators */}
              <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 ${isBrewing ? 'border-amber-400' : isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />
              <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 ${isBrewing ? 'border-amber-400' : isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />
              <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 ${isBrewing ? 'border-amber-400' : isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />
              <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 ${isBrewing ? 'border-amber-400' : isDigitLocked ? 'border-[#10B981]' : 'border-[#C26D52]'}`} />

              {/* Status Header Badge (Compact pill on top edge) */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] tracking-widest uppercase font-mono px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs flex items-center gap-1.5 shadow-sm border border-white/10 whitespace-nowrap">
                {isBrewing ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-300 font-bold">☕ BREWING</span>
                  </>
                ) : isDigitLocked ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    <span className="text-[#10B981] font-bold">
                      {isZeroDetected ? 'TARE LOCKED' : 'DIGITS LOCKED'}
                    </span>
                  </>
                ) : (
                  <>
                    <Scan className="w-2.5 h-2.5 text-[#C26D52]" />
                    <span className="text-amber-300 font-bold">TAP DIGITS TO TARGET</span>
                  </>
                )}
              </div>

              {/* Precise Auto-Detected Digit Bounding Box (The exact green frame on the scale) */}
              {lastOcrResult?.boundingBox && cameraState === 'live' && (
                <div
                  style={{
                    left: `${Math.max(0, Math.min(95, (lastOcrResult.boundingBox.x / 320) * 100))}%`,
                    top: `${Math.max(0, Math.min(95, (lastOcrResult.boundingBox.y / 160) * 100))}%`,
                    width: `${Math.max(5, Math.min(100, (lastOcrResult.boundingBox.width / 320) * 100))}%`,
                    height: `${Math.max(5, Math.min(100, (lastOcrResult.boundingBox.height / 160) * 100))}%`,
                  }}
                  className="absolute border-2 border-emerald-400 bg-emerald-400/15 rounded shadow-[0_0_12px_rgba(16,185,129,0.5)] pointer-events-none transition-all duration-75 flex items-start justify-end"
                >
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-emerald-500 text-black px-1 rounded -translate-y-full shadow-xs whitespace-nowrap">
                    {lastOcrResult.rawText}
                  </span>
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

        {/* Tilt Angle Indicator (DeviceOrientation accelerometer) */}
        {tiltAngle !== null && cameraState === 'live' && (
          <div className={`absolute top-2 right-2 z-20 px-2 py-1 rounded-lg font-mono text-[11px] font-bold backdrop-blur-sm border shadow-sm pointer-events-none ${
            tiltAngle >= 20 && tiltAngle <= 50
              ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
              : tiltAngle >= 10 && tiltAngle <= 60
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-red-500/20 text-red-300 border-red-500/40'
          }`}>
            📐 {tiltAngle}°
            {tiltAngle >= 20 && tiltAngle <= 50 && <span className="ml-1 text-[9px]">✓</span>}
          </div>
        )}


      </div>

      {/* External Camera Controls Toolbar (All controls outside camera viewfinder) */}
      <div className="px-2 py-1.5 bg-[#1A1412] border-t border-[#E8DFD5]/20 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 select-none">
        {/* Left: Optical Zoom Controls */}
        <div className="flex items-center gap-1">
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
        <div className="flex items-center gap-1.5">
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
        <div className="flex items-center gap-1.5">
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

      {/* Vision Inspector Drawer (Action-Oriented Scale Alignment Diagnostics) */}
      {showInspector && !isBrewing && (
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
      <div className="p-3 sm:p-4 bg-[#FFFDF9] border-t border-[#E8DFD5] flex flex-col gap-3 font-mono">
        {/* Real-Time Monospace Telemetry Grid (Uncluttered, High-Visibility) */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center select-none">
          {/* 1. Live Weight / Yield */}
          <div className="bg-[#FAF7F2] p-2 sm:p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-center shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#7A6E65] font-mono block">
              {isBrewing ? t('active_bean.yield') : 'Weight'}
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#2C2018] tracking-tight">
              {currentWeight.toFixed(1)}
              <span className="text-xs font-normal text-[#7A6E65] ml-0.5">g</span>
            </div>
          </div>

          {/* 2. Flow Rate */}
          <div className="bg-[#FAF7F2] p-2 sm:p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-center shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#7A6E65] font-mono block">
              Flow
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#C26D52] tracking-tight">
              {currentFlow.toFixed(1)}
              <span className="text-xs font-normal text-[#7A6E65] ml-0.5">g/s</span>
            </div>
          </div>

          {/* 3. Timer */}
          <div className="bg-[#FAF7F2] p-2 sm:p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-center shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#7A6E65] font-mono block">
              Time
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#2C2018] tracking-tight">
              {elapsedTime.toFixed(1)}
              <span className="text-xs font-normal text-[#7A6E65] ml-0.5">s</span>
            </div>
          </div>

          {/* 4. Ratio */}
          <div className="bg-[#FAF7F2] p-2 sm:p-2.5 rounded-xl border border-[#E8DFD5] flex flex-col justify-center shadow-2xs">
            <span className="text-[9px] uppercase tracking-wider text-[#7A6E65] font-mono block">
              {t('active_bean.ratio')}
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#72806B] tracking-tight">
              1:{(targetDose > 0 ? (currentWeight / targetDose).toFixed(1) : '2.0')}
            </div>
          </div>
        </div>

        {/* Real-time Pre-infusion vs Active Flow split pill during active extraction */}
        {isBrewing && (
          <div className="flex items-center justify-between text-[11px] bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl text-amber-900 font-mono shadow-2xs">
            {firstDropTime === null ? (
              <span className="animate-pulse flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Pre-infusion: {preInfusionDuration.toFixed(1)}s (Waiting for 1st drip)
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>Pre: <strong className="text-amber-700">{preInfusionDuration.toFixed(1)}s</strong></span>
                <span>•</span>
                <span>Flow: <strong className="text-emerald-700">{activeFlowDuration.toFixed(1)}s</strong></span>
              </span>
            )}
            <span className="text-[10px] text-amber-700 font-bold shrink-0">Target: {targetYield}g</span>
          </div>
        )}

        {/* Status / Guidance Banner */}
        {!isBrewing ? (
          <div className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#7A6E65]">
              <span className="text-[#C26D52] text-sm leading-none">☕</span>
              <span className="text-[11px] sm:text-xs leading-tight">
                {t('scale.manual_start_hint')}
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
                {firstDropTime === null
                  ? t('scale.pre_infusion_status')
                  : t('scale.brewing_status')}
              </span>
            </div>
            <div className="shrink-0 text-right text-[11px] text-[#2C2018] font-bold">
              <span className="text-[#C26D52]">{targetDose}g</span> → <span className="text-[#72806B]">{targetYield}g</span>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2">
          {!isBrewing ? (
            <>
              <button
                type="button"
                onClick={handleCalibrateTare}
                className="px-4 py-3 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5]/40 text-[#2C2018] text-xs font-bold font-mono flex items-center gap-1.5 transition shadow-xs active:scale-95 shrink-0"
                title="Tare the scale to 0.0g"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#7A6E65]" />
                <span>{t('scale.tare', { weight: '0.0' })}</span>
              </button>

              <button
                type="button"
                onClick={handleStartBrewing}
                className="flex-1 px-4 py-3 rounded-xl bg-[#2C2018] hover:bg-[#3D2C22] text-[#FAF7F2] text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-sm transition active:scale-95 border border-[#C26D52]/40"
              >
                <Play className="w-4 h-4 text-[#C26D52] fill-[#C26D52]" />
                <span>{t('scale.start_shot')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelBrewing}
                className="px-3.5 py-3 rounded-xl border border-[#B85B48]/40 bg-[#B85B48]/10 hover:bg-[#B85B48]/20 text-[#B85B48] text-xs font-bold font-mono flex items-center gap-1.5 transition active:scale-95 shrink-0 shadow-xs"
                title={t('scale.reset_title')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('scale.reset')}</span>
              </button>

              <button
                type="button"
                onClick={handleStopBrewing}
                className="flex-1 px-4 py-3 rounded-xl bg-[#B85B48] hover:bg-[#a34d3b] text-white text-xs font-bold font-mono flex items-center justify-center gap-2 shadow-xs transition active:scale-95 animate-pulse font-mono truncate"
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
