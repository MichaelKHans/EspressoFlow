import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  RefreshCw,
  Plus,
  Camera,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useTranslation } from '../i18n';
import { extractDatesAndRoastFromBagText, normalizeDateStringToISO } from '../lib/bagScanner';
import { preprocessImageForOcr } from '../lib/bagImageUtil';

export type FreshnessStatus = 'peak' | 'past_peak' | 'stale' | 'degassing';

export interface FreshnessVerdict {
  date: string; // ISO YYYY-MM-DD
  daysOffRoast: number;
  status: FreshnessStatus;
  statusLabel: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  glowColor: string;
  baristaVerdict: string;
  recommendedAction: string;
  isEstimatedFromBBD: boolean;
  rawMatchedSnippet?: string;
}

interface FreshnessRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToVault?: (scannedDate: string, isEstimated: boolean) => void;
  onOpenFullBagScanner?: () => void;
}

/**
 * Synthesizes short, tactile audio feedback without external audio files
 */
function playRadarAudio(status: FreshnessStatus) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (status === 'peak') {
      // Upbeat double-ping (D5 -> A5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (status === 'stale') {
      // Low descending warning buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.setValueAtTime(196, now + 0.09);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Neutral single chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Autoplay restrictions or headless browser
  }
}

/**
 * Triggers native haptic vibrations or browser fallback
 */
async function triggerRadarHaptic(status: FreshnessStatus) {
  try {
    if (status === 'peak') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (status === 'stale') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  } catch {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (status === 'peak') navigator.vibrate([40, 30, 70]);
      else if (status === 'stale') navigator.vibrate([120, 60, 120]);
      else navigator.vibrate(60);
    }
  }
}

/**
 * Evaluates days off roast and produces a Specialty Barista verdict
 */
