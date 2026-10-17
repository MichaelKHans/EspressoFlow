import type {
  ShotDataPoint,
  TasteRating,
  ChannelingEvent,
  RoastLevel,
  RatioStyle,
  TempUnit,
  FlowProfileType,
  ExtractionTelemetrySummary,
} from '../types/espresso';

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
 * 1. Staircase-Aware Smoothed Flow Rate (Eliminates 3Hz Scale vs 10Hz Sampling Aliasing)
 * Instead of differentiating duplicate sample-and-hold points over a rigid window,
 * this extracts distinct scale weight transitions within the window and computes an
 * Ordinary Least Squares (OLS) slope anchored to actual display updates.
 */
export function calculateSmoothedFlowRate(
  points: ShotDataPoint[],
  windowSizeSeconds: number = 1.6,
  maxAllowedRateGps: number = 6.0
): number {
  if (points.length < 2) return 0;

  const lastPoint = points[points.length - 1];

  // Ignore pre-tare cup weight plateaus (if weight hasn't moved for > 1.4s, flow is 0.0 g/s)
  let lastChangeIdx = points.length - 1;
  while (
    lastChangeIdx > 0 &&
    Math.abs(points[lastChangeIdx].weightGrams - points[lastChangeIdx - 1].weightGrams) < 0.05
  ) {
    lastChangeIdx--;
  }
  const timeSinceLastStep = lastPoint.timeSeconds - points[lastChangeIdx].timeSeconds;
  if (timeSinceLastStep > 1.4) return 0.0;

  // Collect only distinct scale transition points (plus window boundaries) over windowSizeSeconds
  // A 1.6s window spans ~5 physical 3Hz scale updates, suppressing staircase sawtooth.
  const cutoffTime = Math.max(0, lastPoint.timeSeconds - windowSizeSeconds);
  const transitions: ShotDataPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.timeSeconds < cutoffTime) continue;

    // Reset transition history if a mid-shot tare occurred (weight dropped to ~0g)
    if (
      transitions.length > 0 &&
      pt.weightGrams <= 0.4 &&
      transitions[transitions.length - 1].weightGrams > 5.0
    ) {
      transitions.length = 0;
    }

    if (
      transitions.length === 0 ||
      Math.abs(pt.weightGrams - transitions[transitions.length - 1].weightGrams) >= 0.09 ||
      i === points.length - 1
    ) {
      transitions.push(pt);
    }
  }

  if (transitions.length < 2) return 0.0;

  // Ordinary Least Squares (OLS) slope dW/dt across the window's scale transitions
  let sumT = 0;
  let sumW = 0;
  const n = transitions.length;
  const t0 = transitions[0].timeSeconds;

  for (let i = 0; i < n; i++) {
    sumT += transitions[i].timeSeconds - t0;
    sumW += transitions[i].weightGrams;
  }

  const meanT = sumT / n;
  const meanW = sumW / n;
  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    const dt = transitions[i].timeSeconds - t0 - meanT;
    const dw = transitions[i].weightGrams - meanW;
    num += dt * dw;
    den += dt * dt;
  }

  if (den <= 0.04) return 0.0;
  const rawRate = num / den;
  if (rawRate <= 0.05) return 0.0;

  // Blend with previous point's flowRateGps (EMA alpha = 0.45) to remove residual 0.1g step jitter
  const prevFlow = points[points.length - 2]?.flowRateGps || rawRate;
  const smoothed = prevFlow > 0.1 ? prevFlow * 0.55 + rawRate * 0.45 : rawRate;

  const clamped = Math.min(maxAllowedRateGps, Math.max(0, smoothed));
  return Math.round(clamped * 10) / 10;
}

/**
 * 2. Phase-Isolated Extraction & Puck Integrity Analyzer
 * Automatically detects the true First Drip (even after mid-shot tares),
 * skips the 3.5s stream-coalescence onset window, and evaluates steady-state flow dynamics.
 */
