import React, { useState, useEffect } from 'react';
import type { ShotRecord, TasteRating, TempUnit } from '../types/espresso';
import { FlowChart } from './FlowChart';
import { generateDialInAdvice, type DialInAdvice, formatTemperature, calculatePuckIntegrity } from '../lib/espressoMath';
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
  Share2,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { ShotShareModal } from './ShotShareModal';
import { DRINK_RECIPES } from '../data/drinkRecipes';

interface ShotSummaryModalProps {
  isOpen: boolean;
  shot: ShotRecord | null;
  tempUnit?: TempUnit;
  onClose: () => void;
  onViewInLogbook: () => void;
  onUpdateShot: (updated: ShotRecord) => void;
  onApplyGrindSetting?: (newSetting: string) => void;
}

export const ShotSummaryModal: React.FC<ShotSummaryModalProps> = ({
  isOpen,
  shot,
  tempUnit = 'C',
  onClose,
  onViewInLogbook,
  onUpdateShot,
  onApplyGrindSetting,
}) => {
  const { t, language } = useTranslation();
  const [selectedTaste, setSelectedTaste] = useState<TasteRating | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [appliedGrind, setAppliedGrind] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (shot) {
      setSelectedTaste(shot.tasteRating || null);
      setNotes(shot.notes || '');
      setAppliedGrind(false);
    }
  }, [shot]);

  if (!isOpen || !shot) return null;

  const handleTasteChange = (rating: TasteRating) => {
    const nextRating = selectedTaste === rating ? null : rating;
    setSelectedTaste(nextRating);
    const updated: ShotRecord = {
      ...shot,
      tasteRating: nextRating || undefined,
      notes: notes.trim() || undefined,
    };
    onUpdateShot(updated);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    const updated: ShotRecord = {
      ...shot,
      tasteRating: selectedTaste || undefined,
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
    selectedTaste || undefined,
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

  const isChanneling = Boolean(shot.channelingDetected || (typeof shot.channeling === 'object' && shot.channeling.detected));
  const isFast = shot.totalTimeSeconds < 24.0 || advice.grindAdvice === 'finer';
  const isSlow = !isFast && (shot.totalTimeSeconds > 32.0 || advice.grindAdvice === 'coarser');
  const isSurgeOnly = isChanneling && !isFast && !isSlow;
  const isGood = !isFast && !isSlow && !isSurgeOnly;

  const puckIntegrity = calculatePuckIntegrity(
    shot.channeling || shot.channelingDetected,
    undefined,
    shot.averageFlowGps
  );

  const currentGrindNum = parseFloat(shot.grindSetting);
  let nextSettingStr: string | null = advice.targetGrindSetting || null;
  if (!nextSettingStr && !isNaN(currentGrindNum) && advice.grindDeltaSteps > 0) {
    if (advice.grindAdvice === 'finer') {
      nextSettingStr = (Math.max(0, currentGrindNum - advice.grindDeltaSteps)).toFixed(1).replace('.0', '');
    } else if (advice.grindAdvice === 'coarser') {
      nextSettingStr = (currentGrindNum + advice.grindDeltaSteps).toFixed(1).replace('.0', '');
    }
  }

  const handleApplyGrind = (newSetting: string) => {
    if (onApplyGrindSetting) {
      onApplyGrindSetting(newSetting);
      setAppliedGrind(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-[60] bg-[#2C2018]/65 backdrop-blur-xs flex items-start justify-center p-3 sm:p-4 overflow-hidden"
      style={{
        paddingTop: 'calc(var(--app-header-height, calc(env(safe-area-inset-top, 0px) + 3.5rem)) + 0.5rem)',
        paddingBottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
      }}
    >
      <div
        className="bg-[#FFFDF9] w-full max-w-xl rounded-2xl sm:rounded-3xl border border-[#DECFC0] shadow-2xl overflow-hidden flex flex-col font-mono animate-modal-slide-up"
        style={{
          maxHeight: 'calc(100dvh - var(--app-header-height, calc(env(safe-area-inset-top, 0px) + 3.5rem)) - max(1.75rem, calc(env(safe-area-inset-bottom, 0px) + 1.25rem)))',
        }}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DFD5] bg-gradient-to-r from-[#FAF7F2] via-[#FFFDF9] to-[#FAF7F2] flex items-center justify-between shrink-0">
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-[#C26D52] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
              title={t('shotsummary.share_shot')}
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t('shotsummary.share_shot')}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#E8DFD5] text-[#7A6E65] transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Barista Decision Hero Card - Primary evaluation of extraction flow and grind setting */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              isGood
                ? 'bg-gradient-to-br from-[#72806B]/12 via-[#FAF7F2] to-[#FFFDF9] border-[#72806B]/35 shadow-xs'
                : isChanneling
                ? 'bg-gradient-to-br from-red-500/10 via-[#FAF7F2] to-[#FFFDF9] border-red-400/40 shadow-xs'
                : isFast
                ? 'bg-gradient-to-br from-amber-500/12 via-[#FAF7F2] to-[#FFFDF9] border-amber-400/40 shadow-xs'
                : 'bg-gradient-to-br from-[#8C6046]/12 via-[#FAF7F2] to-[#FFFDF9] border-[#8C6046]/35 shadow-xs'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isGood
                      ? 'bg-[#72806B] text-white'
                      : isChanneling
                      ? 'bg-red-600 text-white'
                      : isFast
                      ? 'bg-amber-500 text-white'
                      : 'bg-[#8C6046] text-white'
                  }`}
                >
                  {isGood ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : isChanneling ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : isFast ? (
                    <Sliders className="w-5 h-5" />
                  ) : (
                    <Sliders className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isGood
                          ? 'bg-[#72806B]/15 text-[#4E5A48] border border-[#72806B]/30'
                          : isChanneling
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : isFast
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#8C6046]/15 text-[#5C3F2D] border border-[#8C6046]/30'
                      }`}
                    >
                      {isGood
                        ? t('shotsummary.verdict_good')
                        : isChanneling
                        ? t('shotsummary.verdict_channeling')
                        : isFast
                        ? t('shotsummary.verdict_fast')
                        : t('shotsummary.verdict_slow')}
                    </span>
                    <span className="text-xs font-bold text-[#2C2018]">
                      {shot.totalTimeSeconds.toFixed(1)}s • {shot.actualYieldGrams.toFixed(1)}g (1:{ratio})
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#2C2018] mt-1">
                    {advice.summary}
                  </h4>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#2C2018]/90 mt-2.5 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-[#E8DFD5]">
              {advice.rationale}
            </p>

            {/* AI Learning Paused Shield Alert (Protects Grinder Profile against Channeling Spikes) */}
            {isChanneling && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="block text-[11px] font-bold text-amber-950 uppercase tracking-wide">
                    {t('grind.ai_recommendation_label')}: {t('coach.ai_learning_paused')}
                  </strong>
                  <p className="text-[11px] leading-relaxed text-amber-900/90 font-mono">
                    {t('coach.ai_paused_shield', {
                      spike: (typeof shot.channeling === 'object' && shot.channeling?.flowSpikeGps ? shot.channeling.flowSpikeGps.toFixed(1) : '3.0'),
                      setting: shot.grindSetting,
                    }) || `Flow spike detected on this shot. Grinder profile was protected – keep ${shot.grindSetting} and improve puck prep.`}
                  </p>
                </div>
              </div>
            )}

            {/* Grind Adjustment Recommendation Callout */}
            <div className="mt-3 pt-3 border-t border-[#DECFC0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="text-xs">
                <span className="text-[10px] text-[#7A6E65] uppercase font-bold block">
                  {t('shotsummary.grinder_adjustment')}
                </span>
                <span className="text-sm font-bold text-[#C26D52]">
                  {advice.grindAdvice === 'finer' && nextSettingStr
                    ? (t('logbook.dialin_finer', { from: shot.grindSetting, to: nextSettingStr }) || `Adjust grinder FINER: ${shot.grindSetting} ➔ ${nextSettingStr}`)
                    : advice.grindAdvice === 'coarser' && nextSettingStr
                    ? (t('logbook.dialin_coarser', { from: shot.grindSetting, to: nextSettingStr }) || `Adjust grinder COARSER: ${shot.grindSetting} ➔ ${nextSettingStr}`)
                    : advice.grindAdvice === 'keep'
                    ? (t('logbook.dialin_keep', { setting: shot.grindSetting }) || `Keep grinder at ${shot.grindSetting} (optimal)`)
                    : advice.grinderSpecificAdvice || 'Keep grinder setting • Improve puck prep'}
                </span>
              </div>

              {onApplyGrindSetting && nextSettingStr && advice.grindAdvice !== 'keep' && !isChanneling && (
                <button
                  type="button"
                  onClick={() => handleApplyGrind(nextSettingStr!)}
                  disabled={appliedGrind}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0 ${
                    appliedGrind
                      ? 'bg-[#72806B] text-white cursor-default'
                      : 'bg-[#C26D52] hover:bg-[#b05d43] text-white'
                  }`}
                >
                  {appliedGrind ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{t('shotsummary.applied_grind')}</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{t('shotsummary.apply_grind', { setting: nextSettingStr })}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          {/* Triple-Metric Hero Card (Stitch Inspiration) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] border border-[#DECFC0] shadow-xs">
            <div className="grid grid-cols-3 divide-x divide-[#DECFC0] text-center font-mono">
              {/* YIELD */}
              <div className="px-1.5 sm:px-2 space-y-0.5">
                <span className="text-[9.5px] uppercase font-bold text-[#7A6E65] tracking-wider block">
                  {t('shotsummary.metric_yield')}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#2C2018] tracking-tight">
                  {shot.actualYieldGrams.toFixed(1)}<span className="text-xs font-normal text-[#7A6E65]">g</span>
                </div>
                <span className="text-[10px] text-[#A6998E] block">
                  {t('shotsummary.metric_in_time', { time: shot.totalTimeSeconds.toFixed(1) })}
                </span>
              </div>

              {/* DOSE */}
              <div className="px-1.5 sm:px-2 space-y-0.5">
                <span className="text-[9.5px] uppercase font-bold text-[#7A6E65] tracking-wider block">
                  {t('shotsummary.metric_dose')}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#2C2018] tracking-tight">
                  {shot.doseGrams.toFixed(1)}<span className="text-xs font-normal text-[#7A6E65]">g</span>
                </div>
                <span className="text-[10px] text-[#C26D52] font-semibold block truncate">
                  {t('shotsummary.metric_grind', { grind: shot.grindSetting })}
                </span>
              </div>

              {/* RATIO */}
              <div className="px-1.5 sm:px-2 space-y-0.5">
                <span className="text-[9.5px] uppercase font-bold text-[#7A6E65] tracking-wider block">
                  {t('shotsummary.metric_ratio')}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-[#C26D52] tracking-tight">
                  1:{ratio}
                </div>
                <span className="text-[10px] text-[#A6998E] block">
                  {t('shotsummary.metric_target_ratio', {
                    target: shot.doseGrams > 0 ? (shot.targetYieldGrams / shot.doseGrams).toFixed(1) : '2.0',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Puck Resistance Integrity Card (Stitch Inspiration) */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${puckIntegrity.bgClass} ${puckIntegrity.borderClass}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${puckIntegrity.borderClass} bg-white/70 shadow-2xs`}>
                <ShieldCheck className={`w-4 h-4 ${puckIntegrity.colorClass}`} />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-mono font-bold tracking-wider text-[#7A6E65] block truncate">
                  {t('shotsummary.puck_integrity_title')}
                </span>
                <span className={`text-xs font-mono font-bold truncate block ${puckIntegrity.colorClass}`}>
                  {t(puckIntegrity.verdictKey)}
                </span>
              </div>
            </div>
            <div className="text-right font-mono shrink-0">
              <span className={`text-xl font-extrabold ${puckIntegrity.colorClass}`}>
                {puckIntegrity.score}
              </span>
              <span className="text-[10px] text-[#A6998E]"> / 100</span>
            </div>
          </div>

          {/* Equipment & Flow Instrument Sub-Bar */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
              <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                {t('logbook.equipment')}
              </span>
              <div className="text-xs font-bold text-[#2C2018] mt-0.5 truncate">
                {shot.grinderName.split(' ')[0]} @{' '}
                <strong className="text-[#C26D52]">{shot.grindSetting}</strong>
              </div>
              <span className="text-[10px] text-[#7A6E65] mt-0.5 block truncate">
                {shot.method === 'pour_over'
                  ? `🫗 ${(shot.filterBrewer || 'Manual Brewer').split('(')[0].trim()}${shot.kettleName ? ` • 🫖 ${shot.kettleName.split('(')[0].trim()}` : ''}`
                  : `${shot.machineName ? shot.machineName.split(' ')[0] : 'Machine'}${shot.brewTempC ? ` • ${formatTemperature(shot.brewTempC, tempUnit)}` : ''}`}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD5]">
              <span className="text-[9px] uppercase font-bold text-[#7A6E65] block">
                {t('logbook.taste_flow')}
              </span>
              <div className="text-xs font-bold text-[#2C2018] mt-0.5 truncate">
                {language === 'da' ? 'Ø' : 'avg.'} {shot.averageFlowGps.toFixed(2)} g/s
              </div>
              {(() => {
                const matchingRecipe = DRINK_RECIPES.find(
                  (d) => d.id === shot.drinkId || d.name.toLowerCase() === (shot.drinkName || '').toLowerCase()
                );
                const targetSec = matchingRecipe?.expectedTimeSeconds || (shot.method === 'pour_over' ? 180 : 28);
                const delta = Math.round((shot.totalTimeSeconds - targetSec) * 10) / 10;
                const diffStr = delta > 0 ? `+${delta.toFixed(1)}s` : `${delta.toFixed(1)}s`;
                const isTargetHit = Math.abs(delta) <= 2.5;
                const isTooSlow = delta > 2.5;
                const colorClass = isTargetHit
                  ? 'text-[#72806B]'
                  : isTooSlow
                  ? 'text-[#C26D52]'
                  : 'text-amber-700';

                return (
                  <span className={`text-[10px] font-semibold mt-0.5 block truncate ${colorClass}`}>
                    {t('logbook.target_time_diff', { target: targetSec, diff: diffStr })}
                  </span>
                );
              })()}
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
                averageFlowGps={shot.averageFlowGps}
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
        <div
          className="p-4 sm:p-5 bg-[#FAF7F2] border-t border-[#DECFC0] flex items-center gap-2.5 shrink-0"
          style={{ paddingBottom: 'max(3.25rem, calc(env(safe-area-inset-bottom, 0px) + 2.25rem))' }}
        >
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="py-3 px-3.5 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-[#C26D52] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98 shrink-0"
            title={t('shotsummary.share_shot')}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('shotsummary.share_shot')}</span>
          </button>

          <button
            type="button"
            onClick={onViewInLogbook}
            className="flex-1 py-3 px-4 rounded-xl bg-[#2C2018] hover:bg-[#3D2C22] text-[#FAF7F2] font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer active:scale-98"
          >
            <BookOpen className="w-4 h-4 text-[#C26D52]" />
            <span>{t('shotsummary.view_in_logbook')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-[#DECFC0] bg-white hover:bg-[#FAF7F2] text-[#2C2018] font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7A6E65]" />
            <span>{t('shotsummary.pull_new_shot')}</span>
          </button>
        </div>

        <ShotShareModal
          isOpen={isShareModalOpen}
          shot={shot}
          onClose={() => setIsShareModalOpen(false)}
        />
      </div>
    </div>
  );
};