export function evaluateDateFreshness(
  dateStr: string,
  isEstimatedFromBBD: boolean = false,
  rawSnippet?: string,
  lang: string = 'da'
): FreshnessVerdict {
  const iso = normalizeDateStringToISO(dateStr);
  const roast = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const roastZero = new Date(roast);
  roastZero.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - roastZero.getTime()) / (1000 * 60 * 60 * 24));

  const isDa = lang === 'da';

  if (diffDays < 5) {
    return {
      date: iso,
      daysOffRoast: diffDays,
      status: 'degassing',
      statusLabel: isDa ? '💨 FRISKRISTET • AFGASSER CO₂' : '💨 FRESH ROAST • DEGASSING',
      badgeBg: 'bg-[#C26D52]/20',
      badgeBorder: 'border-[#C26D52]',
      badgeText: 'text-[#E58367]',
      glowColor: 'shadow-[0_0_30px_rgba(194,109,82,0.45)]',
      baristaVerdict: isDa
        ? diffDays <= 0
          ? 'Ristet i dag / i går'
          : `Ristet for ${diffDays} dage siden (Afgasser)`
        : diffDays <= 0
        ? 'Roasted today / yesterday'
        : `Roasted ${diffDays} days ago (Degassing)`,
      recommendedAction: isDa
        ? 'Meget frisk kaffe med højt gastryk. Bør hvile 3-5 dage med posens envejsventil for ren smag uden skummende crema.'
        : 'Very fresh with high CO₂ pressure. Let rest 3-5 days in the bag with one-way valve for clean, unhindered extraction.',
      isEstimatedFromBBD,
      rawMatchedSnippet: rawSnippet,
    };
  } else if (diffDays <= 30) {
    return {
      date: iso,
      daysOffRoast: diffDays,
      status: 'peak',
      statusLabel: isDa ? '✨ GODKENDT • PEAK VINDUET' : '✨ APPROVED • PEAK WINDOW',
      badgeBg: 'bg-emerald-500/20',
      badgeBorder: 'border-emerald-400',
      badgeText: 'text-emerald-400',
      glowColor: 'shadow-[0_0_35px_rgba(16,185,129,0.55)]',
      baristaVerdict: isDa
        ? `Ristet for ${diffDays} dage siden (Guldvindue)`
        : `Roasted ${diffDays} days ago (Golden Window)`,
      recommendedAction: isDa
        ? 'Køb trygt! Kaffen er i sit absolutte aromatiske guldvindue med maksimal sødme, klar syre og perfekt crema.'
        : 'Safe to buy! Beans are in their prime aromatic sweet spot with maximum clarity, natural sweetness, and rich crema.',
      isEstimatedFromBBD,
      rawMatchedSnippet: rawSnippet,
    };
  } else if (diffDays <= 55) {
    return {
      date: iso,
      daysOffRoast: diffDays,
      status: 'past_peak',
      statusLabel: isDa ? '🟡 ACCEPTABEL • EFTER PEAK' : '🟡 ACCEPTABLE • PAST PEAK',
      badgeBg: 'bg-amber-500/20',
      badgeBorder: 'border-amber-400',
      badgeText: 'text-amber-400',
      glowColor: 'shadow-[0_0_30px_rgba(245,158,11,0.45)]',
      baristaVerdict: isDa
        ? `Ristet for ${diffDays} dage siden`
        : `Roasted ${diffDays} days ago`,
      recommendedAction: isDa
        ? 'Stadig god kaffe. De flygtigste blomsternoter er dæmpet – kværn 0.5-1 trin finere. Fremragende til mælk (Flat White / Latte).'
        : 'Still enjoyable coffee. Top floral notes are mellowing – grind 0.5-1 step finer. Excellent for milk drinks (Cortado / Latte).',
      isEstimatedFromBBD,
      rawMatchedSnippet: rawSnippet,
    };
  } else {
    return {
      date: iso,
      daysOffRoast: diffDays,
      status: 'stale',
      statusLabel: isDa ? '🔴 ADVARSEL • FOR GAMMEL' : '🔴 WARNING • TOO OLD',
      badgeBg: 'bg-rose-500/20',
      badgeBorder: 'border-rose-500',
      badgeText: 'text-rose-400',
      glowColor: 'shadow-[0_0_35px_rgba(239,68,68,0.55)]',
      baristaVerdict: isDa
        ? `Ristet for ${diffDays} dage siden (~${Math.round(diffDays / 30)} mdr.)`
        : `Roasted ${diffDays} days ago (~${Math.round(diffDays / 30)} mo.)`,
      recommendedAction: isEstimatedFromBBD
        ? isDa
          ? 'Best Før datoen indikerer at bønnerne er ristet for længe siden. Olieharskning og flad smag kan forventes.'
          : 'Best Before stamp suggests these beans were roasted a long time ago. Flattened aromas and oxidized oils expected.'
        : isDa
        ? 'Over 2 måneder fra ristning. Kaffeolierne er oxideret, cremaen bliver tynd og smagen flad. Undgå til ren espresso.'
        : 'Over 2 months off roast. Delicate coffee oils have oxidized, leaving thin crema and muted flavors.',
      isEstimatedFromBBD,
      rawMatchedSnippet: rawSnippet,
    };
  }
}

