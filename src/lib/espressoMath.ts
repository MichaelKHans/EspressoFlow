import type { ShotDataPoint, TasteRating, ChannelingEvent, RoastLevel, RatioStyle, TempUnit } from '../types/espresso';

/**
 * Specialty Coffee Golden Zone Parameters
 */
export const THE_GOLDEN_ZONE = {
  MIN_FLOW_GPS: 1.2,
  MAX_FLOW_GPS: 1.6,
  OPTIMAL_PRE_INFUSION_MIN: 4.0,
  OPTIMAL_PRE_INFUSION_MAX: 8.5,
  OPTIMAL_TOTAL_TIME_MIN: 26.0,
  OPTIMAL_TOTAL_TIME_MAX: 32.0,
};

export const RATIO_PRESETS: Record<RatioStyle, { label: string; multiplier: number; shortDesc: string; desc: string }> = {
  ristretto: {
    label: 'Ristretto (1:1.5)',
    multiplier: 1.5,
    shortDesc: 'Syrupy & dense body',
    desc: 'Short, viscous shot. Best for dark roasts, milk drinks (Flat White / Cortado), or cutting harsh bitterness.',
  },
  standard: {
    label: 'Standard Espresso (1:2.0)',
    multiplier: 2.0,
    shortDesc: 'Golden balance',
    desc: 'The classic specialty standard. Perfect balance of bright acidity, caramelized sweetness, and clean crema.',
  },
  lungo: {
    label: 'Modern Lungo (1:2.5)',
    multiplier: 2.5,
    shortDesc: 'Light roast sweet spot',
    desc: 'Higher water volume dissolves stubborn complex sugars in dense light roasts. Delivers floral sweetness.',
  },
  allonge: {
    label: 'Allongé (1:3.0)',
    multiplier: 3.0,
    shortDesc: 'Tea-like clarity',
    desc: 'Extended pull emphasizing delicate floral aromas, citrus top-notes, and juicy body.',
  },
  custom: {
    label: 'Custom Ratio',
    multiplier: 2.0,
    shortDesc: 'Manual target yield',
    desc: 'Custom target yield specified in grams.',
  },
};

export const ROAST_PRESETS: Record<RoastLevel, { label: string; defaultRatio: RatioStyle; defaultPreInfusion: number; advice: string }> = {
  light: {
    label: 'Light Roast',
    defaultRatio: 'lungo',
    defaultPreInfusion: 8.0,
    advice: 'Dense, hard beans with high malic/citric acid. Use longer ratio (1:2.5) & 7-10s pre-infusion to unlock sweetness.',
  },
  medium: {
    label: 'Medium Roast',
    defaultRatio: 'standard',
    defaultPreInfusion: 6.0,
    advice: 'Balanced solubility with notes of chocolate and nuts. Optimal with standard 1:2.0 ratio and 26-30s total time.',
  },
  'medium-dark': {
    label: 'Med-Dark Roast',
    defaultRatio: 'standard',
    defaultPreInfusion: 4.5,
    advice: 'Rich crema and low acidity. Keep extraction controlled around 1:1.8–1:2.0 to avoid drying aftertaste.',
  },
  dark: {
    label: 'Dark Roast',
    defaultRatio: 'ristretto',
    defaultPreInfusion: 3.0,
    advice: 'Porøse bønner with fast solubility. Pull short (1:1.5 Ristretto) and keep contact time brief to prevent bitter ashiness.',
  },
};

/**
 * Calculates smoothed flow rate using moving average over recent samples
 */
export function calculateSmoothedFlowRate(
  points: ShotDataPoint[],
  windowSizeSeconds: number = 0.8
): number {
  if (points.length < 2) return 0;
  
  const lastPoint = points[points.length - 1];
  const cutoffTime = Math.max(0, lastPoint.timeSeconds - windowSizeSeconds);
  const recentPoints = points.filter(p => p.timeSeconds >= cutoffTime);

  if (recentPoints.length < 2) return 0;

  const firstRecent = recentPoints[0];
  const deltaWeight = lastPoint.weightGrams - firstRecent.weightGrams;
  const deltaTime = lastPoint.timeSeconds - firstRecent.timeSeconds;

  if (deltaTime <= 0) return 0;
  const rate = deltaWeight / deltaTime;
  return Math.max(0, Math.round(rate * 10) / 10);
}

