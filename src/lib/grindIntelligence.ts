/**
 * Flowbean Universal Adaptive Grind Intelligence (On-Device AI Engine)
 *
 * Mathematically grounded, 100% on-device learning engine for espresso grinders.
 * - Normalized Contact Time (T_norm) based on hydraulic resistance
 * - 5 Sanity Gates (Anti-Channeling, Physical Monotonicity, Context & Clamping)
 * - Bayesian Prior + Exponentially Weighted Moving Average (EWMA)
 * - Roast Level Shift Matrix & Logarithmic Degas Aging Compensation
 *
 * Zero AI tokens, zero network requests, zero cloud costs.
 */

import type { RoastLevel, ShotRecord } from '../types/espresso';
import { GRINDER_CALIBRATIONS } from './espressoMath';

export const GRIND_INTELLIGENCE_STORAGE_KEY = 'flowbean_grind_intelligence_v1';
export const BEAN_ANCHORS_STORAGE_KEY = 'flowbean_bean_anchors_v1';

export interface GrinderLearnedProfile {
  grinderId: string;
  factorySecondsPerUnit: number;
  empiricalSecondsPerUnit: number;
  effectiveSecondsPerUnit: number;
  confidenceScore: number; // 0.00 to 1.00
  validTransitionsCount: number;
  roastOffsets: Record<RoastLevel, number>; // Seconds resistance offset relative to 'medium' = 0.0
  agingDecayCoefficient: number; // Gamma factor (~0.85 - 1.15)
  lastUpdatedIso: string;
}

export interface BeanCalibrationAnchor {
  beanId: string;
  beanName: string;
  grinderId: string;
  roastLevel: RoastLevel;
  anchorSetting: number;
  anchorDaysOffRoast: number;
  anchorNormalizedTime: number;
  anchorDoseGrams: number;
  anchorTimestamp: string;
}

export interface ShotTransitionEvaluation {
  accepted: boolean;
  gateFailures: string[];
  deltaSetting: number;
  deltaTimeNorm: number;
  observedSlope: number;
  clampedSlope: number;
}

export interface PredictedGrindAdjustment {
  baseSetting: number;
  recommendedSetting: number;
  formattedSetting: string;
  stepDelta: number;
  direction: 'finer' | 'coarser' | 'keep';
  confidenceScore: number;
  reason: 'golden_anchor' | 'roast_shift' | 'degas_drift' | 'dial_in_adjustment' | 'baseline';
  explanation: string;
  details: {
    roastOffsetSteps: number;
    agingOffsetSteps: number;
    dialInOffsetSteps: number;
    effectiveSecondsPerUnit: number;
  };
}

/**
 * Default roast resistance offsets in equivalent extraction seconds (relative to 'medium' = 0.0)
 * - Light roasts have dense cell structures and lower soluble CO2 -> require finer grind (~ -4.5s)
 * - Dark roasts are highly porous and soluble -> require coarser grind (~ +7.0s)
 */
export const DEFAULT_ROAST_OFFSETS: Record<RoastLevel, number> = {
  light: -4.5,
  medium: 0.0,
  'medium-dark': 3.5,
  dark: 7.0,
};

/**
 * Normalizes shot extraction time to a standardized 1:2 extraction ratio and 18.0g reference dose.
 * Isolates grinder hydraulic resistance from yield cutoff variations or dose differences.
 *
 * Formula: T_norm = (T_pre + (2.0 * Dose) / Q_flow) * (18.0 / Dose)^0.30
 */
export function calculateNormalizedShotTime(shot: ShotRecord): number {
  const dose = shot.doseGrams > 0 ? shot.doseGrams : 18.0;
  const preInfusion = shot.preInfusionSeconds || 0;
  const flowTime = Math.max(1.0, shot.totalTimeSeconds - preInfusion);
  const yieldGrams = shot.actualYieldGrams > 0 ? shot.actualYieldGrams : dose * 2.0;

  // Average flow rate during active liquid extraction (clamped to realistic physics)
  const avgFlow = Math.max(0.3, Math.min(6.0, yieldGrams / flowTime));

  // Normalized flow time for an exact 1:2 ratio (2 * dose)
  const normalizedFlowTime = (2.0 * dose) / avgFlow;

  // Hydraulic bed height correction based on Ergun/Darcy porous media exponent (~0.30)
  const bedHeightFactor = Math.pow(18.0 / dose, 0.30);

  const tNorm = (preInfusion + normalizedFlowTime) * bedHeightFactor;
  return Math.round(tNorm * 10) / 10;
}

