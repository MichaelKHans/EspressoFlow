import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import type { ShotRecord } from '../types/espresso';
import { generateDialInAdvice, type DialInAdvice } from '../lib/espressoMath';
import { useTranslation } from '../i18n';

interface PreBrewCoachBannerProps {
  activeDrinkId: string;
  activeDrinkName: string;
  currentGrindSetting: string;
  grinderName: string;
  shots: ShotRecord[];
  onApplyGrindSetting: (newSetting: string) => void;
  isBrewing?: boolean;
}

export const PreBrewCoachBanner: React.FC<PreBrewCoachBannerProps> = ({
  activeDrinkId,
  activeDrinkName,
  currentGrindSetting,
  grinderName,
  shots,
  onApplyGrindSetting,
  isBrewing = false,
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [justApplied, setJustApplied] = useState<boolean>(false);

  // If brewing or explicitly dismissed, keep the view minimal or hidden
  if (isBrewing || isDismissed) {
    return null;
  }

  // Find the most recent shot for this drink (or by name match)
  const lastShot = shots.find(
    (s) => s.drinkId === activeDrinkId || (s.drinkName || '').toLowerCase() === activeDrinkName.toLowerCase()
  );

  if (!lastShot) {
    return null; // No previous history for this recipe yet
  }

  const advice: DialInAdvice = generateDialInAdvice(
    lastShot.totalTimeSeconds,
    lastShot.doseGrams,
    lastShot.actualYieldGrams,
    lastShot.channeling || lastShot.channelingDetected,
    lastShot.tasteRating,
    lastShot.preInfusionSeconds,
    lastShot.roastLevel,
    lastShot.grinderName || grinderName,
    lastShot.grindSetting
  );

  const isChanneling = Boolean(
    lastShot.channelingDetected ||
    (typeof lastShot.channeling === 'object' && lastShot.channeling.detected)
  );
  const isFast = !isChanneling && (lastShot.totalTimeSeconds < 24.0 || advice.grindAdvice === 'finer');
  const isSlow = !isChanneling && (lastShot.totalTimeSeconds > 32.0 || advice.grindAdvice === 'coarser');
  const isGood = !isChanneling && !isFast && !isSlow;

  // Calculate suggested setting
  const currNum = parseFloat(lastShot.grindSetting || currentGrindSetting);
  let targetSettingStr: string | null = advice.targetGrindSetting || null;
  if (!targetSettingStr && !isNaN(currNum) && advice.grindDeltaSteps > 0) {
    if (advice.grindAdvice === 'finer') {
      targetSettingStr = (Math.max(0, currNum - advice.grindDeltaSteps)).toFixed(1).replace('.0', '');
    } else if (advice.grindAdvice === 'coarser') {
      targetSettingStr = (currNum + advice.grindDeltaSteps).toFixed(1).replace('.0', '');
    }
  }

  // Check if current setting already equals target
  const isAlreadyAdjusted = targetSettingStr !== null && currentGrindSetting === targetSettingStr;

  const handleApply = () => {
    if (targetSettingStr) {
      onApplyGrindSetting(targetSettingStr);
      setJustApplied(true);
      setTimeout(() => setJustApplied(false), 3000);
    }
  };

  // Visual Theme Configuration based on extraction verdict
  let badgeBorder = 'border-[#72806B]/30 bg-[#72806B]/10 text-[#54624F]';
  let bannerBorder = 'border-[#DECFC0] bg-[#FFFDF9]';
  let verdictTitle = t('coach.verdict_good') || 'Sidste bryg var spot-on!';
  let adviceSummary = t('coach.recommend_keep', { setting: lastShot.grindSetting || currentGrindSetting }) ||
    `Sidste bryg (${lastShot.totalTimeSeconds.toFixed(1)}s) sad lige i skabet! Behold din kværn på ${lastShot.grindSetting || currentGrindSetting}.`;

  if (isChanneling) {
    badgeBorder = 'border-amber-500/40 bg-amber-500/10 text-amber-900';
    bannerBorder = 'border-amber-300 bg-[#FFFDF9]';
    verdictTitle = t('coach.verdict_channeling') || 'Kanalisering på sidste bryg';
    adviceSummary = t('coach.recommend_channeling', { setting: lastShot.grindSetting || currentGrindSetting }) ||
      `Sidste bryg havde flow-spike (kanalisering). Hold kværnen på ${lastShot.grindSetting || currentGrindSetting} og fokusér på jævn WDT & tamping.`;
  } else if (isFast) {
    badgeBorder = 'border-amber-500/40 bg-amber-500/10 text-amber-900';
    bannerBorder = 'border-amber-300/80 bg-[#FFFDF9]';
    verdictTitle = t('coach.verdict_fast') || 'Sidste bryg gik for hurtigt';
    adviceSummary = targetSettingStr
      ? (t('coach.recommend_finer', { steps: advice.grindDeltaSteps, setting: targetSettingStr }) ||
        `Sidste bryg tog ${lastShot.totalTimeSeconds.toFixed(1)}s. Stil kværnen ${advice.grindDeltaSteps} trin FINERE til ${targetSettingStr} før du brygger.`)
      : `Sidste bryg tog ${lastShot.totalTimeSeconds.toFixed(1)}s. Kværn finere før du brygger for at øge modstanden.`;
  } else if (isSlow) {
    badgeBorder = 'border-[#8C6046]/40 bg-[#8C6046]/10 text-[#6A4733]';
    bannerBorder = 'border-[#8C6046]/30 bg-[#FFFDF9]';
    verdictTitle = t('coach.verdict_slow') || 'Sidste bryg gik for langsomt';
    adviceSummary = targetSettingStr
      ? (t('coach.recommend_coarser', { steps: advice.grindDeltaSteps, setting: targetSettingStr }) ||
        `Sidste bryg tog ${lastShot.totalTimeSeconds.toFixed(1)}s. Stil kværnen ${advice.grindDeltaSteps} trin GROVERE til ${targetSettingStr} før du brygger.`)
      : `Sidste bryg tog ${lastShot.totalTimeSeconds.toFixed(1)}s. Kværn grovere for et friere flow.`;
  }

  return (
    <aside
      aria-label={t('coach.pre_brew_title') || 'Barista Coach Anbefaling'}
      className={`rounded-2xl border p-3 sm:p-3.5 shadow-sm font-mono transition-all animate-fadeIn ${bannerBorder}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            {isGood ? (
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
            ) : isChanneling ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <Sliders className="w-4 h-4 text-[#C26D52]" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#7A6E65]">
                {t('coach.pre_brew_title') || 'Barista Coach'}
              </span>
              <span className={`text-[9.5px] px-2 py-0.2 rounded-full font-bold border ${badgeBorder}`}>
                {verdictTitle}
              </span>
              <span className="text-[10px] text-[#7A6E65]">
                {lastShot.totalTimeSeconds.toFixed(1)}s @ {lastShot.grindSetting}
              </span>
            </div>
            <p className="text-xs text-[#2C2018] font-sans font-medium leading-relaxed pt-0.5">
              {adviceSummary}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-[#7A6E65] hover:text-[#2C2018] p-1 rounded-lg transition shrink-0"
          title={t('coach.dismiss') || 'Skjul'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Button: 1-Tap Grind Setting Adoption */}
      {targetSettingStr && !isAlreadyAdjusted && (
        <div className="mt-2.5 pt-2.5 border-t border-[#E8DFD5] flex items-center justify-between gap-2">
          <div className="text-[11px] text-[#7A6E65]">
            Nuværende kværn: <strong className="text-[#2C2018]">{currentGrindSetting}</strong> ➔ Anbefalet:{' '}
            <strong className="text-[#C26D52]">{targetSettingStr}</strong>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer ${
              justApplied
                ? 'bg-[#72806B] text-white'
                : 'bg-[#C26D52] hover:bg-[#b05d43] text-white'
            }`}
          >
            {justApplied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('shotsummary.applied_grind') || 'Opdateret'}</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>
                  {t('coach.apply_btn', { setting: targetSettingStr }) || `Sæt til ${targetSettingStr}`}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
