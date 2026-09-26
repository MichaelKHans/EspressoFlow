import type { ShotDataPoint, TasteRating, ChannelingEvent } from '../types/espresso';

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

export interface DialInAdvice {
  summary: string;
  grindAdvice: 'finer' | 'coarser' | 'keep';
  grindDeltaSteps: number;
  puckAdvice?: string;
  preInfusionAdvice?: string;
  rationale: string;
}

/**
 * Generates barista tech dial-in advice from flow curve, pre-infusion, and user taste
 */
export function generateDialInAdvice(
  totalTimeSeconds: number,
  doseGrams: number,
  yieldGrams: number,
  channeling: boolean | ChannelingEvent,
  taste?: TasteRating,
  preInfusionSeconds?: number
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

  if (taste === 'sour' || totalTimeSeconds < 24) {
    return {
      summary: 'Under-extracted (Fast Flow / Sour)',
      grindAdvice: 'finer',
      grindDeltaSteps: 0.5,
      puckAdvice: 'Ensure even distribution before tamping.',
      preInfusionAdvice: preAdvice,
      rationale: `The shot ran fast (${totalTimeSeconds.toFixed(1)}s for ${ratio}x ratio). Water rushed through too quickly. Grind finer by 0.5 steps to increase puck resistance.`,
    };
  }

  if (taste === 'bitter' || totalTimeSeconds > 34) {
    return {
      summary: 'Over-extracted (Slow Flow / Bitter)',
      grindAdvice: 'coarser',
      grindDeltaSteps: 0.5,
      puckAdvice: 'Verify puck headspace and basket capacity.',
      preInfusionAdvice: preAdvice,
      rationale: `The shot choked or dragged on (${totalTimeSeconds.toFixed(1)}s). The puck was too dense, extracting bitter tannins. Grind coarser by 0.5 steps for a smoother flow.`,
    };
  }

  if (taste === 'watery') {
    return {
      summary: 'Low Body / Diluted Concentration',
      grindAdvice: 'finer',
      grindDeltaSteps: 0.5,
      puckAdvice: 'Increase dry dose by 0.5g while keeping target yield constant.',
      preInfusionAdvice: preAdvice,
      rationale: `Extraction lacked body and crema thickness. Grind slightly finer or increase dry dose to boost brew concentration.`,
    };
  }

  return {
    summary: 'Balanced & Sweet (Dial-In Sweet Spot)',
    grindAdvice: 'keep',
    grindDeltaSteps: 0,
    preInfusionAdvice: preAdvice || `First drip at ${preInfusionSeconds ? preInfusionSeconds.toFixed(1) + 's' : 'optimal time'}.`,
    rationale: `Superb extraction! ${yieldGrams.toFixed(1)}g yield in ${totalTimeSeconds.toFixed(1)}s with optimal flow rate in the Golden Zone (1.2–1.6 g/s).`,
  };
}