/**
 * Resolves baseline seconds-per-step for any grinder name
 */
export function getFactorySecondsPerStep(grinderName?: string): number {
  if (!grinderName) return 2.5;
  const matchedKey = Object.keys(GRINDER_CALIBRATIONS).find(
    (k) => grinderName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(grinderName.toLowerCase())
  );
  return matchedKey ? GRINDER_CALIBRATIONS[matchedKey].secondsPerStep : 2.5;
}

/**
 * Creates a pristine default learned profile for a grinder
 */
export function createDefaultGrinderProfile(grinderId: string): GrinderLearnedProfile {
  const factorySeconds = getFactorySecondsPerStep(grinderId);
  return {
    grinderId,
    factorySecondsPerUnit: factorySeconds,
    empiricalSecondsPerUnit: factorySeconds,
    effectiveSecondsPerUnit: factorySeconds,
    confidenceScore: 0.0,
    validTransitionsCount: 0,
    roastOffsets: { ...DEFAULT_ROAST_OFFSETS },
    agingDecayCoefficient: 0.95,
    lastUpdatedIso: new Date().toISOString(),
  };
}

/**
 * The 5 Sanity Gates: Evaluates whether a consecutive pair of shots (S_prev -> S_curr)
 * is physically valid for machine learning, rejecting channeling, human prep noise, and outliers.
 */
export function evaluateShotTransitionForLearning(
  prevShot: ShotRecord,
  currShot: ShotRecord,
  factorySecondsPerUnit: number
): ShotTransitionEvaluation {
  const failures: string[] = [];

  const prevSettingNum = parseFloat(prevShot.grindSetting);
  const currSettingNum = parseFloat(currShot.grindSetting);

  if (isNaN(prevSettingNum) || isNaN(currSettingNum)) {
    return {
      accepted: false,
      gateFailures: ['invalid_numeric_settings'],
      deltaSetting: 0,
      deltaTimeNorm: 0,
      observedSlope: 0,
      clampedSlope: factorySecondsPerUnit,
    };
  }

  const deltaSetting = currSettingNum - prevSettingNum;
  const prevTNorm = calculateNormalizedShotTime(prevShot);
  const currTNorm = calculateNormalizedShotTime(currShot);
  const deltaTimeNorm = currTNorm - prevTNorm;

  // Gate 1: Anti-Channeling Shield
  const prevChanneling = Boolean(prevShot.channelingDetected || (prevShot.channeling && prevShot.channeling.detected));
  const currChanneling = Boolean(currShot.channelingDetected || (currShot.channeling && currShot.channeling.detected));
  const prevSpike = (prevShot.channeling && prevShot.channeling.flowSpikeGps) || prevShot.peakFlowGps || 0;
  const currSpike = (currShot.channeling && currShot.channeling.flowSpikeGps) || currShot.peakFlowGps || 0;

  if (prevChanneling || currChanneling || prevSpike > 2.5 || currSpike > 2.5) {
    failures.push('gate_1_channeling_detected');
  }

  // Gate 2: Physical Monotonicity (Grinding finer must increase resistance; grinding coarser must decrease)
  if (Math.abs(deltaSetting) >= 0.5) {
    if (deltaSetting < 0 && deltaTimeNorm < 0) {
      // Ground finer, but shot ran faster -> micro-channeling / puck crack
      failures.push('gate_2_inverted_monotonicity_finer_ran_faster');
    } else if (deltaSetting > 0 && deltaTimeNorm > 0) {
      // Ground coarser, but shot ran slower -> tamp/dose anomaly
      failures.push('gate_2_inverted_monotonicity_coarser_ran_slower');
    }
  }

  // Gate 3: Context & Time Window
  const sameCoffee =
    !prevShot.coffeeName || !currShot.coffeeName || prevShot.coffeeName.toLowerCase() === currShot.coffeeName.toLowerCase();
  const sameGrinder =
    !prevShot.grinderName || !currShot.grinderName || prevShot.grinderName.toLowerCase() === currShot.grinderName.toLowerCase();
  const doseDiff = Math.abs((currShot.doseGrams || 18) - (prevShot.doseGrams || 18));
  const prevTimeMs = new Date(prevShot.timestamp).getTime();
  const currTimeMs = new Date(currShot.timestamp).getTime();
  const timeDiffHours = !isNaN(prevTimeMs) && !isNaN(currTimeMs)
    ? Math.abs(currTimeMs - prevTimeMs) / (1000 * 60 * 60)
    : 0;

  if (!sameCoffee) failures.push('gate_3_different_coffee_beans');
  if (!sameGrinder) failures.push('gate_3_different_grinders');
  if (doseDiff > 1.2) failures.push('gate_3_dose_variance_too_high');
  if (timeDiffHours > 48) failures.push('gate_3_time_window_exceeded_48h');
  if (prevShot.method === 'pour_over' || currShot.method === 'pour_over') failures.push('gate_3_pourover_method_excluded');

  // Gate 4: Step Size Dead-Zone (Minimum 0.5 to avoid noise; maximum 6.0 to avoid brew style jumps)
  const absDeltaSetting = Math.abs(deltaSetting);
  if (absDeltaSetting < 0.45) {
    failures.push('gate_4_step_too_small_noise_zone');
  } else if (absDeltaSetting > 6.0) {
    failures.push('gate_4_step_too_large_jump');
  }

  // Gate 5: Outlier Clamping & Retention Dampening
  const rawSlope = absDeltaSetting > 0 ? Math.abs(deltaTimeNorm / deltaSetting) : factorySecondsPerUnit;
  const minAllowedSlope = 0.4 * factorySecondsPerUnit;
  const maxAllowedSlope = 2.5 * factorySecondsPerUnit;
  const clampedSlope = Math.max(minAllowedSlope, Math.min(maxAllowedSlope, rawSlope));

  if (rawSlope < 0.25 * factorySecondsPerUnit || rawSlope > 3.5 * factorySecondsPerUnit) {
    failures.push('gate_5_extreme_outlier_slope');
  }

  const accepted = failures.length === 0;

  return {
    accepted,
    gateFailures: failures,
    deltaSetting,
    deltaTimeNorm,
    observedSlope: Math.round(rawSlope * 100) / 100,
    clampedSlope: Math.round(clampedSlope * 100) / 100,
  };
}