/**
 * In-depth channeling detection with exact timestamp and magnitude
 */
export function analyzeChanneling(points: ShotDataPoint[]): ChannelingEvent {
  if (points.length < 6) {
    return { detected: false, severity: 'none' };
  }

  // Scan mid-extraction period (after initial saturation at 6s)
  let maxSpike = 0;
  let spikeTimestamp = 0;

  for (let i = 2; i < points.length; i++) {
    const pt = points[i];
    if (pt.timeSeconds >= 7 && pt.timeSeconds <= 30) {
      // Check for abrupt flow acceleration (> 2.8 g/s or sudden jump of +1.5 g/s)
      const prev = points[i - 2];
      const jump = pt.flowRateGps - prev.flowRateGps;

      if (pt.flowRateGps >= 3.0 || jump >= 1.4) {
        if (pt.flowRateGps > maxSpike) {
          maxSpike = pt.flowRateGps;
          spikeTimestamp = pt.timeSeconds;
        }
      }
    }
  }

  if (maxSpike >= 3.8) {
    return {
      detected: true,
      timestampSeconds: Math.round(spikeTimestamp * 10) / 10,
      flowSpikeGps: Math.round(maxSpike * 10) / 10,
      severity: 'severe',
      message: `Severe channeling spike (${maxSpike.toFixed(1)} g/s at ${spikeTimestamp.toFixed(1)}s). Water broke through puck.`,
    };
  } else if (maxSpike >= 2.9) {
    return {
      detected: true,
      timestampSeconds: Math.round(spikeTimestamp * 10) / 10,
      flowSpikeGps: Math.round(maxSpike * 10) / 10,
      severity: 'mild',
      message: `Mild channeling detected (${maxSpike.toFixed(1)} g/s at ${spikeTimestamp.toFixed(1)}s).`,
    };
  }

  return { detected: false, severity: 'none' };
}

/**
 * Backward compatible boolean detector
 */
export function detectChanneling(points: ShotDataPoint[]): boolean {
  return analyzeChanneling(points).detected;
}

export const GRINDER_CALIBRATIONS: Record<string, { secondsPerStep: number; unitName: string }> = {
  'Baratza Encore ESP Pro': { secondsPerStep: 2.5, unitName: 'micro-steps' },
  'Baratza Encore ESP': { secondsPerStep: 2.5, unitName: 'micro-steps' },
  'Eureka Mignon Specialita 16CR': { secondsPerStep: 6.0, unitName: 'major divisions (0.2 per 1.2s)' },
  'Eureka Mignon Manuale / Silenzio 15BL': { secondsPerStep: 6.0, unitName: 'major divisions' },
  'Eureka Mignon Libra (Grind-by-Weight)': { secondsPerStep: 6.0, unitName: 'divisions' },
  'Eureka Mignon Zero / Oro Single Dose': { secondsPerStep: 5.0, unitName: 'dial marks' },
  'Varia VS3 (Gen 2)': { secondsPerStep: 4.0, unitName: 'marks' },
  'Varia VS4': { secondsPerStep: 3.5, unitName: 'marks' },
  'Sage The Smart Grinder Pro': { secondsPerStep: 2.0, unitName: 'steps' },
  'Sage The Dose Control Pro': { secondsPerStep: 2.0, unitName: 'steps' },
  'Fellow Opus Conical': { secondsPerStep: 2.5, unitName: 'micro-notches' },
  'Baratza Sette 270 / 270Wi': { secondsPerStep: 2.0, unitName: 'macro/micro steps' },
  'DF64 Gen 2 (Single Dose)': { secondsPerStep: 2.0, unitName: 'collar ticks' },
  'Niche Zero (Conical)': { secondsPerStep: 1.5, unitName: 'calibration marks' },
  'Timemore Sculptor 064S / 078S': { secondsPerStep: 2.5, unitName: 'stepless marks' },
  'Wilfa Uniform WSFBS-100B': { secondsPerStep: 2.5, unitName: 'steps' },
  'Lelit Fred PL043MM': { secondsPerStep: 8.0, unitName: 'worm screw turns' },
  '1Zpresso J-Ultra / J-Max': { secondsPerStep: 3.0, unitName: 'clicks' },
  'Comandante C40 MK4': { secondsPerStep: 3.5, unitName: 'clicks' },
  'Mahlkönig X54 Allround Home': { secondsPerStep: 3.0, unitName: 'dial marks' },
  'Varia VS6 Commercial Grade': { secondsPerStep: 3.0, unitName: 'micrometric ticks' },
  'Timemore Bricks 01S Electric': { secondsPerStep: 2.5, unitName: 'notches' },
  'Timemore Whirly 01S Portable': { secondsPerStep: 3.0, unitName: 'clicks' },
  'DeLonghi KG79': { secondsPerStep: 2.0, unitName: 'steps' },
};