export const FreshnessRadarModal: React.FC<FreshnessRadarModalProps> = ({
  isOpen,
  onClose,
  onSaveToVault,
  onOpenFullBagScanner,
}) => {
  const { t, language } = useTranslation();
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [verdict, setVerdict] = useState<FreshnessVerdict | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [autoResetCountdown, setAutoResetCountdown] = useState<number>(0);
  const [scanFeedbackMsg, setScanFeedbackMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verdictLockRef = useRef<boolean>(false);
  const lastPassiveOcrRef = useRef<number>(0);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (loopTimeoutRef.current) {
      clearTimeout(loopTimeoutRef.current);
      loopTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  }, []);

  // Toggle hardware flashlight/torch
  const handleToggleTorch = useCallback(async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
      if (capabilities.torch) {
        const nextState = !isTorchOn;
        await (track as MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setIsTorchOn(nextState);
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
          // ignore
        }
      } else {
        setTorchSupported(false);
      }
    } catch (err) {
      console.debug('Torch error', err);
    }
  }, [isTorchOn]);

  // Reset verdict and re-arm continuous scanner
  const handleResetForNextScan = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setVerdict(null);
    verdictLockRef.current = false;
    setAutoResetCountdown(0);
    setScanFeedbackMsg(null);
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // ignore
    }
  }, []);

  // Apply discovered date stamp and evaluate barista verdict
  const handleDateRecognized = useCallback(
    (rawDate: string, isEstimated: boolean, snippet?: string) => {
      const iso = normalizeDateStringToISO(rawDate);
      if (!iso) return;
      verdictLockRef.current = true;
      const newVerdict = evaluateDateFreshness(iso, isEstimated, snippet, language);
      setVerdict(newVerdict);
      setScanFeedbackMsg(null);
      playRadarAudio(newVerdict.status);
      triggerRadarHaptic(newVerdict.status);

      // Start 4-second auto-reset timer
      setAutoResetCountdown(4);
      countdownIntervalRef.current = setInterval(() => {
        setAutoResetCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            countdownIntervalRef.current = null;
            verdictLockRef.current = false;
            setVerdict(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [language]
  );

  // Execute optical scan from live video frame or uploaded file
  const executeRadarOcr = useCallback(
    async (fileSource?: File | Blob) => {
      if (verdictLockRef.current || isAnalyzing) return;
      setIsAnalyzing(true);
      setScanFeedbackMsg(t('radar.reading_date') || 'Læser datostempel...');

      try {
        let extractedDate: string | null = null;
        let isBBD = false;
        let snippetText: string | undefined = undefined;

        if (fileSource) {
          const { scanCoffeeBagForDateAndRoast } = await import('../lib/bagOcr');
          const res = await scanCoffeeBagForDateAndRoast(fileSource);
          if (res.roastDate) {
            extractedDate = res.roastDate;
            isBBD = res.isEstimatedFromBBD;
            snippetText = res.rawMatchedSnippet || res.formatDescription || undefined;
          } else {
            // Tier 4 Cloud AI fallback for uploaded photo
            try {
              const { compressFileToBagFrame } = await import('../lib/bagVisionClient');
              const { scanBagWithVisionAI } = await import('../lib/geminiBagVision');
              const frame = await compressFileToBagFrame(fileSource, 1280);
              if (frame?.base64) {
                const aiRes = await scanBagWithVisionAI(frame.base64, frame.thumbnailBase64);
                if (aiRes.success && aiRes.data?.roastDate) {
                  extractedDate = aiRes.data.roastDate;
                  isBBD = false;
                  snippetText = aiRes.data.detectedFormat || 'Beandex Bag Vision™ (AI)';
                }
              }
            } catch (aiErr) {
              console.debug('Radar file Vision AI fallback skipped', aiErr);
            }
          }
        } else {
          if (!videoRef.current || videoRef.current.videoWidth === 0) {
            setIsAnalyzing(false);
            setScanFeedbackMsg(null);
            return;
          }

          // Pass 1: Expanded reticle crop (accommodates tall phone viewports & wide bags)
          const crop = {
            x: 0.08,
            y: 0.16,
            width: 0.84,
            height: 0.68,
          };

          const canvas = preprocessImageForOcr(videoRef.current, crop, false);

          // Tier 1: Try Native TextDetector on reticle crop
          if (typeof window !== 'undefined' && 'TextDetector' in window) {
            try {
              const TextDetectorClass = (
                window as unknown as {
                  TextDetector: new () => { detect: (s: unknown) => Promise<Array<{ rawValue: string }>> };
                }
              ).TextDetector;
              const detector = new TextDetectorClass();
              const detected = await detector.detect(canvas);
              if (detected && detected.length > 0) {
                const rawText = detected.map((d: { rawValue: string }) => d.rawValue).join('\n');
                const parsed = extractDatesAndRoastFromBagText(rawText);
                if (parsed.roastDate) {
                  extractedDate = parsed.roastDate;
                  isBBD = parsed.isEstimatedFromBBD;
                  snippetText = parsed.rawMatchedSnippet || parsed.formatDescription || undefined;
                }
              }
            } catch (e) {
              console.debug('Radar TextDetector failed, fallback to OCR', e);
            }
          }

          // Tier 2: Tesseract OCR (with dot-matrix closing) on reticle crop
          if (!extractedDate) {
            const { scanCoffeeBagForDateAndRoast } = await import('../lib/bagOcr');
            const res = await scanCoffeeBagForDateAndRoast(canvas);
            if (res.roastDate) {
              extractedDate = res.roastDate;
              isBBD = res.isEstimatedFromBBD;
              snippetText = res.rawMatchedSnippet || res.formatDescription || undefined;
            }
          }

          // Tier 3: Full-frame Tesseract Fallback (Crucial if aspect-ratio cropped out the date stamp)
          if (!extractedDate && videoRef.current) {
            const { scanCoffeeBagForDateAndRoast } = await import('../lib/bagOcr');
            const resFull = await scanCoffeeBagForDateAndRoast(videoRef.current);
            if (resFull.roastDate) {
              extractedDate = resFull.roastDate;
              isBBD = resFull.isEstimatedFromBBD;
              snippetText = resFull.rawMatchedSnippet || resFull.formatDescription || undefined;
            }
          }

          // Tier 4: Gemini Bag Vision AI Fallback (Cloud intelligence failover for glossy foil / tricky dot-matrix)
          if (!extractedDate && videoRef.current) {
            try {
              const { captureBagFrameFromVideo } = await import('../lib/bagVisionClient');
              const { scanBagWithVisionAI } = await import('../lib/geminiBagVision');
              const frame = captureBagFrameFromVideo(videoRef.current, 1280);
              if (frame?.base64) {
                const aiRes = await scanBagWithVisionAI(frame.base64, frame.thumbnailBase64);
                if (aiRes.success && aiRes.data?.roastDate) {
                  extractedDate = aiRes.data.roastDate;
                  isBBD = false;
                  snippetText = aiRes.data.detectedFormat || 'Beandex Bag Vision™ (AI)';
                }
              }
            } catch (aiErr) {
              console.debug('Radar Vision AI fallback skipped', aiErr);
            }
          }
        }

        if (extractedDate) {
          handleDateRecognized(extractedDate, isBBD, snippetText);
        } else {
          setScanFeedbackMsg(t('bean.date_not_found') || 'Ingen dato fundet. Hold kameraet tæt på datostemplet.');
          setTimeout(() => setScanFeedbackMsg(null), 3000);
        }
      } catch (err) {
        console.warn('Radar scan error', err);
        setScanFeedbackMsg('Scanning fejlede. Prøv igen med bedre belysning.');
        setTimeout(() => setScanFeedbackMsg(null), 3000);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isAnalyzing, t, handleDateRecognized]
  );

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await executeRadarOcr(file);
    if (e.target) e.target.value = '';
  };

  // Passive optical analysis loop
  const runRadarScanCycle = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || verdictLockRef.current) {
      loopTimeoutRef.current = setTimeout(runRadarScanCycle, 350);
      return;
    }

    if (videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA && !isAnalyzing) {
      // 1. Fast Path: Native Browser Shape Detection TextDetector
      if (typeof window !== 'undefined' && 'TextDetector' in window) {
        try {
          const crop = { x: 0.08, y: 0.16, width: 0.84, height: 0.68 };
          const canvas = preprocessImageForOcr(videoRef.current, crop, false);
          const TextDetectorClass = (
            window as unknown as {
              TextDetector: new () => { detect: (s: unknown) => Promise<Array<{ rawValue: string }>> };
            }
          ).TextDetector;
          const detector = new TextDetectorClass();
          const detected = await detector.detect(canvas);
          if (detected && detected.length > 0) {
            const rawText = detected.map((d: { rawValue: string }) => d.rawValue).join('\n');
            const parsed = extractDatesAndRoastFromBagText(rawText);
            if (parsed.roastDate) {
              handleDateRecognized(
                parsed.roastDate,
                parsed.isEstimatedFromBBD,
                parsed.rawMatchedSnippet || parsed.formatDescription || undefined
              );
              return;
            }
          }
        } catch (e) {
          console.debug('Radar fast path skipped', e);
        }
      } else {
        // 2. Periodic passive Tesseract OCR check every 2.5 seconds if phone is steady
        const now = Date.now();
        if (now - lastPassiveOcrRef.current > 2500) {
          lastPassiveOcrRef.current = now;
          executeRadarOcr();
        }
      }
    }

    loopTimeoutRef.current = setTimeout(runRadarScanCycle, 400);
  }, [isCameraActive, isAnalyzing, handleDateRecognized, executeRadarOcr]);

  // Start video stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      mediaStreamRef.current = stream;

      // Check torch capability
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities?.() || {}) as { torch?: boolean };
        setTorchSupported(!!capabilities.torch);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Radar camera error', err);
      setCameraError('Camera access unavailable. Check permissions.');
      setIsCameraActive(false);
    }
  }, []);

  // Initialization & cleanup lifecycle
  useEffect(() => {
    if (isOpen) {
      verdictLockRef.current = false;
      setVerdict(null);
      setAutoResetCountdown(0);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  useEffect(() => {
    if (isOpen && isCameraActive) {
      loopTimeoutRef.current = setTimeout(runRadarScanCycle, 300);
    }
    return () => {
      if (loopTimeoutRef.current) {
        clearTimeout(loopTimeoutRef.current);
        loopTimeoutRef.current = null;
      }
    };
  }, [isOpen, isCameraActive, runRadarScanCycle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1A1412] text-[#FFFDF9] select-none font-sans overflow-hidden">
      {/* Top Cockpit Header */}
      <header className="relative z-10 px-4 py-3 bg-[#1A1412]/90 backdrop-blur-md border-b border-[#2C2018] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#C26D52] to-[#8C3D26] flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-[#FFFDF9] flex items-center gap-1.5 font-mono">
              <span>{t('radar.title')}</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#C26D52]/20 text-[#E58367] border border-[#C26D52]/30 font-sans">
                ZERO-TAP
              </span>
            </h2>
            <p className="text-[10px] text-[#A6998E]">
              {t('radar.subtitle')}
            </p>
          </div>
        </div>

        {/* Torch & Close Action buttons */}
        <div className="flex items-center gap-2">
          {torchSupported && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
                isTorchOn
                  ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                  : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/15'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isTorchOn ? 'fill-stone-950' : ''}`} />
              <span className="text-[11px]">{isTorchOn ? t('radar.torch_off') : t('radar.torch_on')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Viewfinder Canvas */}
      <main className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* Scanning Reticle Overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div
              onClick={() => !verdict && executeRadarOcr()}
              className={`relative w-72 h-36 border-2 rounded-2xl transition-all duration-300 flex items-center justify-center pointer-events-auto cursor-pointer ${
                verdict
                  ? `${verdict.badgeBorder} ${verdict.badgeBg} ${verdict.glowColor}`
                  : 'border-[#C26D52]/80 bg-[#C26D52]/5 shadow-[0_0_20px_rgba(194,109,82,0.3)] active:scale-98'
              }`}
            >
              {/* Corner brackets */}
              <div
                className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-xl ${
                  verdict ? verdict.badgeBorder : 'border-[#FFFDF9]'
                }`}
              />
              <div
                className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 rounded-tr-xl ${
                  verdict ? verdict.badgeBorder : 'border-[#FFFDF9]'
                }`}
              />
              <div
                className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 rounded-bl-xl ${
                  verdict ? verdict.badgeBorder : 'border-[#FFFDF9]'
                }`}
              />
              <div
                className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-xl ${
                  verdict ? verdict.badgeBorder : 'border-[#FFFDF9]'
                }`}
              />

              {/* Sweeping laser scanner line when active */}
              {!verdict && (
                <div className="absolute inset-x-0 h-0.5 bg-linear-to-r from-transparent via-[#E58367] to-transparent shadow-[0_0_8px_#C26D52] animate-pulse" />
              )}

              {/* Center status badge */}
              <div className="absolute -top-7 text-[10px] font-mono tracking-wide px-3 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-white/10 text-white/90 flex items-center gap-1.5 shadow-md">
                {verdict ? (
                  <span className={`font-bold ${verdict.badgeText}`}>{verdict.statusLabel}</span>
                ) : isAnalyzing ? (
                  <span className="flex items-center gap-1 text-[#E58367]">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>{t('radar.reading_date')}</span>
                  </span>
                ) : (
                  <span>{t('radar.ready_standby')}</span>
                )}
              </div>

              {/* Reticle instruction pill */}
              <span className="absolute -bottom-7 text-[10.5px] font-sans text-white/90 bg-black/85 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-sm text-center">
                {t('radar.aim_hint')}
              </span>
            </div>
          </div>
        )}

        {/* Floating Scan Action Bar */}
        {isCameraActive && !verdict && (
          <div className="absolute inset-x-4 bottom-5 z-20 flex flex-col items-center gap-2.5">
            {scanFeedbackMsg && (
              <div className="px-3.5 py-1.5 rounded-full bg-black/90 backdrop-blur-md border border-[#C26D52]/50 text-[#E58367] text-[11px] font-mono shadow-lg animate-fadeIn flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-[#C26D52]" />
                <span>{scanFeedbackMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={() => executeRadarOcr()}
                disabled={isAnalyzing}
                className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-[#C26D52] to-[#A95840] hover:from-[#A95840] hover:to-[#8C3D26] active:scale-95 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition border border-white/10"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>{t('radar.reading_date')}</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span>{t('radar.scan_now_btn') || '⚡ Scan Dato Nu'}</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                title="Tag foto / vælg fra galleri"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white/90 shadow-md transition cursor-pointer"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Camera inactive fallback */}
        {!isCameraActive && (
          <div className="text-center p-6 space-y-3">
            <Camera className="w-10 h-10 text-white/30 mx-auto" />
            <p className="text-xs text-white/70 max-w-xs mx-auto">
              {cameraError || 'Kameraet initialiseres...'}
            </p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 rounded-xl bg-[#C26D52] text-white text-xs font-semibold shadow hover:bg-[#A95840] transition"
            >
              Start Radar Kamera
            </button>
          </div>
        )}

        {/* Verdict HUD Card (Slides up over bottom) */}
        {verdict && (
          <div className="absolute inset-x-3 bottom-3 z-30 p-4 rounded-2xl bg-[#1F1714]/95 backdrop-blur-xl border border-white/15 shadow-2xl space-y-3 animate-fadeIn">
            {/* Auto-reset progress bar */}
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C26D52] transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(autoResetCountdown / 4) * 100}%` }}
              />
            </div>

            {/* Verdict Header & Traffic Light Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono tracking-tight uppercase ${verdict.badgeBg} ${verdict.badgeBorder} ${verdict.badgeText}`}
                >
                  <span>{verdict.statusLabel}</span>
                </div>
                <div className="text-base font-extrabold text-[#FFFDF9] font-mono">
                  {verdict.baristaVerdict}
                </div>
                <div className="text-xs text-[#A6998E] flex items-center gap-1.5 font-mono">
                  <span>Dato: {verdict.date}</span>
                  {verdict.isEstimatedFromBBD && (
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                      BBD Estimat
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetForNextScan}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#E58367]" />
                <span>{t('radar.scan_next')}</span>
              </button>
            </div>

            {/* Barista Recommendation Advice */}
            <p className="text-xs text-[#DDD2C7] leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
              {verdict.recommendedAction}
            </p>

            {/* Quick Actions Footer */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onSaveToVault) {
                    onSaveToVault(verdict.date, verdict.isEstimatedFromBBD);
                  }
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-[#C26D52] hover:bg-[#A95840] active:scale-98 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('radar.save_to_beandex')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenFullBagScanner) {
                    onOpenFullBagScanner();
                  }
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 border border-white/15 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#E58367]" />
                <span>{t('radar.open_full_scanner')}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation Bar */}
      <footer className="px-4 py-2.5 bg-[#1A1412] border-t border-[#2C2018] flex items-center justify-between text-xs text-[#A6998E]">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#C26D52]" />
          <span>Flowbean Specialty Freshness Engine</span>
        </span>
        <button
          type="button"
          onClick={handleResetForNextScan}
          className="text-white/80 hover:text-white font-mono text-[11px] underline"
        >
          {autoResetCountdown > 0
            ? t('radar.auto_reset_in').replace('{s}', autoResetCountdown.toString())
            : 'Tryk for ny scanning'}
        </button>
      </footer>
    </div>
  );
};