/**
 * Updates a grinder's learned profile using Bayesian prior blend and EWMA smoothing
 */
export function updateGrinderLearnedProfile(
  profile: GrinderLearnedProfile,
  evaluation: ShotTransitionEvaluation
): GrinderLearnedProfile {
  if (!evaluation.accepted) {
    return profile;
  }

  const alpha = 0.30; // 30% weight to new valid observation, 70% to historical empiri
  const newEmpirical = profile.validTransitionsCount === 0
    ? evaluation.clampedSlope
    : profile.empiricalSecondsPerUnit * (1 - alpha) + evaluation.clampedSlope * alpha;

  const newCount = profile.validTransitionsCount + 1;

  // Bayesian prior weighting: Prior weight = 2.0
  // C = N / (N + 2.0) -> At N=2, C=50%; at N=6, C=75%
  const confidence = Math.min(1.0, Math.round((newCount / (newCount + 2.0)) * 100) / 100);
  const effective = (1 - confidence) * profile.factorySecondsPerUnit + confidence * newEmpirical;

  return {
    ...profile,
    empiricalSecondsPerUnit: Math.round(newEmpirical * 100) / 100,
    effectiveSecondsPerUnit: Math.round(effective * 100) / 100,
    confidenceScore: confidence,
    validTransitionsCount: newCount,
    lastUpdatedIso: new Date().toISOString(),
  };
}

/**
 * Predicts optimal grind setting considering:
 * 1. Base anchor setting (or grinder default)
 * 2. Roast level transition delta
 * 3. Logarithmic CO2 degassing drift
 */