export function analyzeExtractionDynamics(
  points: ShotDataPoint[]
): ExtractionTelemetrySummary {
  if (points.length < 8) {
    return {
      preInfusionSeconds: 0,
      activeFlowSeconds: 0,
      finalYieldGrams: points[points.length - 1]?.weightGrams || 0,
      steadyFlowGps: 0,
      peakMidShotFlowGps: 0,
      flowSlopeGps2: 0,
      flowStabilityPercent: 100,
      flowProfile: 'flat',
      puckAnomaly: { detected: false, severity: 'none' },
    };
  }

  // Locate the last Tare-Zero baseline (handles cases where user tared cup mid-shot at 16s!)
  let tareBaselineIdx = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].weightGrams <= 0.3 && points[i - 1].weightGrams > 5.0) {
      tareBaselineIdx = i;
    }
  }

  // Locate true First Drip (first sustained weight >= 0.4g after tare baseline)
  let firstDripIdx = tareBaselineIdx;
  for (let i = tareBaselineIdx; i < points.length; i++) {
    if (points[i].weightGrams >= 0.4) {
      firstDripIdx = i;
      break;
    }
  }

  const firstDripTime = points[firstDripIdx].timeSeconds;
  const lastTime = points[points.length - 1].timeSeconds;
  const finalYield = points[points.length - 1].weightGrams;

  // Isolate Phase 3: Main Extraction Phase
  // Strictly starts >= 3.5s AFTER first drip AND after >= 4.5g of liquid is in the cup
  // (completely immune to the 20.1s onset surge in Record_2026-10-16!)
  const mainPhasePoints = points.filter(
    (p, idx) =>
      idx > firstDripIdx &&
      p.timeSeconds >= firstDripTime + 3.5 &&
      p.weightGrams >= 4.5 &&
      p.weightGrams <= finalYield - 0.5 &&
      p.flowRateGps >= 0.25
  );

  const activeFlowSeconds = Math.max(0, Math.round((lastTime - firstDripTime) * 10) / 10);

  if (mainPhasePoints.length < 5) {
    return {
      preInfusionSeconds: firstDripTime,
      activeFlowSeconds,
      finalYieldGrams: finalYield,
      steadyFlowGps: activeFlowSeconds > 0 ? +(finalYield / activeFlowSeconds).toFixed(2) : 0,
      peakMidShotFlowGps: 0,
      flowSlopeGps2: 0,
      flowStabilityPercent: 95,
      flowProfile: 'flat',
      puckAnomaly: { detected: false, severity: 'none' },
    };
  }

  // Compute Steady-State Flow Rate (Median of Phase 3) & MAD Stability Index
  const sortedFlows = mainPhasePoints.map((p) => p.flowRateGps).sort((a, b) => a - b);
  const steadyFlowGps = sortedFlows[Math.floor(sortedFlows.length / 2)];
  const absDevs = sortedFlows.map((f) => Math.abs(f - steadyFlowGps)).sort((a, b) => a - b);
  const madFlow = absDevs[Math.floor(absDevs.length / 2)];
  const robustCv = steadyFlowGps > 0.2 ? (1.4826 * madFlow) / steadyFlowGps : 0;
  const flowStabilityPercent = Math.round(Math.max(0, Math.min(100, (1 - robustCv) * 100)));

  // Linear Regression of Flow Rate vs. Time during Phase 3 (Slope in g/s^2)
  const tStart = mainPhasePoints[0].timeSeconds;
  let sumT = 0;
  let sumF = 0;
  const n = mainPhasePoints.length;
  for (let i = 0; i < n; i++) {
    sumT += mainPhasePoints[i].timeSeconds - tStart;
    sumF += mainPhasePoints[i].flowRateGps;
  }
  const meanT = sumT / n;
  const meanF = sumF / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dt = mainPhasePoints[i].timeSeconds - tStart - meanT;
    num += dt * (mainPhasePoints[i].flowRateGps - meanF);
    den += dt * dt;
  }
  const flowSlopeGps2 = den > 0.5 ? +(num / den).toFixed(3) : 0;

  // Classify Flow Profile
  let flowProfile: FlowProfileType = 'flat';
  if (steadyFlowGps >= 2.8) flowProfile = 'gushing';
  else if (steadyFlowGps <= 0.75) flowProfile = 'choked';
  else if (flowSlopeGps2 <= -0.015) flowProfile = 'declining';
  else if (flowSlopeGps2 >= 0.035) flowProfile = 'accelerating';

  // Sustained Mid-Shot Surge Detector (Replaces brittle 2-sample analyzeChanneling)
  // Requires a sustained 2.0-second mass gain (avg >= 3.5 g/s) AND >= 1.85x steadyFlowGps
  // strictly inside Phase 3 (after firstDripTime + 3.5s).
  let maxSustainedRate = 0;
  let surgeTime = 0;

  for (let i = 0; i < mainPhasePoints.length; i++) {
    const pStart = mainPhasePoints[i];
    for (let j = i + 4; j < mainPhasePoints.length; j++) {
      const pEnd = mainPhasePoints[j];
      const dt = pEnd.timeSeconds - pStart.timeSeconds;
      if (dt >= 2.0 && dt <= 2.8) {
        const dw = pEnd.weightGrams - pStart.weightGrams;
        const sustainedRate = dw / dt;
        if (sustainedRate > maxSustainedRate) {
          maxSustainedRate = sustainedRate;
          surgeTime = pEnd.timeSeconds;
        }
        break;
      }
    }
  }

  let puckAnomaly: ChannelingEvent = { detected: false, severity: 'none' };
  const surgeRatio = steadyFlowGps > 0.4 ? maxSustainedRate / steadyFlowGps : 1.0;

  if (maxSustainedRate >= 3.8 && surgeRatio >= 1.9) {
    puckAnomaly = {
      detected: true,
      severity: 'severe',
      timestampSeconds: Math.round(surgeTime * 10) / 10,
      flowSpikeGps: +maxSustainedRate.toFixed(1),
      reason: 'sustained_midshot_surge',
      message: `Mid-shot flow surge (${maxSustainedRate.toFixed(1)} g/s at ${surgeTime.toFixed(1)}s).`,
    };
  } else if (flowSlopeGps2 >= 0.055 && maxSustainedRate >= 3.0) {
    puckAnomaly = {
      detected: true,
      severity: 'mild',
      timestampSeconds: Math.round(surgeTime * 10) / 10,
      flowSpikeGps: +maxSustainedRate.toFixed(1),
      reason: 'rapid_puck_erosion',
      message: `Puck erosion / accelerating flow detected (${maxSustainedRate.toFixed(1)} g/s at ${surgeTime.toFixed(1)}s).`,
    };
  }

  return {
    preInfusionSeconds: Math.round(firstDripTime * 10) / 10,
    activeFlowSeconds,
    finalYieldGrams: finalYield,
    steadyFlowGps: +steadyFlowGps.toFixed(2),
    peakMidShotFlowGps: +maxSustainedRate.toFixed(1),
    flowSlopeGps2,
    flowStabilityPercent,
    flowProfile,
    puckAnomaly,
  };
}

