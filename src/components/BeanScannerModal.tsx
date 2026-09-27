import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Barcode,
  Calendar,
  Sparkles,
  X,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
  Info,
  Flame,
  Search,
  Star,
  Award,
} from 'lucide-react';
import type { CoffeeBeanProfile, RoastLevel, RatioStyle, GrinderProfile } from '../types/espresso';
import { useTranslation } from '../i18n';
import {
  lookupBarcode,
  parseCoffeeBagPhoto,
  detectBarcodeFromImageSource,
  isBarcodeDetectorSupported,
  KNOWN_BARCODE_DATABASE,
  type ScannedBeanInfo,
} from '../lib/bagScanner';
import { upsertGlobalBean } from '../lib/supabase';

interface BeanScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBean: (bean: CoffeeBeanProfile, makeActive?: boolean) => void;
  currentGrinderName: string;
  grinders?: GrinderProfile[];
}

type ScanMode = 'barcode' | 'label_date';

export const BeanScannerModal: React.FC<BeanScannerModalProps> = ({
  isOpen,
  onClose,
  onSaveBean,
  currentGrinderName,
  grinders = [],
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ScanMode>('barcode');
  const [selectedGrinderName, setSelectedGrinderName] = useState<string>(currentGrinderName);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<ScannedBeanInfo | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Dedicated Date Stamp OCR scanning state
  const [isDateOcrScanning, setIsDateOcrScanning] = useState<boolean>(false);
  const [dateScanNote, setDateScanNote] = useState<string | null>(null);
  const dateFileInputRef = useRef<HTMLInputElement | null>(null);

  // Editable fields when a scan is found
  const [editName, setEditName] = useState<string>('');
  const [editRoaster, setEditRoaster] = useState<string>('');
  const [editRoastDate, setEditRoastDate] = useState<string>('');
  const [editRoastLevel, setEditRoastLevel] = useState<RoastLevel>('medium');
  const [editDose, setEditDose] = useState<number>(18.0);
  const [editRatio, setEditRatio] = useState<RatioStyle>('standard');
  const [editTargetYield, setEditTargetYield] = useState<number>(36.0);
  const [editGrindSetting, setEditGrindSetting] = useState<string>('12');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const barcodeSupported = isBarcodeDetectorSupported();

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Populate form with scan result
  const applyScanResult = useCallback((info: ScannedBeanInfo) => {
    setScannedResult(info);
    setEditName(info.name);
    setEditRoaster(info.roaster || '');
    setEditRoastDate(info.roastDate);
    setEditRoastLevel(info.roastLevel);

    // Smart default grind & yield depending on roast level
    if (info.roastLevel === 'light') {
      setEditDose(18.5);
      setEditRatio('lungo');
      setEditTargetYield(44.0);
      setEditGrindSetting('9');
    } else if (info.roastLevel === 'dark') {
      setEditDose(17.5);
      setEditRatio('ristretto');
      setEditTargetYield(30.0);
      setEditGrindSetting('14');
    } else {
      setEditDose(18.0);
      setEditRatio('standard');
      setEditTargetYield(36.0);
      setEditGrindSetting('12');
    }
    setFeedbackMessage(`Found: ${info.name}`);
  }, []);

  // Continuous scanning loop for live video
  const scanLoop = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || scannedResult) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      if (mode === 'barcode') {
        const detected = await detectBarcodeFromImageSource(videoRef.current);
        if (detected) {
          setIsScanning(true);
          stopCamera();
          const info = await lookupBarcode(detected);
          setIsScanning(false);
          if (info) {
            applyScanResult(info);
            return;
          }
        }
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanLoop);
  }, [isCameraActive, mode, scannedResult, stopCamera, applyScanResult]);

  // Start live camera
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera stream could not start', err);
      setCameraError('Camera access unavailable. You can upload a photo or enter a barcode below.');
      setIsCameraActive(false);
    }
  }, []);

  // Toggle or start scanning loop
  useEffect(() => {
    if (isOpen && !scannedResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, scannedResult, startCamera, stopCamera]);

  useEffect(() => {
    if (isCameraActive && !scannedResult) {
      animFrameIdRef.current = requestAnimationFrame(scanLoop);
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }
    };
  }, [isCameraActive, scannedResult, scanLoop]);

  if (!isOpen) return null;

  // Handle barcode lookup
  const handleLookupManualBarcode = async (codeToSearch?: string) => {
    const code = codeToSearch || manualCode;
    if (!code.trim()) return;
    setIsScanning(true);
    setFeedbackMessage(null);
    try {
      const info = await lookupBarcode(code);
      if (info) {
        applyScanResult(info);
      } else {
        setFeedbackMessage(`No product found for barcode: ${code}. You can enter details manually.`);
      }
    } catch {
      setFeedbackMessage('Lookup failed. Please check network connection.');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Photo Snapshot / File Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setFeedbackMessage('Analyzing bag photo, typography & roast date...');
    try {
      const info = await parseCoffeeBagPhoto(file);
      applyScanResult(info);
    } catch (err) {
      console.error('Photo analysis error', err);
      setFeedbackMessage('Could not parse image. Please try another angle or enter details.');
    } finally {
      setIsScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  // Handle Dedicated Date Stamp Photo Capture & Optical OCR
  const handleDatePhotoCaptured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsDateOcrScanning(true);
    setFeedbackMessage('Scanning date stamp on bag with OCR...');
    try {
      const { scanCoffeeBagForDateAndRoast } = await import('../lib/bagOcr');
      const ocrResult = await scanCoffeeBagForDateAndRoast(file);

      if (ocrResult.roastDate) {
        setEditRoastDate(ocrResult.roastDate);
        if (ocrResult.formatDescription) {
          setDateScanNote(ocrResult.formatDescription);
        }
        if (ocrResult.detectedRoastLevel) {
          setEditRoastLevel(ocrResult.detectedRoastLevel);
        }
        setFeedbackMessage(
          ocrResult.isEstimatedFromBBD
            ? `Estimated roast date from Best Before: ${ocrResult.roastDate}`
            : `Production roast date confirmed: ${ocrResult.roastDate}`
        );
      } else {
        if (ocrResult.detectedRoastLevel) {
          setEditRoastLevel(ocrResult.detectedRoastLevel);
          setFeedbackMessage(`Roast level detected: ${ocrResult.detectedRoastLevel.toUpperCase()}. Please select the date manually below.`);
        } else {
          setFeedbackMessage(t('bean.date_not_found'));
        }
      }
    } catch (err) {
      console.warn('Date photo OCR error', err);
      setFeedbackMessage(t('bean.date_not_found'));
    } finally {
      setIsDateOcrScanning(false);
      if (e.target) e.target.value = '';
    }
  };

  // Calculate days off roast
  const getDaysOffRoast = (dateStr: string): number => {
    const roast = new Date(dateStr);
    if (isNaN(roast.getTime())) return 7;
    const diff = Date.now() - roast.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const daysOff = getDaysOffRoast(editRoastDate);

  // Save handler
  const handleConfirmSave = (makeActive: boolean = false) => {
    if (!editName.trim()) return;
    const newBean: CoffeeBeanProfile = {
      id: `bean_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: editName.trim(),
      roaster: editRoaster.trim() || undefined,
      roastDate: editRoastDate || new Date().toISOString().split('T')[0],
      roastLevel: editRoastLevel,
      doseGrams: editDose,
      ratioStyle: editRatio,
      targetYieldGrams: editTargetYield,
      grindSetting: editGrindSetting,
      grinderName: selectedGrinderName || currentGrinderName || 'Baratza Encore ESP',
      notes: scannedResult?.notes || 'Added via Mobile Vision & Barcode Scanner.',
      barcode: scannedResult?.barcode,
      purchaseCountry: scannedResult?.purchaseCountry || 'DK',
      suitableFor: scannedResult?.suitableFor,
      communityRating: scannedResult?.communityRating,
      communityVotes: scannedResult?.communityVotes,
      expertScore: scannedResult?.expertScore,
      expertSource: scannedResult?.expertSource,
    };

    // Fire-and-forget background cloud sync to Supabase (Zero UI latency)
    if (scannedResult?.barcode) {
      upsertGlobalBean({
        barcode: scannedResult.barcode,
        roaster: editRoaster.trim() || 'Specialty Roaster',
        name: editName.trim(),
        roast_level: editRoastLevel === 'medium-dark' ? 'dark' : editRoastLevel,
        purchase_country: scannedResult?.purchaseCountry || 'DK',
        expert_score: scannedResult?.expertScore,
        expert_source: scannedResult?.expertSource,
      }).catch((e) => console.debug('Background cloud bean sync skipped:', e));
    }

    onSaveBean(newBean, makeActive);
    onClose();
  };

  const handleResetScan = () => {
    setScannedResult(null);
    setFeedbackMessage(null);
    setManualCode('');
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF7F2] border border-[#E8DFD5] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#FFFDF9] border-b border-[#E8DFD5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C26D52]/10 border border-[#C26D52]/20 flex items-center justify-center text-[#C26D52]">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#2C2018] tracking-tight">Bean & Barcode Vision Scanner</h2>
                {barcodeSupported && (
                  <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#72806B]/20 text-[#72806B]">
                    Vision API
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7A6E65]">Scan coffee bag barcodes, packaging & roast date stamps</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#FAF7F2] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Mode Switcher */}
          {!scannedResult && (
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F0EAE1] rounded-xl border border-[#E8DFD5]">
              <button
                type="button"
                onClick={() => setMode('barcode')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  mode === 'barcode'
                    ? 'bg-white text-[#2C2018] shadow-sm font-bold'
                    : 'text-[#7A6E65] hover:text-[#2C2018]'
                }`}
              >
                <Barcode className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Barcode / EAN</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('label_date')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  mode === 'label_date'
                    ? 'bg-white text-[#2C2018] shadow-sm font-bold'
                    : 'text-[#7A6E65] hover:text-[#2C2018]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#72806B]" />
                <span>Label & Roast Date</span>
              </button>
            </div>
          )}

          {/* Camera Viewfinder (when not yet scanned) */}
          {!scannedResult && (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-[#2C2018]/20 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Reticle / Target Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {mode === 'barcode' ? (
                    <div className="relative w-48 h-28 border-2 border-dashed border-[#C26D52] rounded-lg shadow-lg flex items-center justify-center">
                      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#C26D52]" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#C26D52]" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#C26D52]" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#C26D52]" />
                      <div className="w-full h-0.5 bg-[#C26D52]/80 shadow-[0_0_8px_#C26D52] animate-pulse" />
                      <span className="absolute -bottom-6 text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded">
                        Aim at EAN / Barcode
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-56 h-36 border-2 border-[#72806B] rounded-lg shadow-lg flex items-center justify-center bg-[#72806B]/5">
                      <div className="w-full h-0.5 bg-[#72806B]/70 animate-bounce" />
                      <span className="absolute -bottom-6 text-[10px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded">
                        Aim at Roast Date Stamp
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Fallback / Error state */}
              {!isCameraActive && (
                <div className="text-center p-4 space-y-2">
                  <Camera className="w-8 h-8 text-white/40 mx-auto" />
                  <p className="text-xs text-white/80 max-w-xs mx-auto">
                    {cameraError || 'Camera inactive. Click to initialize camera viewfinder.'}
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-3 py-1.5 rounded-lg bg-[#C26D52] text-white text-xs font-semibold shadow hover:bg-[#A95840] transition"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {/* Processing Spinner Overlay */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#C26D52]" />
                  <span className="text-xs font-mono font-medium">Scanning & Parsing...</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Capture & Upload Controls (when camera active) */}
          {!scannedResult && (
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E8DFD5] text-[#2C2018] text-xs font-semibold hover:bg-[#FAF7F2] transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Camera className="w-4 h-4 text-[#72806B]" />
                <span>Snap or Upload Bag Photo</span>
              </button>
            </div>
          )}

          {/* Manual Barcode & Quick Preset Demos */}
          {!scannedResult && mode === 'barcode' && (
            <div className="p-3 rounded-xl bg-white border border-[#E8DFD5] space-y-2.5">
              <div className="text-[11px] font-bold text-[#7A6E65] uppercase flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#C26D52]" />
                <span>Or Search Barcode Manually (EAN-13 / UPC)</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupManualBarcode()}
                  placeholder="e.g. 8000070038806 or 5711953000012"
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#FAF7F2] border border-[#E8DFD5] rounded-lg focus:outline-none focus:border-[#C26D52]"
                />
                <button
                  type="button"
                  onClick={() => handleLookupManualBarcode()}
                  disabled={isScanning || !manualCode.trim()}
                  className="px-3 py-1.5 rounded-lg bg-[#C26D52] hover:bg-[#A95840] disabled:opacity-50 text-white text-xs font-semibold transition"
                >
                  Lookup
                </button>
              </div>

              {/* Fast Test Barcode Chips */}
              <div className="pt-1">
                <span className="text-[10px] text-[#7A6E65] block mb-1">Quick Demo Barcodes:</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(KNOWN_BARCODE_DATABASE)
                    .slice(0, 4)
                    .map(([code, item]) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setManualCode(code);
                          handleLookupManualBarcode(code);
                        }}
                        className="px-2 py-0.5 rounded bg-[#FAF7F2] hover:bg-[#E8DFD5] border border-[#E8DFD5] text-[10px] font-mono text-[#2C2018] transition flex items-center gap-1"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-[#C26D52]" />
                        <span>{item.roaster}: {item.name.split(' ')[0]}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Date Scanning Heuristics Info */}
          {!scannedResult && mode === 'label_date' && (
            <div className="p-3 rounded-xl bg-white border border-[#E8DFD5] space-y-2 text-xs text-[#7A6E65]">
              <div className="flex items-center gap-1.5 font-bold text-[#2C2018] uppercase text-[10px]">
                <Info className="w-3.5 h-3.5 text-[#72806B]" />
                <span>Multi-Format Date Recognition Engine</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Coffee roasters use diverse date stamps. Espresso Flow's optical parser decodes:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded bg-[#FAF7F2] border border-[#E8DFD5]">
                  <strong className="block text-[#2C2018] mb-0.5 font-sans">European / Scandinavian</strong>
                  14.09.2026 • 14/09/2026 • 2026-09-14
                </div>
                <div className="p-2 rounded bg-[#FAF7F2] border border-[#E8DFD5]">
                  <strong className="block text-[#2C2018] mb-0.5 font-sans">Specialty Month Stamps</strong>
                  14 SEP 2026 • 12 MAJ • 18 OKT
                </div>
              </div>
              <p className="text-[10px] text-[#A6998E]">
                💡 If a commercial bag only has "Best Before / Bedst Før", our engine calculates the estimated roast date (~12 months prior).
              </p>
            </div>
          )}

          {/* Feedback or Error Message */}
          {feedbackMessage && !scannedResult && (
            <div className="p-2.5 rounded-lg bg-[#C26D52]/10 border border-[#C26D52]/20 flex items-center gap-2 text-xs text-[#C26D52]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* SCANNED RESULT CARD (Editable preview before saving) */}
          {/* ======================================================== */}
          {scannedResult && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-[#72806B]/10 border border-[#72806B]/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#72806B] text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#2C2018]">Coffee Identified</h3>
                    <p className="text-[11px] text-[#72806B] font-mono">
                      {scannedResult.detectedFormat || 'Optical Vision Match'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetScan}
                  className="px-2.5 py-1 rounded-lg border border-[#7A6E65]/30 text-[11px] font-semibold text-[#7A6E65] hover:bg-white transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Rescan</span>
                </button>
              </div>

              {/* Community Cloud Rating & Drink Suitability Badges */}
              {/* Community Cloud Rating & Expert Score Badges */}
              {((scannedResult.communityRating !== undefined && scannedResult.communityRating > 0) || scannedResult.expertScore) && (
                <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#E8DFD5] shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {scannedResult.communityRating !== undefined && scannedResult.communityRating > 0 && (
                      <div className="flex items-center gap-1.5 text-[#2C2018]">
                        <Star className="w-4 h-4 fill-[#C26D52] text-[#C26D52]" />
                        <span className="font-bold text-sm">{scannedResult.communityRating.toFixed(1)}</span>
                        <span className="text-[10px] text-[#7A6E65]">
                          ({scannedResult.communityVotes || 1} barista votes)
                        </span>
                      </div>
                    )}
                    {scannedResult.expertScore && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 font-bold text-[10px]">
                        <Award className="w-3.5 h-3.5 text-amber-700" />
                        <span>{scannedResult.expertScore.toFixed(0)} PTS</span>
                        <span className="text-[9px] font-normal text-amber-800">({scannedResult.expertSource || 'Expert Review'})</span>
                      </div>
                    )}
                  </div>
                  {scannedResult.suitableFor && scannedResult.suitableFor.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {scannedResult.suitableFor.map((drink) => (
                        <span
                          key={drink}
                          className="text-[9px] px-2 py-0.5 rounded-full bg-[#C26D52]/10 text-[#C26D52] font-semibold uppercase tracking-wider"
                        >
                          {drink.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Form Fields */}
              <div className="p-4 rounded-xl bg-white border border-[#E8DFD5] space-y-3 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#7A6E65] uppercase block mb-1">
                      Bean Origin / Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Kenya Nyeri AA (Washed)"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-xs font-semibold text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#7A6E65] uppercase block mb-1">
                      Roaster / Brand
                    </label>
                    <input
                      type="text"
                      value={editRoaster}
                      onChange={(e) => setEditRoaster(e.target.value)}
                      placeholder="e.g. Coffee Collective or Lavazza"
                      className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-xs font-semibold text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
                    />
                  </div>
                </div>

                {/* Step 2: Capture Roast Date from Bag if not yet scanned */}
                {!editRoastDate ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2.5 animate-fadeIn">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-[#2C2018]">
                          {t('bean.step2_scan_date')}
                        </h4>
                        <p className="text-[11px] text-[#7A6E65] leading-relaxed mt-0.5">
                          {t('bean.barcode_no_date_desc')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        ref={dateFileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleDatePhotoCaptured}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => dateFileInputRef.current?.click()}
                        disabled={isDateOcrScanning}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#C26D52] hover:bg-[#A95840] disabled:opacity-50 text-white text-xs font-bold font-mono flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                      >
                        {isDateOcrScanning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{t('bean.scanning_date')}</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5" />
                            <span>{t('bean.snap_date_btn')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">{t('bean.date_found', { date: editRoastDate })}</span>
                        {dateScanNote && (
                          <span className="block text-[10px] text-emerald-700 font-mono mt-0.5">{dateScanNote}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => dateFileInputRef.current?.click()}
                      className="px-2.5 py-1 rounded bg-white/80 border border-emerald-500/30 text-[10px] text-emerald-800 font-mono hover:bg-white transition"
                    >
                      {t('bean.rescan_date')}
                    </button>
                  </div>
                )}

                {/* Roast Date & Roast Level Profile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-[#7A6E65] uppercase flex items-center justify-between mb-1">
                      <span>{t('bean.roast_date')}</span>
                      {scannedResult.isEstimatedFromBBD && (
                        <span className="text-[9px] text-[#C26D52] font-semibold">Estimated from BBD</span>
                      )}
                    </label>
                    <input
                      type="date"
                      value={editRoastDate}
                      onChange={(e) => {
                        setEditRoastDate(e.target.value);
                        setDateScanNote(null);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-xs font-mono font-semibold text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#7A6E65] uppercase block mb-1">
                      {t('bean.roast_level')}
                      <span className="ml-1 text-[9px] text-[#A6998E] font-normal lowercase">({t('bean.confirm_roast_level')})</span>
                    </label>
                    <select
                      value={editRoastLevel}
                      onChange={(e) => setEditRoastLevel(e.target.value as RoastLevel)}
                      className="w-full px-3 py-2 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] text-xs font-semibold text-[#2C2018] focus:outline-none focus:border-[#C26D52]"
                    >
                      <option value="light">Light Roast (Nordic / High Acidity / Blonde)</option>
                      <option value="medium">Medium Roast (Balanced Caramel & Fruit)</option>
                      <option value="medium-dark">Medium-Dark (Classic Chocolate & Hazelnut)</option>
                      <option value="dark">Dark Roast (Italian Bold / Espresso Crema)</option>
                    </select>
                  </div>
                </div>

                {/* Freshness & CO2 Degassing Banner */}
                {editRoastDate ? (
                  <div
                    className={`p-2.5 rounded-lg border flex items-center gap-2.5 text-xs ${
                      daysOff < 4
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-800'
                        : daysOff <= 28
                        ? 'bg-[#72806B]/10 border-[#72806B]/30 text-[#72806B]'
                        : 'bg-[#2C2018]/5 border-[#2C2018]/15 text-[#7A6E65]'
                    }`}
                  >
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 text-[11px] leading-tight">
                      <span className="font-bold">
                        {daysOff === 0 ? 'Roasted Today' : `${daysOff} days off roast`}:
                      </span>{' '}
                      {daysOff < 4 ? (
                        <span>Active CO₂ degassing. Rest 2–3 more days for calmer espresso flow.</span>
                      ) : daysOff <= 28 ? (
                        <span className="font-medium">Prime espresso extraction window. Optimum CO₂ release.</span>
                      ) : (
                        <span>Mature / Aged roast ({daysOff}d). May require a finer grind setting to maintain puck resistance.</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg border border-[#E8DFD5] bg-[#FAF7F2] flex items-center gap-2 text-xs text-[#7A6E65]">
                    <Info className="w-4 h-4 text-[#C26D52] shrink-0" />
                    <span className="text-[11px]">
                      Take a photo of the date stamp on the bag above to calculate exact days off roast and CO₂ degassing.
                    </span>
                  </div>
                )}

                {/* Pre-calibrated Ratio & Grinder Setting */}
                <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#2C2018]">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#C26D52]" />
                      <span>Calibrated Recipe Defaults</span>
                    </div>
                    {grinders && grinders.length > 1 ? (
                      <select
                        value={selectedGrinderName}
                        onChange={(e) => setSelectedGrinderName(e.target.value)}
                        className="text-[10px] font-mono text-[#2C2018] bg-white border border-[#E8DFD5] rounded px-1.5 py-0.5"
                      >
                        {grinders.map((g) => (
                          <option key={g.id} value={g.name}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-mono text-[#7A6E65]">
                        {selectedGrinderName || currentGrinderName}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="p-1.5 rounded bg-white border border-[#E8DFD5]">
                      <span className="text-[9px] text-[#7A6E65] uppercase block font-sans">Dose</span>
                      <input
                        type="number"
                        step="0.1"
                        value={editDose}
                        onChange={(e) => setEditDose(parseFloat(e.target.value) || 18)}
                        className="w-full text-center font-bold text-[#2C2018] bg-transparent"
                      />
                      <span className="text-[9px] text-[#A6998E]">grams</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-[#E8DFD5]">
                      <span className="text-[9px] text-[#7A6E65] uppercase block font-sans">Yield</span>
                      <input
                        type="number"
                        step="0.5"
                        value={editTargetYield}
                        onChange={(e) => setEditTargetYield(parseFloat(e.target.value) || 36)}
                        className="w-full text-center font-bold text-[#2C2018] bg-transparent"
                      />
                      <span className="text-[9px] text-[#A6998E]">grams</span>
                    </div>
                    <div className="p-1.5 rounded bg-white border border-[#E8DFD5]">
                      <span className="text-[9px] text-[#7A6E65] uppercase block font-sans">Grind</span>
                      <input
                        type="text"
                        value={editGrindSetting}
                        onChange={(e) => setEditGrindSetting(e.target.value)}
                        className="w-full text-center font-bold text-[#C26D52] bg-transparent"
                      />
                      <span className="text-[9px] text-[#A6998E]">setting</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmSave(true)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#C26D52] hover:bg-[#A95840] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save & Use As Active Bean</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmSave(false)}
                  className="py-2.5 px-4 rounded-xl bg-white border border-[#E8DFD5] text-[#2C2018] hover:bg-[#FAF7F2] text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-[#72806B]" />
                  <span>Save To Vault Only</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
