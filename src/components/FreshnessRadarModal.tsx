import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  RefreshCw,
  Plus,
  Camera,
  Layers,
} from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useTranslation } from '../i18n';
import { extractDatesAndRoastFromBagText } from '../lib/bagScanner';
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
  const roast = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const roastZero = new Date(roast);
  roastZero.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - roastZero.getTime()) / (1000 * 60 * 60 * 24));

  const isDa = lang === 'da';

  if (diffDays < 5) {
    return {
      date: dateStr,
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
      date: dateStr,
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
      date: dateStr,
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
      date: dateStr,
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const verdictLockRef = useRef<boolean>(false);

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
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // ignore
    }
  }, []);

  // Optical analysis cycle
  const runRadarScanCycle = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || verdictLockRef.current) {
      loopTimeoutRef.current = setTimeout(runRadarScanCycle, 350);
      return;
    }

    if (videoRef.current.readyState >= videoRef.current.HAVE_ENOUGH_DATA) {
      try {
        setIsAnalyzing(true);
        // Crop specifically to the center scanning reticle (faster OCR, zero distractions)
        // reticle: center 70% width, 32% height
        const crop = {
          x: 0.15,
          y: 0.34,
          width: 0.7,
          height: 0.32,
        };

        const canvas = preprocessImageForOcr(videoRef.current, crop, false);

        // 1. Fast Path: Native Browser Shape Detection TextDetector
        let detectedRawText = '';
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
              detectedRawText = detected.map((d: { rawValue: string }) => d.rawValue).join('\n');
            }
          } catch (e) {
            console.debug('Radar native TextDetector skipped', e);
          }
        }

        // 2. Parse text with date & BBD extractor
        if (detectedRawText.trim().length > 0) {
          const parsed = extractDatesAndRoastFromBagText(detectedRawText);
          if (parsed.roastDate) {
            verdictLockRef.current = true;
            const newVerdict = evaluateDateFreshness(
              parsed.roastDate,
              parsed.isEstimatedFromBBD,
              parsed.rawMatchedSnippet || parsed.formatDescription || undefined,
              language
            );
            setVerdict(newVerdict);
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
            setIsAnalyzing(false);
            return;
          }
        }
      } catch (err) {
        console.debug('Radar optical cycle error', err);
      } finally {
        setIsAnalyzing(false);
      }
    }

    loopTimeoutRef.current = setTimeout(runRadarScanCycle, 350);
  }, [isCameraActive, language]);

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
              className={`relative w-72 h-36 border-2 rounded-2xl transition-all duration-300 flex items-center justify-center ${
                verdict
                  ? `${verdict.badgeBorder} ${verdict.badgeBg} ${verdict.glowColor}`
                  : 'border-[#C26D52]/80 bg-[#C26D52]/5 shadow-[0_0_20px_rgba(194,109,82,0.3)]'
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
                    <span>Læser dato...</span>
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