/**
 * Backward compatible wrapper for existing callers of analyzeChanneling()
 */
export function analyzeChanneling(points: ShotDataPoint[]): ChannelingEvent {
  return analyzeExtractionDynamics(points).puckAnomaly;
}

/**
 * Backward compatible boolean detector
 */
export function detectChanneling(points: ShotDataPoint[]): boolean {
  return analyzeExtractionDynamics(points).puckAnomaly.detected;
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
  targetGrindSetting?: string;
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

  // 1. Informative Puck Anomaly Note (never blocks grinder dial advice!)
  let puckPrepAdvice: string | undefined;
  if (isChanneling) {
    const spikeInfo = channelingEvent?.timestampSeconds
      ? ` at ${channelingEvent.timestampSeconds}s (${channelingEvent.flowSpikeGps} g/s)`
      : '';
    puckPrepAdvice = `Mid-shot flow surge detected${spikeInfo}. Focus on thorough WDT needle distribution and flat, level tamping to prevent water bypass.`;
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

  let calculatedSteps = 0.5;
  let targetSettingStr: string | undefined;
  const currentNum = currentGrindSetting ? parseFloat(currentGrindSetting) : NaN;
  const isVarianceSignificant = Math.abs(timeDifference) >= 2.0 && (taste === 'sour' || taste === 'bitter' || totalTimeSeconds < 24 || totalTimeSeconds > 32);

  if (isVarianceSignificant) {
    const secondsPerStep = calibration?.secondsPerStep || 2.5;
    const rawSteps = Math.abs(timeDifference) / secondsPerStep;
    const roundedSteps = Math.max(0.5, Math.round(rawSteps * 2) / 2);
    calculatedSteps = roundedSteps;
    const direction = timeDifference > 0 ? 'finer' : 'coarser';

    if (!isNaN(currentNum)) {
      const nextSetting = direction === 'finer' ? Math.max(0, currentNum - roundedSteps) : currentNum + roundedSteps;
      targetSettingStr = nextSetting.toFixed(1).replace('.0', '');
    }

    const unitName = calibration?.unitName || 'steps';
    const targetSettingText = targetSettingStr ? ` (e.g. from ${currentNum} to ${targetSettingStr})` : '';
    grinderAdvice = `On your ${matchedGrinderKey || grinderName || 'grinder'}: Adjust ${roundedSteps} ${unitName} ${direction}${targetSettingText} to compensate for ~${Math.abs(Math.round(timeDifference))}s flow variance.`;
  }

  if (taste === 'sour' || totalTimeSeconds < 24) {
    const extra = roastLevel === 'light'
      ? ' For this Light Roast, consider pushing ratio to 1:2.5 (lungo) to extract ripe fruit sweetness.'
      : '';
    return {
      summary: 'Under-extracted (Fast Flow / Sour)',
      grindAdvice: 'finer',
      grindDeltaSteps: calculatedSteps,
      targetGrindSetting: targetSettingStr,
      grinderSpecificAdvice: grinderAdvice,
      puckAdvice: puckPrepAdvice || 'Ensure even distribution before tamping.',
      preInfusionAdvice: preAdvice,
      roastAdvice: roastNotice,
      rationale: `The shot ran fast (${totalTimeSeconds.toFixed(1)}s for ${ratio}x ratio). Water rushed through too quickly.${extra} Grind finer to increase puck resistance.`,
    };
  }

  if (taste === 'bitter' || totalTimeSeconds > 32) {
    const extra = roastLevel === 'dark'
      ? ' For this Dark Roast, stop the shot earlier as a Ristretto (1:1.5 ratio) to avoid bitter tannins.'
      : '';
    return {
      summary: 'Over-extracted (Slow Flow / Bitter)',
      grindAdvice: 'coarser',
      grindDeltaSteps: calculatedSteps,
      targetGrindSetting: targetSettingStr,
      grinderSpecificAdvice: grinderAdvice,
      puckAdvice: puckPrepAdvice || 'Verify puck headspace and basket capacity.',
      preInfusionAdvice: preAdvice,
      roastAdvice: roastNotice,
      rationale: `The shot choked or dragged on (${totalTimeSeconds.toFixed(1)}s). The puck was too dense, extracting bitter tannins.${extra} Grind coarser for a smoother flow.`,
    };
  }

  if (taste === 'watery') {
    return {
      summary: 'Low Body / Diluted Concentration',
      grindAdvice: 'finer',
      grindDeltaSteps: calculatedSteps,
      targetGrindSetting: targetSettingStr,
      grinderSpecificAdvice: grinderAdvice,
      puckAdvice: puckPrepAdvice || 'Increase dry dose by 0.5g while keeping target yield constant.',
      preInfusionAdvice: preAdvice,
      roastAdvice: roastNotice,
      rationale: `Extraction lacked body and crema thickness. Grind slightly finer or increase dry dose to boost brew concentration.`,
    };
  }

  return {
    summary: puckPrepAdvice ? 'Puck Surge Detected — Check Prep' : 'Balanced & Sweet (Dial-In Sweet Spot)',
    grindAdvice: 'keep',
    grindDeltaSteps: 0,
    puckAdvice: puckPrepAdvice,
    preInfusionAdvice: preAdvice || `First drip at ${preInfusionSeconds ? preInfusionSeconds.toFixed(1) + 's' : 'optimal time'}.`,
    roastAdvice: roastNotice,
    rationale: puckPrepAdvice
      ? `Ekstraktionen var tidsmæssigt fin (${totalTimeSeconds.toFixed(1)}s for ${yieldGrams.toFixed(1)}g), men der opstod et flow-spring undervejs. Behold kværnindstillingen og fokusér på puck preparation (WDT).`
      : `Superb extraction! ${yieldGrams.toFixed(1)}g yield in ${totalTimeSeconds.toFixed(1)}s with optimal flow rate in the Golden Zone (1.2–1.6 g/s).`,
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



