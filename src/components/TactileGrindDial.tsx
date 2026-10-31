import React from 'react';
import { Minus, Plus, Check, Sparkles } from 'lucide-react';
import type { GrinderProfile } from '../types/espresso';
import { resolveGrinderSpecs } from '../data/gearCatalog';
import { useTranslation } from '../i18n';

export interface TactileGrindDialProps {
  currentSetting: string;
  onSettingChange: (newSetting: string) => void;
  grinder: GrinderProfile;
  aiSuggestedSetting?: string;
  isAlreadyAdjusted?: boolean;
  showAiSuggestion?: boolean;
  targetTime?: number;
  targetYield?: number;
  compact?: boolean;
  className?: string;
}

export const TactileGrindDial: React.FC<TactileGrindDialProps> = ({
  currentSetting,
  onSettingChange,
  grinder,
  aiSuggestedSetting,
  isAlreadyAdjusted,
  showAiSuggestion = true,
  targetTime,
  targetYield,
  compact = false,
  className = '',
}) => {
  const { t } = useTranslation();

  const isDualZoneBaratza =
    grinder.name.toLowerCase().includes('baratza') &&
    grinder.name.toLowerCase().includes('esp');

  const isDualZoneBaratzaPro =
    isDualZoneBaratza &&
    grinder.name.toLowerCase().includes('pro');

  const resolvedGrinderSpecs =
    resolveGrinderSpecs(grinder.name) ||
    resolveGrinderSpecs(grinder.id);

  const effectiveMin =
    grinder.minSetting ??
    resolvedGrinderSpecs?.minSetting ??
    (isDualZoneBaratza ? 1.0 : 0.0);

  const effectiveMax =
    grinder.maxSetting ??
    resolvedGrinderSpecs?.maxSetting ??
    (isDualZoneBaratzaPro ? 60.0 : isDualZoneBaratza ? 40.0 : 30.0);

  const effectiveEspressoMax =
    grinder.espressoMaxSetting ??
    resolvedGrinderSpecs?.espressoMaxSetting ??
    (isDualZoneBaratzaPro
      ? 40.0
      : isDualZoneBaratza
      ? 20.0
      : effectiveMax > 0
      ? effectiveMax * 0.4
      : 20.0);

  const currentGrindNum = parseFloat(currentSetting) || 15.0;
  const isEspressoZone = currentGrindNum <= effectiveEspressoMax;

  const stepDelta = grinder.type === 'stepless' ? 0.2 : 0.5;

  const stepGrind = (deltaDir: number) => {
    const nextVal = Math.min(
      effectiveMax,
      Math.max(effectiveMin, Math.round((currentGrindNum + deltaDir * stepDelta) * 10) / 10)
    );
    onSettingChange(nextVal.toFixed(1));
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newSetting = effectiveMin + pct * (effectiveMax - effectiveMin);
    const stepPrecision = grinder.type === 'stepless' ? 0.1 : 0.5;
    const rounded = Math.round(newSetting / stepPrecision) * stepPrecision;
    const clamped = Math.min(effectiveMax, Math.max(effectiveMin, rounded));
    onSettingChange(clamped.toFixed(1));
  };

  const tickCount = isDualZoneBaratzaPro ? 60 : isDualZoneBaratza ? 40 : 31;
  const maxTickIdx = tickCount - 1;
  const splitTarget = Math.round(effectiveEspressoMax);

  const aiTargetNum = aiSuggestedSetting ? parseFloat(aiSuggestedSetting) : NaN;
  const hasAiTarget = !isNaN(aiTargetNum) && aiTargetNum >= effectiveMin && aiTargetNum <= effectiveMax;

  return (
    <div className={`space-y-2 font-mono select-none ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#7A6E65] uppercase font-bold tracking-wider">
          {grinder.name.split(' ')[0]} ({grinder.stepUnit || (grinder.type === 'stepless' ? 'stepless' : 'steps')})
        </span>
        {targetTime !== undefined && targetYield !== undefined && (
          <span className="text-[#7A6E65] text-[9.5px]">
            Target: ~{targetTime}s ({targetYield}g)
          </span>
        )}
      </div>

      {/* Hero Display + Stepper */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-[#E8DFD5] space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Number Display */}
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#2C2018] tracking-tight">
              {currentGrindNum.toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#7A6E65] uppercase font-mono font-medium truncate">
              {isDualZoneBaratza && currentGrindNum > effectiveEspressoMax
                ? t('gear.macro_step') || 'Macro-Step'
                : t('gear.micro_step') || 'Micro-Step'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zone Badge */}
            <span
              className={`text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded-md border ${
                isEspressoZone
                  ? 'text-[#C26D52] bg-[#C26D52]/10 border-[#C26D52]/30'
                  : 'text-[#72806B] bg-[#72806B]/10 border-[#72806B]/30'
              }`}
            >
              {isEspressoZone
                ? t('gear.espresso_zone') || 'Espresso'
                : t('gear.filter_zone') || 'Filter'}
            </span>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => stepGrind(-1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF7F2] border border-[#D0BDAA] text-[#2C2018] hover:bg-white hover:border-[#C26D52] font-bold text-base flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs"
                title={`Finere (-${stepDelta})`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => stepGrind(1)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#FAF7F2] border border-[#D0BDAA] text-[#2C2018] hover:bg-white hover:border-[#C26D52] font-bold text-base flex items-center justify-center transition active:scale-90 cursor-pointer shadow-2xs"
                title={`Grovere (+${stepDelta})`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Header Label Row ABOVE ruler */}
        <div className="flex items-center justify-between text-[9.5px] font-mono select-none px-0.5 pt-0.5">
          <span className="font-bold text-[#C26D52]">
            Fin ({effectiveMin.toFixed(effectiveMin % 1 === 0 ? 0 : 1)})
          </span>

          {isDualZoneBaratza ? (
            <span className="font-bold text-stone-600 bg-white/80 border border-[#D0BDAA] px-1.5 py-0.2 rounded-md text-[8.5px] shadow-2xs">
              Split ({effectiveEspressoMax.toFixed(1)})
            </span>
          ) : effectiveEspressoMax > 0 ? (
            <span className="font-semibold text-stone-600 bg-white/80 border border-[#D0BDAA] px-1.5 py-0.2 rounded-md text-[8.5px] shadow-2xs">
              Espresso ≤ {effectiveEspressoMax.toFixed(effectiveEspressoMax % 1 === 0 ? 0 : 1)}
            </span>
          ) : null}

          <span className="font-bold text-[#72806B]">
            Grov ({effectiveMax.toFixed(effectiveMax % 1 === 0 ? 0 : 1)})
          </span>
        </div>

        {/* Caliper Ruler Box with Notch & AI Target */}
        <div
          className="relative w-full h-8 sm:h-9 bg-[#FAF7F2] rounded-xl border border-[#D0BDAA] px-3 flex items-center overflow-hidden shadow-2xs cursor-pointer select-none"
          title="Tryk for at indstille kværntrin"
          onClick={handleRulerClick}
        >
          {/* Caliper Ticks */}
          <div className="absolute inset-0 px-3 flex items-end pointer-events-none z-0">
            <div className="relative w-full h-full">
              {Array.from({ length: tickCount }, (_, idx) => {
                const tickVal = isDualZoneBaratza
                  ? idx + 1
                  : effectiveMin + (idx / maxTickIdx) * (effectiveMax - effectiveMin);
                const percent = (idx / maxTickIdx) * 100;
                const isSplit = isDualZoneBaratza && tickVal === splitTarget;
                const isMajor = idx === 0 || idx === maxTickIdx;
                const isMid = isDualZoneBaratza ? tickVal % 5 === 0 : idx % 5 === 0;

                let tickHeight = 'h-2 w-[1px] bg-[#D0BDAA]/70';
                if (isSplit) {
                  tickHeight = 'h-6 w-0.5 bg-[#C26D52]';
                } else if (isMajor) {
                  tickHeight = 'h-3.5 w-0.5 bg-[#2C2018]';
                } else if (isMid) {
                  tickHeight = 'h-2.5 w-0.5 bg-[#A6998E]';
                }

                return (
                  <div
                    key={`tick-${idx}`}
                    className={`absolute bottom-0 -translate-x-1/2 ${tickHeight}`}
                    style={{ left: `${percent}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* AI Target Notch on Ruler (if available) */}
          {hasAiTarget && (
            <div
              className="absolute bottom-0 top-0 w-0.5 bg-[#C26D52]/70 pointer-events-none z-10 transition-all duration-150"
              style={{
                left: `${Math.min(
                  96,
                  Math.max(
                    4,
                    ((aiTargetNum - effectiveMin) /
                      Math.max(0.1, effectiveMax - effectiveMin)) *
                      100
                  )
                )}%`,
              }}
            >
              <div
                className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-[#C26D52] ring-2 ring-white shadow-xs"
                title={`AI Anbefaling: ${aiTargetNum.toFixed(1)}`}
              />
            </div>
          )}

          {/* Current Position Thumb Notch */}
          <div
            className="absolute bottom-0 top-0 w-1 bg-[#2C2018] shadow-sm transition-all duration-150 pointer-events-none z-20"
            style={{
              left: `${Math.min(
                96,
                Math.max(
                  4,
                  ((currentGrindNum - effectiveMin) /
                    Math.max(0.1, effectiveMax - effectiveMin)) *
                    100
                )
              )}%`,
            }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-[#2C2018] -translate-x-1.25 -translate-y-0.5 sm:-translate-y-1 shadow-md border-2 border-white" />
          </div>
        </div>

        {/* Dynamic Zone Explanation */}
        {!compact && (
          isDualZoneBaratzaPro ? (
            <div className="flex items-center justify-between text-[9px] text-[#7A6E65] px-1 font-sans">
              <span className="text-[#C26D52] font-semibold">● 1–40: 20µm Micro (Espresso)</span>
              <span className="text-[#72806B] font-semibold">● 41–60: Macro (Filter)</span>
            </div>
          ) : isDualZoneBaratza ? (
            <div className="flex items-center justify-between text-[9px] text-[#7A6E65] px-1 font-sans">
              <span className="text-[#C26D52] font-semibold">● 1–20: 20µm Micro (Espresso)</span>
              <span className="text-[#72806B] font-semibold">● 21–40: 90µm Macro (Filter)</span>
            </div>
          ) : effectiveEspressoMax > 0 ? (
            <div className="flex items-center justify-between text-[9px] text-[#7A6E65] px-1 font-sans">
              <span className="text-[#C26D52] font-semibold">● ≤ {effectiveEspressoMax.toFixed(effectiveEspressoMax % 1 === 0 ? 0 : 1)}: Espresso</span>
              <span className="text-[#72806B] font-semibold">● &gt; {effectiveEspressoMax.toFixed(effectiveEspressoMax % 1 === 0 ? 0 : 1)}: Filter</span>
            </div>
          ) : null
        )}
      </div>

      {/* AI Suggestion Action Bar */}
      {showAiSuggestion && aiSuggestedSetting && (
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {!isAlreadyAdjusted ? (
            <button
              type="button"
              onClick={() => onSettingChange(aiSuggestedSetting)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-[#C26D52]/10 hover:bg-[#C26D52] text-[#C26D52] hover:text-white border border-[#C26D52]/30 text-[10.5px] font-sans font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title={`${t('drink.apply_suggestion')}: ${aiSuggestedSetting}`}
            >
              <Sparkles className="w-3 h-3 text-[#C26D52]" />
              <span>Anbefalet kværntrin: <strong>{aiSuggestedSetting}</strong> ({t('drink.apply_suggestion')})</span>
            </button>
          ) : (
            <div className="w-full py-1 px-2.5 rounded-lg bg-[#72806B]/15 text-[#54624F] border border-[#72806B]/30 text-[10.5px] font-sans font-bold flex items-center justify-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#72806B]" />
              <span>Kværn indstillet til AI anbefaling ({currentSetting})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