export function predictOptimalGrindSetting(params: {
  grinderProfile: GrinderLearnedProfile;
  activeBean: {
    id: string;
    name: string;
    roastDate: string;
    roastLevel: RoastLevel;
    grindSetting?: string;
  };
  anchor?: BeanCalibrationAnchor;
  referenceAnchorForGrinder?: BeanCalibrationAnchor;
  currentSetting?: string;
}): PredictedGrindAdjustment {
  const { grinderProfile, activeBean, anchor, referenceAnchorForGrinder, currentSetting } = params;
  const kEff = Math.max(1.0, grinderProfile.effectiveSecondsPerUnit);

  const fallbackSettingNum = currentSetting
    ? parseFloat(currentSetting)
    : activeBean.grindSetting
    ? parseFloat(activeBean.grindSetting)
    : 15.0;

  // 1. Base Anchor Determination
  let baseSetting = fallbackSettingNum;
  let reason: PredictedGrindAdjustment['reason'] = 'baseline';
  let roastOffsetSteps = 0;
  let agingOffsetSteps = 0;
  let dialInOffsetSteps = 0;

  const now = Date.now();
  const roastTime = new Date(activeBean.roastDate).getTime();
  const daysOffRoastToday = isNaN(roastTime) ? 7 : Math.max(0, Math.floor((now - roastTime) / (1000 * 60 * 60 * 24)));

  if (anchor && anchor.beanId === activeBean.id) {
    // We already have a dialed-in anchor for this specific bean
    baseSetting = anchor.anchorSetting;
    reason = 'golden_anchor';

    // Check degassing drift since anchor was established
    const anchorDays = anchor.anchorDaysOffRoast || 5;
    const daysDelta = daysOffRoastToday - anchorDays;

    if (daysDelta >= 4) {
      // Significant degassing occurred -> puck resistance drops -> grind finer
      const gamma = activeBean.roastLevel === 'dark' ? 1.15 : 0.85;
      const ageRatio = Math.max(2, daysOffRoastToday) / Math.max(2, anchorDays);
      const rawAgingDelta = -gamma * (3.0 / kEff) * Math.log(ageRatio);

      // Round to nearest 0.5 step
      agingOffsetSteps = Math.round(rawAgingDelta * 2) / 2;
      if (agingOffsetSteps < 0) {
        reason = 'degas_drift';
      }
    }
  } else if (referenceAnchorForGrinder) {
    // New bean, but user has an anchor on another bean with this grinder
    baseSetting = referenceAnchorForGrinder.anchorSetting;
    reason = 'roast_shift';

    // Calculate roast level difference
    const refOffset = grinderProfile.roastOffsets[referenceAnchorForGrinder.roastLevel] || 0.0;
    const newOffset = grinderProfile.roastOffsets[activeBean.roastLevel] || 0.0;
    const timeDeltaSec = newOffset - refOffset; // e.g. Light (-4.5) - Medium (0) = -4.5s -> finer

    // Delta steps = timeDeltaSec / kEff
    roastOffsetSteps = Math.round((timeDeltaSec / kEff) * 2) / 2;

    // Check aging from day 7 baseline
    if (daysOffRoastToday >= 14) {
      const gamma = activeBean.roastLevel === 'dark' ? 1.15 : 0.85;
      const ageRatio = Math.max(2, daysOffRoastToday) / 7;
      const rawAgingDelta = -gamma * (3.0 / kEff) * Math.log(ageRatio);
      agingOffsetSteps = Math.round(rawAgingDelta * 2) / 2;
    }
  }

  const rawRecommended = baseSetting + roastOffsetSteps + agingOffsetSteps + dialInOffsetSteps;
  const recommendedSetting = Math.max(0.5, Math.round(rawRecommended * 2) / 2);
  const formattedSetting = recommendedSetting.toFixed(1).replace('.0', '');
  const stepDelta = Math.round((recommendedSetting - fallbackSettingNum) * 2) / 2;
  const direction: PredictedGrindAdjustment['direction'] =
    stepDelta < 0 ? 'finer' : stepDelta > 0 ? 'coarser' : 'keep';

  // Construct clear, calm explanation
  const parts: string[] = [`Base: ${baseSetting.toFixed(1).replace('.0', '')}`];
  if (roastOffsetSteps !== 0) {
    parts.push(`${activeBean.roastLevel} roast: ${roastOffsetSteps > 0 ? '+' : ''}${roastOffsetSteps}`);
  }
  if (agingOffsetSteps !== 0) {
    parts.push(`Day ${daysOffRoastToday} degas: ${agingOffsetSteps > 0 ? '+' : ''}${agingOffsetSteps}`);
  }
  const explanation = `${parts.join(' • ')} → Target: ${formattedSetting}`;

  return {
    baseSetting,
    recommendedSetting,
    formattedSetting,
    stepDelta,
    direction,
    confidenceScore: grinderProfile.confidenceScore,
    reason,
    explanation,
    details: {
      roastOffsetSteps,
      agingOffsetSteps,
      dialInOffsetSteps,
      effectiveSecondsPerUnit: kEff,
    },
  };
}
