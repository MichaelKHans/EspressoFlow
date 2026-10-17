import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle,
  Check,
  X,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import type { ShotRecord, CoffeeBeanProfile } from '../types/espresso';
import { generateDialInAdvice, type DialInAdvice } from '../lib/espressoMath';
import { loadOrCreateGrinderProfile, getAnchorForBean, getLatestAnchorForGrinder } from '../lib/storage';
import { predictOptimalGrindSetting } from '../lib/grindIntelligence';
import { useTranslation } from '../i18n';

interface PreBrewCoachBannerProps {
  activeDrinkId: string;
  activeDrinkName: string;
  currentGrindSetting: string;
  grinderName: string;
  shots: ShotRecord[];
  onApplyGrindSetting: (newSetting: string) => void;
  isBrewing?: boolean;
  currentBean?: CoffeeBeanProfile;
}

export const PreBrewCoachBanner: React.FC<PreBrewCoachBannerProps> = ({
  activeDrinkId,
  activeDrinkName,
  currentGrindSetting,
  grinderName,
  shots,
  onApplyGrindSetting,
  isBrewing = false,
  currentBean,
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [justApplied, setJustApplied] = useState<boolean>(false);

  // If brewing or explicitly dismissed, keep the view minimal or hidden
  if (isBrewing || isDismissed) {
    return null;
  }

  // Check Adaptive Grind Intelligence (On-Device AI Engine)
  const profile = loadOrCreateGrinderProfile(grinderName);
  const anchor = currentBean ? getAnchorForBean(currentBean.id) : undefined;
  const refAnchor = getLatestAnchorForGrinder(grinderName);
  const aiPred = currentBean
    ? predictOptimalGrindSetting({
        grinderProfile: profile,
        activeBean: currentBean,
        anchor,
        referenceAnchorForGrinder: refAnchor,
        currentSetting: currentGrindSetting,
      })
    : null;

  // Find the most recent shot for this drink (or by name match)
  const lastShot = shots.find(
    (s) => s.drinkId === activeDrinkId || (s.drinkName || '').toLowerCase() === activeDrinkName.toLowerCase()
  );

  const hasProactiveAiAdvice = Boolean(
    aiPred &&
    (aiPred.reason === 'roast_shift' || aiPred.reason === 'degas_drift') &&
    aiPred.formattedSetting !== currentGrindSetting
  );

  if (!lastShot && !hasProactiveAiAdvice) {
    return null; // No previous history for this recipe yet and no proactive shift
  }

  const isChanneling = Boolean(
    lastShot &&
    (lastShot.channelingDetected ||
    (typeof lastShot.channeling === 'object' && lastShot.channeling.detected))
  );

  const advice: DialInAdvice | null = lastShot
    ? generateDialInAdvice(
        lastShot.totalTimeSeconds,
        lastShot.doseGrams,
        lastShot.actualYieldGrams,
        lastShot.channeling || lastShot.channelingDetected,
        lastShot.tasteRating,
        lastShot.preInfusionSeconds,
        lastShot.roastLevel,
        lastShot.grinderName || grinderName,
        lastShot.grindSetting
      )
    : null;

  const isFast = Boolean(lastShot && !isChanneling && (lastShot.totalTimeSeconds < 24.0 || (advice && advice.grindAdvice === 'finer')));
  const isSlow = Boolean(lastShot && !isChanneling && (lastShot.totalTimeSeconds > 32.0 || (advice && advice.grindAdvice === 'coarser')));
  const isGood = Boolean(lastShot && !isChanneling && !isFast && !isSlow);

  let targetSettingStr: string | null = null;
  let badgeBorder = 'border-[#72806B]/30 bg-[#72806B]/10 text-[#54624F]';
  let bannerBorder = 'border-[#DECFC0] bg-[#FFFDF9]';
  let verdictTitle = t('coach.verdict_good') || 'Sidste bryg var spot-on!';
  let adviceSummary = '';
  let iconType: 'good' | 'channeling' | 'fast' | 'slow' | 'ai' = 'good';

  if (isChanneling) {
    iconType = 'channeling';
    badgeBorder = 'border-amber-500/40 bg-amber-500/10 text-amber-900';
    bannerBorder = 'border-amber-300 bg-[#FFFDF9]';
    verdictTitle = t('coach.verdict_channeling') || 'Last shot channeled';
    const spikeGps =
      typeof lastShot?.channeling === 'object' && lastShot.channeling?.flowSpikeGps
        ? lastShot.channeling.flowSpikeGps.toFixed(1)
        : '3.0';
    adviceSummary =
      t('coach.ai_paused_shield', {
        spike: spikeGps,
        setting: lastShot?.grindSetting || currentGrindSetting,
      }) ||
      `AI Learning Paused: Flow surge (${spikeGps} g/s) detected on last shot. Grinder profile preserved – keep ${lastShot?.grindSetting || currentGrindSetting} and use WDT needles.`;
    targetSettingStr = null; // Do not shift grind when puck channeled
  } else if (hasProactiveAiAdvice && aiPred) {
    iconType = 'ai';
    badgeBorder = 'border-[#C26D52]/40 bg-[#C26D52]/10 text-[#8C3F27]';
    bannerBorder = 'border-[#C26D52]/30 bg-[#FFFDF9]';
    targetSettingStr = aiPred.formattedSetting;

    if (aiPred.reason === 'roast_shift') {
      verdictTitle = t('grind.ai_recommendation_label') || 'Smart Roast Shift';
      adviceSummary =
        t('coach.smart_roast_shift', {
          bean: currentBean?.name || 'Coffee',
          roast: currentBean?.roastLevel || 'Medium',
          grinder: grinderName.split(' ')[0],
          setting: aiPred.formattedSetting,
          delta: aiPred.stepDelta > 0 ? `+${aiPred.stepDelta}` : `${aiPred.stepDelta}`,
        }) ||
        `Smart Roast Shift: ${currentBean?.name} is ${currentBean?.roastLevel}. Based on your ${grinderName.split(' ')[0]} profile, ${aiPred.formattedSetting} is recommended (${aiPred.stepDelta > 0 ? `+${aiPred.stepDelta}` : aiPred.stepDelta} steps).`;
    } else {
      // degas_drift
      const daysOffRoast = currentBean?.roastDate
        ? Math.max(0, Math.floor((Date.now() - new Date(currentBean.roastDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 7;
      verdictTitle = 'Degas Drift Guard';
      adviceSummary =
        t('coach.degas_drift_guard', {
          days: daysOffRoast,
          steps: Math.abs(aiPred.stepDelta),
          setting: aiPred.formattedSetting,
        }) ||
        `Degas Drift Guard: Bag has aged ${daysOffRoast}d since roast. Adjust ${Math.abs(aiPred.stepDelta)} steps finer (${aiPred.formattedSetting}) to maintain optimal flow.`;
    }
  } else if (lastShot && advice) {
    const currNum = parseFloat(lastShot.grindSetting || currentGrindSetting);
    targetSettingStr = advice.targetGrindSetting || null;
    if (!targetSettingStr && !isNaN(currNum) && advice.grindDeltaSteps > 0) {
      if (advice.grindAdvice === 'finer') {
        targetSettingStr = Math.max(0, currNum - advice.grindDeltaSteps).toFixed(1).replace('.0', '');
      } else if (advice.grindAdvice === 'coarser') {
        targetSettingStr = (currNum + advice.grindDeltaSteps).toFixed(1).replace('.0', '');
      }
    }

    if (isFast) {
      iconType = 'fast';
      badgeBorder = 'border-amber-500/40 bg-amber-500/10 text-amber-900';
      bannerBorder = 'border-amber-300/80 bg-[#FFFDF9]';
      verdictTitle = t('coach.verdict_fast') || 'Last shot ran fast';
      adviceSummary = targetSettingStr
        ? t('coach.recommend_finer', { steps: advice.grindDeltaSteps, setting: targetSettingStr }) ||
          `Last shot took ${lastShot.totalTimeSeconds.toFixed(1)}s. Adjust grinder ${advice.grindDeltaSteps} steps FINER to ${targetSettingStr} before brewing.`
        : `Last shot took ${lastShot.totalTimeSeconds.toFixed(1)}s. Grind finer before brewing to increase puck resistance.`;
    } else if (isSlow) {
      iconType = 'slow';
      badgeBorder = 'border-[#8C6046]/40 bg-[#8C6046]/10 text-[#6A4733]';
      bannerBorder = 'border-[#8C6046]/30 bg-[#FFFDF9]';
      verdictTitle = t('coach.verdict_slow') || 'Last shot ran slow';
      adviceSummary = targetSettingStr
        ? t('coach.recommend_coarser', { steps: advice.grindDeltaSteps, setting: targetSettingStr }) ||
          `Last shot took ${lastShot.totalTimeSeconds.toFixed(1)}s. Adjust grinder ${advice.grindDeltaSteps} steps COARSER to ${targetSettingStr} before brewing.`
        : `Last shot took ${lastShot.totalTimeSeconds.toFixed(1)}s. Grind coarser for a smoother flow.`;
    } else if (isGood || lastShot) {
      iconType = 'good';
      badgeBorder = 'border-[#72806B]/30 bg-[#72806B]/10 text-[#54624F]';
      bannerBorder = 'border-[#DECFC0] bg-[#FFFDF9]';
      verdictTitle = t('coach.verdict_good') || 'Last shot was spot on!';
      adviceSummary =
        t('coach.recommend_keep', { setting: lastShot.grindSetting || currentGrindSetting }) ||
        `Last shot (${lastShot.totalTimeSeconds.toFixed(1)}s) was in the Golden Zone! Keep your grinder at ${lastShot.grindSetting || currentGrindSetting}.`;
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

  return (
    <aside
      aria-label={t('coach.pre_brew_title') || 'Barista Coach Anbefaling'}
      className={`rounded-2xl border p-3 sm:p-3.5 shadow-sm font-mono transition-all animate-fadeIn ${bannerBorder}`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2C2018] text-[#FAF7F2] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            {iconType === 'good' ? (
              <CheckCircle className="w-4 h-4 text-[#10B981]" />
            ) : iconType === 'channeling' ? (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            ) : iconType === 'ai' ? (
              <Sparkles className="w-4 h-4 text-[#C26D52]" />
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
                {lastShot
                  ? `${lastShot.totalTimeSeconds.toFixed(1)}s @ ${lastShot.grindSetting}`
                  : `${currentBean?.roastLevel || 'Medium'} • ${currentBean?.name || 'Kaffe'}`}
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
          className="text-[#7A6E65] hover:text-[#2C2018] p-1 rounded-lg transition shrink-0 cursor-pointer"
          title={t('coach.dismiss') || 'Skjul'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Action Button: 1-Tap Grind Setting Adoption */}
      {targetSettingStr && !isAlreadyAdjusted && (
        <div className="mt-2.5 pt-2.5 border-t border-[#E8DFD5] flex items-center justify-between gap-2">
          <div className="text-[11px] text-[#7A6E65]">
            {t('coach.current_grind_label')}: <strong className="text-[#2C2018]">{currentGrindSetting}</strong> ➔ {t('coach.recommended_label')}:{' '}
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
                <span>{t('shotsummary.applied_grind') || 'Updated'}</span>
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5" />
                <span>
                  {t('coach.apply_btn', { setting: targetSettingStr }) || `Set to ${targetSettingStr}`}
                </span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};

