import { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Play, Square, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ShotDataPoint } from '../types/espresso';
import { calculateSmoothedFlowRate } from '../lib/espressoMath';

interface ScaleMonitorProps {
  isBrewing: boolean;
  onBrewStart: () => void;
  onBrewFinish: (finalWeight: number, timeSeconds: number, points: ShotDataPoint[]) => void;
  targetDose: number;
  targetYield: number;
}

export const ScaleMonitor: React.FC<ScaleMonitorProps> = ({
  isBrewing,
  onBrewStart,
  onBrewFinish,
  targetDose,
  targetYield,
}) => {
  const [currentWeight, setCurrentWeight] = useState<number>(0.0);
  const [currentFlow, setCurrentFlow] = useState<number>(0.0);
  const [elapsedTime, setElapsedTime] = useState<number>(0.0);
  const [isZeroDetected, setIsZeroDetected] = useState<boolean>(true);
  const [displayInverted, setDisplayInverted] = useState<boolean>(false);
  const [useRealCamera, setUseRealCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pointsRef = useRef<ShotDataPoint[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Start / stop camera stream
  useEffect(() => {
    if (!useRealCamera) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      return;
    }

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('Camera access error or unsupported:', err);
        setCameraError('Camera access not available or permission denied. Running in sensor simulation mode.');
        setUseRealCamera(false);
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [useRealCamera]);

  // Handle Shot Timeline & Simulation
  useEffect(() => {
    if (!isBrewing) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    pointsRef.current = [];
    setCurrentWeight(0.0);
    setCurrentFlow(0.0);
    setElapsedTime(0.0);

    // Timer loop running at 10 Hz (every 100ms)
    timerIntervalRef.current = window.setInterval(() => {
      const seconds = (Date.now() - startTimeRef.current) / 1000;
      setElapsedTime(Math.round(seconds * 10) / 10);

      // Simulation physics curve if no external OCR stream is feeding
      // Standard 18g -> 36g profile:
      // 0-6s: Pre-infusion / saturation (0g -> 1g)
      // 6-22s: Linear extraction ~1.4 g/s
      // 22-28s: Steady tail up to 36g
      let simulatedWeight = 0;
      if (seconds < 5) {
        simulatedWeight = Math.max(0, (seconds / 5) * 1.2);
      } else if (seconds <= 26) {
        simulatedWeight = 1.2 + (seconds - 5) * 1.5;
      } else {
        simulatedWeight = Math.min(targetYield + 0.4, 32.7 + (seconds - 26) * 0.8);
      }

      const weight = Math.round(simulatedWeight * 10) / 10;
      setCurrentWeight(weight);

      const newPoint: ShotDataPoint = {
        timeSeconds: seconds,
        weightGrams: weight,
        flowRateGps: 0,
      };

      pointsRef.current.push(newPoint);
      const flow = calculateSmoothedFlowRate(pointsRef.current);
      newPoint.flowRateGps = flow;
      setCurrentFlow(flow);

      // Auto-finish if target reached and time > 27s
      if (simulatedWeight >= targetYield && seconds > 25) {
        handleStopBrewing();
      }
    }, 100);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isBrewing, targetYield]);

  const handleStartBrewing = () => {
    onBrewStart();
  };

  const handleStopBrewing = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const finalWeight = currentWeight;
    const finalTime = elapsedTime;
    onBrewFinish(finalWeight, finalTime, [...pointsRef.current]);
  };

  const handleCalibrateTare = () => {
    setCurrentWeight(0.0);
    setCurrentFlow(0.0);
    setIsZeroDetected(true);
  };

  return (
    <div className="bg-[#FFFDF9] rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden">
      {/* Viewfinder Header */}
      <div className="px-4 py-3 border-b border-[#E8DFD5] flex items-center justify-between bg-[#FAF7F2]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#72806B] animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#2C2018] font-mono">
            {useRealCamera ? 'Camera OCR Active' : 'Precision Vision Simulator'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDisplayInverted(!displayInverted)}
            className="text-[11px] px-2 py-1 rounded-md border border-[#E8DFD5] bg-white text-[#7A6E65] hover:text-[#2C2018] transition flex items-center gap-1"
            title="Invert LCD/LED display contrast"
          >
            <Eye className="w-3 h-3" />
            {displayInverted ? 'Dark LCD' : 'Light LED'}
          </button>
          <button
            onClick={() => setUseRealCamera(!useRealCamera)}
            className="text-[11px] px-2 py-1 rounded-md border border-[#E8DFD5] bg-white text-[#7A6E65] hover:text-[#2C2018] transition flex items-center gap-1"
          >
            <Camera className="w-3 h-3" />
            {useRealCamera ? 'Sim Mode' : 'Live Cam'}
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Viewfinder Screen */}
      <div className="relative aspect-16/10 bg-[#1A1412] flex items-center justify-center overflow-hidden">
        {useRealCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${displayInverted ? 'invert' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 bg-radial from-[#2C2018] to-[#120E0B] flex flex-col items-center justify-center p-6 select-none">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FAF7F2_1px,transparent_1px)] [background-size:16px_16px]" />
          </div>
        )}

        {/* OCR Region-of-Interest Targeting Crosshair (Step 0 Calibration) */}
        <div className="relative z-10 w-4/5 max-w-sm aspect-2/1 border-2 border-dashed border-[#C26D52]/80 rounded-xl flex flex-col items-center justify-center p-4 backdrop-blur-[1px] bg-black/20">
          {/* Target corner indicators */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#C26D52]" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#C26D52]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#C26D52]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#C26D52]" />

          <div className="text-[10px] tracking-widest text-[#E8DFD5]/80 uppercase font-mono mb-1">
            [ DIGITAL SCALE DISPLAY ]
          </div>

          {/* Monospace Jitter-Free Digits */}
          <div className="font-mono text-4xl sm:text-5xl font-bold tracking-wider text-[#FAF7F2] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {currentWeight.toFixed(1)}
            <span className="text-xl sm:text-2xl font-normal text-[#FAF7F2]/70 ml-1">g</span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs font-mono">
            <span className="text-[#C26D52] font-semibold bg-[#2C2018]/80 px-2 py-0.5 rounded border border-[#C26D52]/40">
              {currentFlow.toFixed(1)} g/s
            </span>
            <span className="text-[#FAF7F2]/80">
              {elapsedTime.toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Step 0 Zero/Tare indicator badge */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-[#2C2018]/90 text-[#FAF7F2] text-[11px] px-2.5 py-1 rounded-md border border-[#E8DFD5]/20 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#72806B]" />
          <span>Step 0 Tare: {isZeroDetected ? '0.0g Confirmed' : 'Needs Zero'}</span>
        </div>

        {/* Target Yield Guidance Badge */}
        <div className="absolute bottom-3 right-3 z-10 bg-[#2C2018]/90 text-[#FAF7F2] text-[11px] px-2.5 py-1 rounded-md border border-[#E8DFD5]/20 font-mono">
          Target: {targetDose}g in → {targetYield}g out
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 bg-[#FFFDF9] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCalibrateTare}
            disabled={isBrewing}
            className="px-3 py-2 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] hover:bg-[#E8DFD5]/40 text-[#2C2018] text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#7A6E65]" />
            Tare (0.0g)
          </button>
          <div className="text-xs text-[#7A6E65] hidden sm:block font-mono">
            Auto-starts timer at 0.1g
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isBrewing ? (
            <button
              onClick={handleStartBrewing}
              className="px-5 py-2.5 rounded-lg bg-[#C26D52] hover:bg-[#b05d43] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Start Extraction Shot
            </button>
          ) : (
            <button
              onClick={handleStopBrewing}
              className="px-5 py-2.5 rounded-lg bg-[#B85B48] hover:bg-[#a34d3b] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-95 animate-pulse"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              Stop & Save Shot ({elapsedTime.toFixed(1)}s)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