export interface DialInAdvice {
  summary: string;
  grindAdvice: 'finer' | 'coarser' | 'keep';
  grindDeltaSteps: number;
  grinderSpecificAdvice?: string;
  puckAdvice?: string;
  preInfusionAdvice?: string;
  roastAdvice?: string;
  rationale: string;
}

/**
 * Generates barista tech dial-in advice from flow curve, pre-infusion, user taste, roast level, and specific grinder calibration
 */
export function generateDialInAdvice(
  totalTimeSeconds: number,
  doseGrams: number,
  yieldGrams: number,
  channeling: boolean | ChannelingEvent,
  taste?: TasteRating,
  preInfusionSeconds?: number,
  roastLevel?: RoastLevel,
  grinderName?: string,
  currentGrindSetting?: string
): DialInAdvice {
  const isChanneling = typeof channeling === 'boolean' ? channeling : channeling.detected;
  const channelingEvent = typeof channeling === 'object' ? channeling : undefined;
  const ratio = doseGrams > 0 ? (yieldGrams / doseGrams).toFixed(1) : '2.0';

  // 1. Channeling takes primary priority because grinder adjustments are invalid if water channeled
  if (isChanneling) {
    const spikeInfo = channelingEvent?.timestampSeconds
      ? ` at ${channelingEvent.timestampSeconds}s (${channelingEvent.flowSpikeGps} g/s)`
      : '';
    return {
      summary: `Channeling Spike Detected${spikeInfo}`,
      grindAdvice: 'keep',
      grindDeltaSteps: 0,
      puckAdvice: 'Do not adjust grinder yet. Use WDT needles to break clumps, tamp level, and ensure uniform puck density.',
      rationale: `Water broke a high-velocity channel through the puck mid-shot. Adjusting the grind now will not fix channeling; focus on puck preparation first.`,
    };
  }

  // 2. Pre-infusion saturation check (choked puck vs. rushed water)
  let preAdvice: string | undefined;
  if (preInfusionSeconds !== undefined) {
    if (preInfusionSeconds > 10.0) {
      preAdvice = `First drip took ${preInfusionSeconds.toFixed(1)}s (very slow). Coffee puck is choking the pump.`;
    } else if (preInfusionSeconds < 3.0) {
      preAdvice = `First drip appeared at ${preInfusionSeconds.toFixed(1)}s (too fast). Water broke through before pressure built up.`;
    }
  }

  // Roast-specific tailored advice
  let roastNotice: string | undefined;
  if (roastLevel === 'light') {
    roastNotice = 'Light roasts require higher extraction energy. If acidic, extend ratio to 1:2.5 or lengthen pre-infusion.';
  } else if (roastLevel === 'dark') {
    roastNotice = 'Dark roasts extract rapidly. Pull as a Ristretto (1:1.5 - 1:1.8) with short contact time to avoid bitterness.';
  }

  // Calculate specific grinder step adjustments
  const targetTime = 28.0;
  const timeDifference = targetTime - totalTimeSeconds;
  let grinderAdvice: string | undefined;

  const matchedGrinderKey = grinderName
    ? Object.keys(GRINDER_CALIBRATIONS).find((k) => grinderName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(grinderName.toLowerCase()))
    : undefined;
  const calibration = matchedGrinderKey ? GRINDER_CALIBRATIONS[matchedGrinderKey] : undefined;

  if (calibration && Math.abs(timeDifference) >= 2.0 && (taste === 'sour' || taste === 'bitter' || totalTimeSeconds < 24 || totalTimeSeconds > 32)) {
    const rawSteps = Math.abs(timeDifference) / calibration.secondsPerStep;
    const roundedSteps = Math.max(0.5, Math.round(rawSteps * 2) / 2);
    const direction = timeDifference > 0 ? 'finer' : 'coarser';

    const currentNum = currentGrindSetting ? parseFloat(currentGrindSetting) : NaN;
    let targetSettingText = '';
    if (!isNaN(currentNum)) {
      const nextSetting = direction === 'finer' ? Math.max(0, currentNum - roundedSteps) : currentNum + roundedSteps;
      targetSettingText = ` (e.g. from ${currentNum} to ${nextSetting.toFixed(1).replace('.0', '')})`;
    }

    grinderAdvice = `On your ${matchedGrinderKey || grinderName}: Adjust ${roundedSteps} ${calibration.unitName} ${direction}${targetSettingText} to compensate for ~${Math.abs(Math.round(timeDifference))}s flow variance.`;
  }

  if (taste === 'sour' || totalTimeSeconds < 24) {
    const extra = roastLevel === 'light'
      ? ' For this Light Roast, consider pushing ratio to 1:2.5 (lungo) to extract ripe fruit sweetness.'
      : '';
    return {
      summary: 'Under-extracted (Fast Flow / Sour)',
      grindAdvice: 'finer',
      grindDeltaSteps: 0.5,
      grinderSpecificAdvice: grinderAdvice,
      puckAdvice: 'Ensure even distribution before tamping.',
      preInfusionAdvice: preAdvice,
      roastAdvice: roastNotice,
      rationale: `The shot ran fast (${totalTimeSeconds.toFixed(1)}s for ${ratio}x ratio). Water rushed through too quickly.${extra} Grind finer to increase puck resistance.`,
    };
  }

  if (taste === 'bitter' || totalTimeSeconds > 34) {
    const extra = roastLevel === 'dark'
      ? ' For this Dark Roast, stop the shot earlier as a Ristretto (1:1.5 ratio) to avoid bitter tannins.'
      : '';
    return {
      summary: 'Over-extracted (Slow Flow / Bitter)',
      grindAdvice: 'coarser',
      grindDeltaSteps: 0.5,
      grinderSpecificAdvice: grinderAdvice,
      puckAdvice: 'Verify puck headspace and basket capacity.',
      preInfusionAdvice: preAdvice,
      roastAdvice: roastNotice,
      rationale: `The shot choked or dragged on (${totalTimeSeconds.toFixed(1)}s). The puck was too dense, extracting bitter tannins.${extra} Grind coarser for a smoother flow.`,
    };
  }

  if (taste === 'watery') {
    return {
      summary: 'Low Body / Diluted Concentration',
      grindAdvice: 'finer',
      grindDeltaSteps: 0.5,
      grinderSpecificAdvice: grinderAdvice,
      puckAdvice: 'Increase dry dose by 0.5g while keeping target yield constant.',
      preInfusionAdvice: preAdvice,
      roastAdvice: roastNotice,
      rationale: `Extraction lacked body and crema thickness. Grind slightly finer or increase dry dose to boost brew concentration.`,
    };
  }

  return {
    summary: 'Balanced & Sweet (Dial-In Sweet Spot)',
    grindAdvice: 'keep',
    grindDeltaSteps: 0,
    preInfusionAdvice: preAdvice || `First drip at ${preInfusionSeconds ? preInfusionSeconds.toFixed(1) + 's' : 'optimal time'}.`,
    roastAdvice: roastNotice,
    rationale: `Superb extraction! ${yieldGrams.toFixed(1)}g yield in ${totalTimeSeconds.toFixed(1)}s with optimal flow rate in the Golden Zone (1.2–1.6 g/s).`,
  };
}

