import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, X, Check, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from '../../i18n';
import {
  loadGearImageOverrides,
  saveGearImageOverride,
  removeGearImageOverride,
  type GearImageOverride,
} from '../../lib/storage';

interface AdminGearImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  gear: {
    id: string;
    name: string;
    brand?: string;
    category: string;
    subCategory?: string;
    image?: string;
  } | null;
  onSaved?: () => void;
}

export const AdminGearImageModal: React.FC<AdminGearImageModalProps> = ({
  isOpen,
  onClose,
  gear,
  onSaved,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [flaggedAsWrong, setFlaggedAsWrong] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [existingOverride, setExistingOverride] = useState<GearImageOverride | null>(null);

  useEffect(() => {
    if (!gear || !isOpen) {
      setPreviewUrl(null);
      setNotes('');
      setExistingOverride(null);
      return;
    }

    const overrides = loadGearImageOverrides();
    const key = gear.id.toLowerCase().trim();
    const nameKey = gear.name.toLowerCase().trim();
    const found = overrides[key] || overrides[nameKey];

    if (found) {
      setExistingOverride(found);
      setPreviewUrl(found.dataUrl);
      setNotes(found.notes || '');
      setFlaggedAsWrong(found.flaggedAsWrong ?? true);
    } else {
      setExistingOverride(null);
      setPreviewUrl(null);
      setNotes('');
      setFlaggedAsWrong(true);
    }
  }, [gear, isOpen]);

  if (!isOpen || !gear) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Draw to square 600x600 canvas with #FAF7F2 warm background padding
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FAF7F2';
          ctx.fillRect(0, 0, 600, 600);

          const maxDim = Math.max(img.width, img.height);
          const scale = (600 * 0.96) / maxDim;
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const drawX = (600 - drawW) / 2;
          const drawY = (600 - drawH) / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          const dataUrl = canvas.toDataURL('image/webp', 0.92);
          setPreviewUrl(dataUrl);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!gear || !previewUrl) return;

    saveGearImageOverride({
      gearKey: gear.id,
      gearName: gear.name,
      dataUrl: previewUrl,
      notes: notes.trim(),
      flaggedAsWrong,
      timestamp: Date.now(),
    });

    setSaveSuccess(true);
    if (onSaved) onSaved();

    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetToFactory = () => {
    if (!gear) return;
    removeGearImageOverride(gear.id);
    removeGearImageOverride(gear.name);
    setExistingOverride(null);
    setPreviewUrl(null);
    setNotes('');
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFDF9] border border-[#D0BDAA]/60 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#D0BDAA]/40 bg-[#FAF7F2]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#C26D52]/10 border border-[#C26D52]/30 flex items-center justify-center text-[#C26D52]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C2018] tracking-tight">
                Admin: Billede-Reference
              </h3>
              <p className="text-[10px] text-[#7A6E65] uppercase font-mono tracking-wider">
                {gear.brand || gear.category} • {gear.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#D0BDAA]/20 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Status Alert if flagged */}
          {existingOverride && (
            <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Aktiv reference override gemt for denne model.</span>
            </div>
          )}

          {/* Current vs Uploaded Image Preview */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-44 h-44 rounded-2xl bg-[#FAF7F2] border-2 border-dashed border-[#D0BDAA] p-2 flex items-center justify-center overflow-hidden group shadow-inner">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={gear.name}
                  className="w-full h-full object-contain"
                />
              ) : gear.image ? (
                <img
                  src={gear.image}
                  alt={gear.name}
                  className="w-full h-full object-contain opacity-75"
                />
              ) : (
                <div className="flex flex-col items-center text-[#A6998E]">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                  <span className="text-[10px]">Ingen foto valgt</span>
                </div>
              )}

              {/* Upload Trigger overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer"
              >
                <Camera className="w-6 h-6 mb-1 text-white" />
                <span>Skift billede</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center space-x-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-[#2C2018] text-white text-xs font-medium hover:bg-[#2C2018]/90 transition flex items-center space-x-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Vælg foto / Tag kamera</span>
              </button>

              {existingOverride && (
                <button
                  type="button"
                  onClick={handleResetToFactory}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 text-xs font-medium hover:bg-rose-100 transition flex items-center space-x-1"
                  title="Nulstil til fabrikantens standard packshot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Nulstil</span>
                </button>
              )}
            </div>
          </div>

          {/* Notes field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#2C2018] flex items-center justify-between">
              <span>Reference-noter til Anti</span>
              <span className="text-[10px] font-normal text-[#A6998E]">Valgfri</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="F.eks.: 'Skal være den sorte model med krom-næse' eller 'Dette er min egen maskine på bordet'..."
              rows={2}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#D0BDAA]/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#C26D52] text-[#2C2018] placeholder-[#A6998E] resize-none"
            />
          </div>

          {/* Flag as wrong checkbox */}
          <label className="flex items-center space-x-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#D0BDAA]/40 cursor-pointer">
            <input
              type="checkbox"
              checked={flaggedAsWrong}
              onChange={(e) => setFlaggedAsWrong(e.target.checked)}
              className="rounded border-[#D0BDAA] text-[#C26D52] focus:ring-[#C26D52] w-4 h-4 cursor-pointer"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-[#2C2018] leading-tight">
                Markér som forkert foto
              </p>
              <p className="text-[10px] text-[#7A6E65]">
                Gemmer som reference for at det originale fabriksbillede skal udskiftes.
              </p>
            </div>
          </label>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3 border-t border-[#D0BDAA]/40 bg-[#FAF7F2]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#D0BDAA]/20 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!previewUrl || isProcessing}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center space-x-1.5 shadow-sm ${
              saveSuccess
                ? 'bg-emerald-600'
                : !previewUrl || isProcessing
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-[#C26D52] hover:bg-[#C26D52]/90 cursor-pointer'
            }`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Gemt!</span>
              </>
            ) : (
              <span>Anvend Reference</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
