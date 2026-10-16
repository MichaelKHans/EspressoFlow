import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Check,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Archive,
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import type { CoffeeBeanProfile, RepurchaseVerdict } from '../types/espresso';
import { useTranslation } from '../i18n';

interface FinishBeanModalProps {
  isOpen: boolean;
  onClose: () => void;
  bean: CoffeeBeanProfile | null;
  onConfirmFinish: (
    beanId: string,
    details: {
      rating: number;
      repurchaseVerdict: RepurchaseVerdict;
      finishNotes?: string;
      dateFinished: string;
    }
  ) => void;
}

export const FinishBeanModal: React.FC<FinishBeanModalProps> = ({
  isOpen,
  onClose,
  bean,
  onConfirmFinish,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number>(5);
  const [verdict, setVerdict] = useState<RepurchaseVerdict>('buy_again');
  const [finishNotes, setFinishNotes] = useState<string>('');

  useEffect(() => {
    if (bean) {
      setRating(bean.rating || 5);
      setVerdict(bean.repurchaseVerdict || 'buy_again');
      setFinishNotes(bean.finishNotes || '');
    }
  }, [bean]);

  if (!isOpen || !bean) return null;

  // Calculate days to finish if dateOpened is available
  const getDaysToFinish = (): number | null => {
    if (!bean.dateOpened) return null;
    const opened = new Date(bean.dateOpened);
    const today = new Date();
    opened.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = today.getTime() - opened.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const daysTaken = getDaysToFinish();

  const handleSelectVerdict = (v: RepurchaseVerdict) => {
    setVerdict(v);
    try {
      Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // ignore
    }
  };

  const handleConfirm = () => {
    const todayISO = new Date().toISOString().split('T')[0];
    try {
      Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      // ignore
    }
    onConfirmFinish(bean.id, {
      rating,
      repurchaseVerdict: verdict,
      finishNotes: finishNotes.trim() || undefined,
      dateFinished: todayISO,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-[#FFFDF9] rounded-3xl border border-[#E8DFD5] shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-linear-to-r from-[#2C2018] to-[#1C1410] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C26D52] flex items-center justify-center text-white shadow-md">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-[#FFFDF9] font-mono">
                {t('beandex.mark_finished_confirm_title')}
              </h2>
              <p className="text-[10.5px] text-[#C2B5A8]">
                {bean.roaster ? `${bean.roaster} • ` : ''}{bean.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white/80 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Summary Pill: Consumption Timeline & Dial-In Record */}
          <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] flex items-center justify-between gap-3 text-xs font-mono">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#7A6E65] uppercase block font-sans">
                {t('beandex.calibrated_gear')}
              </span>
              <span className="font-bold text-[#2C2018]">
                {bean.grinderName}: {bean.grindSetting}
              </span>
            </div>
            {daysTaken !== null && (
              <div className="text-right space-y-0.5">
                <span className="text-[10px] text-[#7A6E65] uppercase block font-sans">
                  {t('beandex.consumption_time')}
                </span>
                <span className="font-bold text-[#C26D52]">
                  {daysTaken} {t('beandex.finish_days_taken', { days: daysTaken }).split(' ').pop()}
                </span>
              </div>
            )}
          </div>

          {/* 1. Final Star Rating */}
          <div className="space-y-1.5 text-center py-1">
            <span className="text-xs font-bold text-[#2C2018] uppercase tracking-wide block">
              {t('beandex.personal_rating')}
            </span>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setRating(star);
                    try {
                      Haptics.impact({ style: ImpactStyle.Light });
                    } catch {
                      // ignore
                    }
                  }}
                  className="p-1 hover:scale-115 active:scale-95 transition cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 transition ${
                      star <= rating
                        ? 'fill-[#C26D52] text-[#C26D52] drop-shadow-xs'
                        : 'text-[#DECFC0] hover:text-[#C26D52]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 2. Repurchase Verdict Question */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#2C2018] uppercase tracking-wide block">
              {t('beandex.repurchase_question')}
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Buy Again */}
              <button
                type="button"
                onClick={() => handleSelectVerdict('buy_again')}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  verdict === 'buy_again'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/30 shadow-xs'
                    : 'border-[#E8DFD5] bg-white text-[#7A6E65] hover:bg-[#FAF7F2]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    verdict === 'buy_again' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] leading-tight">
                  {t('beandex.repurchase_buy_again')}
                </span>
              </button>

              {/* Neutral / Maybe */}
              <button
                type="button"
                onClick={() => handleSelectVerdict('neutral')}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  verdict === 'neutral'
                    ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold ring-2 ring-amber-500/30 shadow-xs'
                    : 'border-[#E8DFD5] bg-white text-[#7A6E65] hover:bg-[#FAF7F2]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    verdict === 'neutral' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] leading-tight">
                  {t('beandex.repurchase_neutral')}
                </span>
              </button>

              {/* Never Again */}
              <button
                type="button"
                onClick={() => handleSelectVerdict('never_again')}
                className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                  verdict === 'never_again'
                    ? 'border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-500/30 shadow-xs'
                    : 'border-[#E8DFD5] bg-white text-[#7A6E65] hover:bg-[#FAF7F2]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    verdict === 'never_again' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] leading-tight">
                  {t('beandex.repurchase_never_again')}
                </span>
              </button>
            </div>
          </div>

          {/* 3. Final Tasting Notes Textarea */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#7A6E65] uppercase tracking-wide block">
              Slutvurdering & Smagsnoter
            </label>
            <textarea
              rows={2}
              value={finishNotes}
              onChange={(e) => setFinishNotes(e.target.value)}
              placeholder={t('beandex.finish_note_placeholder')}
              className="w-full px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DFD5] rounded-xl focus:outline-none focus:border-[#C26D52] font-sans text-[#2C2018] resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="px-5 py-3.5 bg-[#FAF7F2] border-t border-[#E8DFD5] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#DECFC0] bg-white text-xs font-semibold text-[#7A6E65] hover:bg-[#FAF7F2] transition cursor-pointer"
          >
            Annuller
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-xl bg-[#C26D52] hover:bg-[#A95840] active:scale-98 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{t('beandex.finish_archive_btn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