/**
 * Converts Celsius to Fahrenheit rounded to nearest integer
 */
export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

/**
 * Converts Fahrenheit to Celsius rounded to nearest integer
 */
export function fahrenheitToCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}

/**
 * Formats brew temperature with unit suffix
 */
export function formatTemperature(tempC: number, unit: TempUnit = 'C'): string {
  if (unit === 'F') {
    return `${celsiusToFahrenheit(tempC)}°F`;
  }
  return `${tempC}°C`;
}

/**
 * Specialty Coffee recommended brew temperature based on roast level
 * - Light: 94°C (201°F) -> High thermal energy required to dissolve dense cell structure and fruity acids
 * - Medium: 93°C (199°F) -> The specialty golden standard for balance and caramelized sweetness
 * - Med-Dark: 91°C (196°F) -> Slightly cooler water to curb bitter ashiness
 * - Dark: 89°C (192°F) -> Low temperature preserves sweet notes and avoids burning roasty oils
 */
export function getRecommendedBrewTemp(roastLevel?: RoastLevel): number {
  switch (roastLevel) {
    case 'light':
      return 94;
    case 'medium':
      return 93;
    case 'medium-dark':
      return 91;
    case 'dark':
      return 89;
    default:
      return 93;
  }
}

export type FreshnessPhase = 'degassing' | 'peak' | 'past_peak' | 'stale';

