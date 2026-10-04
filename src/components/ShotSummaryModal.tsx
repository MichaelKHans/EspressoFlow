import React, { useState, useEffect } from 'react';
import type { ShotRecord, TasteRating } from '../types/espresso';
import { FlowChart } from './FlowChart';
import { generateDialInAdvice, type DialInAdvice } from '../lib/espressoMath';
import {
  CheckCircle,
  AlertCircle,
  X,
  BookOpen,
  RotateCcw,
  Sliders,
  Target,
  Sparkles,
  Flame,
} from 'lucide-react';
import { useTranslation } from '../i18n';

interface ShotSummaryModalProps {
  isOpen: boolean;
  shot: ShotRecord | null;
  onClose: () => void;
  onViewInLogbook: () => void;
  onUpdateShot: (updated: ShotRecord) => void;
}

export const ShotSummaryModal: React.FC<ShotSummaryModalProps> = ({
  isOpen,
  shot,
  onClose,
  onViewInLogbook,
  onUpdateShot,
}) => {
  const { t } = useTranslation();
  const [selectedTaste, setSelectedTaste] = useState<TasteRating>('balanced');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (shot) {
      setSelectedTaste(shot.tasteRating || 'balanced');
      setNotes(shot.notes || '');
    }
  }, [shot]);

  if (!isOpen || !shot) return null;

  const handleTasteChange = (rating: TasteRating) => {
    setSelectedTaste(rating);
    const updated: ShotRecord = {
      ...shot,
      tasteRating: rating,
      notes: notes.trim() || undefined,
    };
    onUpdateShot(updated);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    const updated: ShotRecord = {
      ...shot,
      tasteRating: selectedTaste,
      notes: newNotes.trim() || undefined,
    };
    onUpdateShot(updated);
  };

  const ratio =
    shot.doseGrams > 0
      ? (shot.actualYieldGrams / shot.doseGrams).toFixed(1)
      : '2.0';

  const dateStr = new Date(shot.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const advice: DialInAdvice = generateDialInAdvice(
    shot.totalTimeSeconds,
    shot.doseGrams,
    shot.actualYieldGrams,
    shot.channeling || shot.channelingDetected,
    selectedTaste,
    shot.preInfusionSeconds,
    shot.roastLevel,
    shot.grinderName,
    shot.grindSetting
  );

  const tasteOptions: { key: TasteRating; label: string; desc: string; activeColor: string }[] = [
    {
      key: 'balanced',
      label: t('taste.balanced_label'),
      desc: t('taste.balanced_desc'),
      activeColor: 'border-[#72806B] bg-[#72806B]/10 text-[#54624F]',
    },
    {
      key: 'sour',
      label: t('taste.sour_label'),
      desc: t('taste.sour_desc'),
      activeColor: 'border-amber-500 bg-amber-500/10 text-amber-800',
    },
    {
      key: 'bitter',
      label: t('taste.bitter_label'),
      desc: t('taste.bitter_desc'),
      activeColor: 'border-[#8C6046] bg-[#8C6046]/10 text-[#6A4733]',
    },
    {
      key: 'watery',
      label: t('taste.watery_label'),
      desc: t('taste.watery_desc'),
      activeColor: 'border-blue-400 bg-blue-50 text-blue-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#2C2018]/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div
        className="bg-[#FFFDF9] w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-[#DECFC0] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-mono animate-in fade-in slide-in-from-bottom duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] bg-gradient-to-r from-[#FAF7F2] via-[#FFFDF9] to-[#FAF7F2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#72806B]/15 text-[#72806B] flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2C2018]">
                  {t('shotsummary.title')}
                </h3>
                <span className="text-[10px] bg-[#2C2018] text-[#FAF7F2] px-1.5 py-0.5 rounded font-bold">
                  {dateStr}
                </span>
              </div>
              <p className="text-xs text-[#7A6E65]">
                {shot.drinkName || 'Double Espresso'} • {shot.coffeeName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#E8DFD5] text-[#7A6E65] transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Telemetry Instrument Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
              <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                {t('active_bean.yield')}
              </span>
              <div className="text-sm font-bold text-[#2C2018] mt-0.5">
                <span className="text-[#C26D52]">{shot.actualYieldGrams.toFixed(1)}g</span>
                <span className="text-[10px] text-[#7A6E65] font-normal ml-1">
                  (1:{ratio})
                </span>
              </div>
              <span className="text-[10px] text-[#7A6E65] mt-0.5 block">
                Dose: {shot.doseGrams}g
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
              <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                {t('logbook.time_and_flow')}
              </span>
              <div className="text-sm font-bold text-[#2C2018] mt-0.5">
                {shot.totalTimeSeconds.toFixed(1)}s
              </div>
              <span className="text-[10px] text-[#7A6E65] mt-0.5 block truncate">
                {shot.preInfusionSeconds !== undefined
                  ? `${shot.preInfusionSeconds}s + ${shot.flowTimeSeconds || (shot.totalTimeSeconds - shot.preInfusionSeconds).toFixed(1)}s`
                  : `${shot.averageFlowGps.toFixed(2)} g/s`}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
              <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                {t('logbook.equipment')}
              </span>
              <div className="text-xs font-bold text-[#2C2018] mt-0.5 truncate">
                {shot.grinderName.split(' ')[0]} @{' '}
                <strong className="text-[#C26D52]">{shot.grindSetting}</strong>
              </div>
              <span className="text-[10px] text-[#7A6E65] mt-0.5 block truncate">
                {shot.machineName ? shot.machineName.split(' ')[0] : 'Machine'}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
              <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                {t('logbook.taste_flow')}
              </span>
              <div className="mt-0.5">
                {shot.channelingDetected ? (
                  <span className="text-red-700 font-bold text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Channeling
                  </span>
                ) : (
                  <span className="text-[#72806B] font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    {t('shotsummary.smooth_flow')}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#7A6E65] mt-0.5 block">
                Ø {shot.averageFlowGps.toFixed(2)} g/s
              </span>
            </div>
          </div>

          {/* Full Extraction Flow Curve */}
          {shot.dataPoints && shot.dataPoints.length > 0 && (
            <div className="rounded-2xl border border-[#E8DFD5] overflow-hidden">
              <FlowChart
                points={shot.dataPoints}
                targetYield={shot.targetYieldGrams || shot.actualYieldGrams}
                doseGrams={shot.doseGrams}
                channelingEvent={shot.channeling}
                preInfusionSeconds={shot.preInfusionSeconds}
                isLive={false}
              />
            </div>
          )}

          {/* 1-Tap Taste Rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2C2018] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C26D52]" />
                {t('shotsummary.rate_taste')}
              </span>
              <span className="text-[10px] text-[#72806B] font-semibold">
                ✓ {t('shotsummary.saved_notice')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tasteOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleTasteChange(opt.key)}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    selectedTaste === opt.key
                      ? `${opt.activeColor} ring-1 font-bold shadow-xs`
                      : 'border-[#E8DFD5] bg-white text-[#7A6E65] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <div className="text-xs font-mono">{opt.label}</div>
                  <div className="text-[9px] mt-0.5 opacity-80 leading-snug">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Barista Dial-In Guidance & Physics Advice */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-[#C26D52]" />
                <span className="text-xs font-bold text-[#2C2018]">{advice.summary}</span>
              </div>
              {shot.channelingDetected && (
                <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Spike
                </span>
              )}
            </div>

            <p className="text-xs text-[#2C2018] leading-relaxed">{advice.rationale}</p>

            {advice.grinderSpecificAdvice && (
              <div className="text-xs text-[#2C2018] bg-white p-2.5 rounded-xl border border-[#C26D52]/40 shadow-xs flex items-start gap-2">
                <Target className="w-4 h-4 text-[#C26D52] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#C26D52] uppercase text-[10px] tracking-wider block mb-0.5">
                    {t('shotsummary.grinder_adjustment')}
                  </strong>
                  <span>{advice.grinderSpecificAdvice}</span>
                </div>
              </div>
            )}

            {advice.roastAdvice && (
              <div className="text-[11px] text-[#7A6E65] bg-white p-2 rounded-xl border border-[#E8DFD5] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#C26D52] shrink-0" />
                <span>{advice.roastAdvice}</span>
              </div>
            )}
          </div>

          {/* Tasting Notes Input */}
          <div>
            <input
              type="text"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={t('shotsummary.notes_placeholder')}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8DFD5] bg-white text-[#2C2018] placeholder-[#7A6E65]/50 focus:outline-none focus:ring-1 focus:ring-[#C26D52] font-mono"
            />
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-3.5 sm:p-4 bg-[#FAF7F2] border-t border-[#E8DFD5] flex items-center gap-2.5">
          <button
            type="button"
            onClick={onViewInLogbook}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2C2018] hover:bg-[#3D2C22] text-[#FAF7F2] font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-[#C26D52]" />
            <span>{t('shotsummary.view_in_logbook')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-[#E8DFD5] bg-white hover:bg-[#FAF7F2] text-[#2C2018] font-bold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7A6E65]" />
            <span>{t('shotsummary.pull_new_shot')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
