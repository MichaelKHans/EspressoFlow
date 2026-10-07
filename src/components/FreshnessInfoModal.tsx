import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Wind,
  Sparkles,
  Clock,
  PackageOpen,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import type { RoastLevel } from '../types/espresso';

interface FreshnessInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoastLevel?: RoastLevel;
}

export const FreshnessInfoModal: React.FC<FreshnessInfoModalProps> = ({
  isOpen,
  onClose,
  activeRoastLevel = 'medium',
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fadeIn overflow-hidden"
      style={{
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
      }}
    >
      <div className="bg-[#FFFDF9] border border-[#DECFC0] rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[calc(100dvh-3rem)] font-sans animate-modal-pop-in">
        {/* Ambient Top Glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#C26D52]/15 blur-2xl pointer-events-none" />

        {/* Modal Header - STICKY */}
        <div className="flex items-center justify-between border-b border-[#E8DFD5] p-4 sm:p-5 bg-[#FAF7F2] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shrink-0 shadow-xs">
              <Info className="w-4 h-4 text-[#C26D52]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-serif text-[#2C2018]">
                {t('freshness.modal_title')}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-[#7A6E65] font-mono">
                {t('freshness.modal_subtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#DECFC0] flex items-center justify-center text-[#7A6E65] hover:text-[#2C2018] hover:bg-[#FAF7F2] transition shrink-0 cursor-pointer shadow-xs active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 sm:space-y-4 overscroll-contain">
          {/* Timeline Stage 1: Degassing */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-amber-300/60 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                  <Wind className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <span className="text-xs font-bold font-mono text-amber-900">
                  {t('freshness.phase1_title')}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                {activeRoastLevel === 'light' ? 'Rest 7–10 days' : 'Rest 4–7 days'}
              </span>
            </div>
            <p className="text-[11px] text-[#7A6E65] leading-relaxed">
              {t('freshness.phase1_desc')}
            </p>
          </div>

          {/* Timeline Stage 2: Golden Peak Window */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#72806B]/10 border border-[#72806B]/40 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#72806B]/25 text-[#54624F] flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#54624F]" />
                </div>
                <span className="text-xs font-bold font-mono text-[#54624F]">
                  {t('freshness.phase2_title')}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#72806B]/20 text-[#54624F] border border-[#72806B]/40">
                Specialty Sweet Spot
              </span>
            </div>
            <p className="text-[11px] text-[#54624F] leading-relaxed">
              {t('freshness.phase2_desc')}
            </p>
          </div>

          {/* Timeline Stage 3: Mellowing Phase */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-stone-700" />
                </div>
                <span className="text-xs font-bold font-mono text-[#2C2018]">
                  {t('freshness.phase3_title')}
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#7A6E65]">
                Grind 0.5–1 Step Finer
              </span>
            </div>
            <p className="text-[11px] text-[#7A6E65] leading-relaxed">
              {t('freshness.phase3_desc')}
            </p>
          </div>

          {/* Bag Opened & Storage Tips */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#E8DFD5] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#C26D52]">
              <PackageOpen className="w-4 h-4 text-[#C26D52]" />
              <span>{t('freshness.opened_title')}</span>
            </div>
            <p className="text-[11px] text-[#7A6E65] leading-relaxed">
              {t('freshness.opened_desc')}
            </p>
          </div>
        </div>

        {/* Footer Close Button - STICKY */}
        <div className="p-3.5 sm:p-4 border-t border-[#E8DFD5] bg-[#FAF7F2] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#2C2018] hover:bg-[#3D2D22] text-[#FAF7F2] text-xs font-mono font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 text-[#72806B]" />
            <span>{t('freshness.done_btn')}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