export interface BeanFreshnessStatus {
  daysOffRoast: number;
  daysOpened?: number;
  phase: FreshnessPhase;
  labelKey: string;
  badgeClasses: string;
  dotColor: string;
  degasDaysMin: number;
  degasDaysMax: number;
  peakDaysMax: number;
  summary: string;
  baristaTip: string;
  isOpenedWarning: boolean;
}

/**
 * Calculates specialty coffee freshness, CO₂ degassing phase, and peak extraction window.
 * - Light roasts require 7-10 days of degassing due to dense cell structures.
 * - Dark roasts degas faster (3-5 days) but oxidize quicker once unsealed.
 */
export function calculateBeanFreshness(
  roastDateStr: string,
  roastLevel: RoastLevel = 'medium',
  dateOpenedStr?: string
): BeanFreshnessStatus {
  const roastTime = new Date(roastDateStr).getTime();
  const now = Date.now();
  const daysOffRoast = isNaN(roastTime)
    ? 0
    : Math.max(0, Math.floor((now - roastTime) / (1000 * 60 * 60 * 24)));

  let daysOpened: number | undefined = undefined;
  if (dateOpenedStr) {
    const openedTime = new Date(dateOpenedStr).getTime();
    if (!isNaN(openedTime)) {
      daysOpened = Math.max(0, Math.floor((now - openedTime) / (1000 * 60 * 60 * 24)));
    }
  }

  let degasDaysMin = 5;
  let degasDaysMax = 8;
  let peakDaysMax = 30;

  if (roastLevel === 'light') {
    degasDaysMin = 7;
    degasDaysMax = 10;
    peakDaysMax = 35;
  } else if (roastLevel === 'medium') {
    degasDaysMin = 5;
    degasDaysMax = 7;
    peakDaysMax = 28;
  } else if (roastLevel === 'medium-dark') {
    degasDaysMin = 4;
    degasDaysMax = 6;
    peakDaysMax = 25;
  } else if (roastLevel === 'dark') {
    degasDaysMin = 3;
    degasDaysMax = 5;
    peakDaysMax = 21;
  }

  const isOpenedWarning = daysOpened !== undefined && daysOpened > 21;

  const isFuture = !isNaN(roastTime) && roastTime > now;

  let phase: FreshnessPhase = 'peak';
  let labelKey = 'freshness.peak';
  let badgeClasses = 'bg-[#72806B]/15 text-[#54624F] border-[#72806B]/30';
  let dotColor = 'bg-[#72806B]';
  let summary = 'Optimal Flavor Peak';
  let baristaTip = 'Peak flavor clarity and caramelized sugars. Optimal stability for espresso.';

  if (isFuture) {
    phase = 'degassing';
    labelKey = 'freshness.degassing';
    badgeClasses = 'bg-red-500/15 text-red-900 border-red-500/40';
    dotColor = 'bg-red-600';
    summary = 'Date in future';
    baristaTip = 'Roast date is set in the future. Please verify date stamp on bag.';
  } else if (daysOffRoast < degasDaysMin) {
    phase = 'degassing';
    labelKey = 'freshness.degassing';
    badgeClasses = 'bg-amber-500/15 text-amber-900 border-amber-500/40';
    dotColor = 'bg-amber-600 animate-pulse';
    summary = 'Actively Degassing (CO₂)';
    const remaining = Math.max(1, degasDaysMin - daysOffRoast);
    baristaTip = `High internal carbon dioxide causes bubbly crema and channeling. Rest for ${remaining} more ${remaining === 1 ? 'day' : 'days'} for sweetest extraction.`;
  } else if (daysOffRoast <= peakDaysMax) {
    phase = 'peak';
    labelKey = 'freshness.peak';
    badgeClasses = 'bg-[#72806B]/15 text-[#54624F] border-[#72806B]/30';
    dotColor = 'bg-[#72806B]';
    summary = 'Optimal Flavor Peak';
    baristaTip = 'The golden window! Aromatics are stable and crema elasticity is at its peak.';
  } else if (daysOffRoast <= peakDaysMax + 25) {
    phase = 'past_peak';
    labelKey = 'freshness.past_peak';
    badgeClasses = 'bg-stone-500/15 text-stone-700 border-stone-400/40';
    dotColor = 'bg-stone-500';
    summary = 'Past Peak (Mellowing)';
    baristaTip = 'Volatile top notes have softened. Grind slightly finer and increase brew temp by 1°C to boost extraction.';
  } else {
    phase = 'stale';
    labelKey = 'freshness.stale';
    badgeClasses = 'bg-neutral-500/15 text-neutral-600 border-neutral-400/40';
    dotColor = 'bg-neutral-400';
    summary = 'Aged / Oxidized';
    baristaTip = 'Coffee oils have oxidized. Crema will be thin and fast-flowing. Best paired with milk or pulled as a short Ristretto.';
  }

  return {
    daysOffRoast,
    daysOpened,
    phase,
    labelKey,
    badgeClasses,
    dotColor,
    degasDaysMin,
    degasDaysMax,
    peakDaysMax,
    summary,
    baristaTip,
    isOpenedWarning,
  };
}

/**
 * Calculates dynamically scaled target extraction time based on method, dose, yield, and ratio.
 * 
 * Espresso Fluid Mechanics:
 * - Baseline: 18.0g dose with 1:2.0 ratio (36.0g yield) = 28s (approx 5.5s pre-infusion + 22.5s flow).
 * - Puck resistance scales with puck height / dose (D / D_0)^0.30.
 * - Flow time scales proportionally with target liquid yield (Y / Y_0).
 * - Single baskets (7-10g dose) target ~18-22s.
 * - User 17g basket with 34g yield targets ~26s.
 * - Ristretto profiles (ratio < 1.8) target ~20-24s.
 * - Lungo / Allongé profiles (ratio > 2.4) target ~32-38s.
 */
export function calculateTargetExtractionTime(
  doseGrams: number,
  targetYieldGrams: number,
  method: 'espresso' | 'pour_over' = 'espresso',
  baseExpectedSeconds: number = 28
): number {
  if (method === 'pour_over') {
    const bloomSecs = 45;
    const brewWater = targetYieldGrams || (doseGrams * 16.6);
    const flowSecs = Math.max(30, (brewWater - (doseGrams * 3)) / 2.2);
    return Math.round(bloomSecs + flowSecs);
  }

  // Espresso fluid mechanics
  const baselineDose = 18.0;
  const baselineYield = 36.0;
  const baselineFlowSecs = Math.max(15, baseExpectedSeconds - 5.5);
  const preInfusionSecs = 5.5;

  const dose = Math.max(6.0, doseGrams || baselineDose);
  const yieldGrams = Math.max(10.0, targetYieldGrams || (dose * 2.0));
  
  // Hydraulic resistance exponent for coffee bed height
  const resistanceFactor = Math.pow(dose / baselineDose, 0.30);
  
  // Target flow rate for standard extraction
  const targetFlowRate = baselineYield / baselineFlowSecs;
  
  // Flow time needed to accumulate target yield through puck
  const flowTime = (yieldGrams / targetFlowRate) * resistanceFactor;
  
  const totalTarget = Math.round(preInfusionSecs + flowTime);
  return Math.max(16, Math.min(55, totalTarget));
}



