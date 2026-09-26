import type { ShotDataPoint, TasteRating } from '../types/espresso';

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
 * Evaluates whether channeling occurred during the shot
 * Channeling indicator: Mid-shot flow spike > 2.8 g/s after second 10
 */
export function detectChanneling(points: ShotDataPoint[]): boolean {
  if (points.length < 5) return false;
  
  // Skip initial pre-infusion / saturation (< 8s)
  const midShotPoints = points.filter(p => p.timeSeconds >= 8 && p.timeSeconds <= 28);
  if (midShotPoints.length === 0) return false;

  const hasExcessiveSpike = midShotPoints.some(p => p.flowRateGps >= 3.2);
  return hasExcessiveSpike;
}

export interface DialInAdvice {
  summary: string;
  grindAdvice: 'finer' | 'coarser' | 'keep';
  grindDeltaSteps: number;
  puckAdvice?: string;
  rationale: string;
}

/**
 * Generates barista tech dial-in advice from flow curve and user taste
 */
export function generateDialInAdvice(
  totalTimeSeconds: number,
  doseGrams: number,
  yieldGrams: number,
  channeling: boolean,
  taste?: TasteRating
): DialInAdvice {
  const ratio = doseGrams > 0 ? (yieldGrams / doseGrams).toFixed(1) : '2.0';

  if (channeling) {
    return {
      summary: 'Channeling Detected Mid-Shot',
      grindAdvice: 'keep',
      grindDeltaSteps: 0,
      puckAdvice: 'Improve puck preparation with WDT needle distribution. Tamp flat and level with uniform pressure.',
      rationale: `Flow spiked abruptly during extraction, indicating water bypassed the coffee puck through micro-channels. Do not change grinder setting yet; perfect puck prep first.`,
    };
  }

  if (taste === 'sour' || totalTimeSeconds < 24) {
    return {
      summary: 'Under-extracted (Fast / Sour)',
      grindAdvice: 'finer',
      grindDeltaSteps: 0.5,
      puckAdvice: 'Maintain uniform tamping and pre-infusion.',
      rationale: `The shot ran fast (${totalTimeSeconds.toFixed(1)}s for ${ratio}x ratio). Water rushed through too quickly. Grind finer by 0.5-1.0 steps to increase puck resistance.`,
    };
  }

  if (taste === 'bitter' || totalTimeSeconds > 34) {
    return {
      summary: 'Over-extracted (Slow / Bitter)',
      grindAdvice: 'coarser',
      grindDeltaSteps: 0.5,
      puckAdvice: 'Ensure coffee bed is not overfilled.',
      rationale: `The shot choked or dragged on (${totalTimeSeconds.toFixed(1)}s). The puck was too dense, extracting bitter tannins. Grind coarser by 0.5 steps for a smoother flow.`,
    };
  }

  if (taste === 'watery') {
    return {
      summary: 'Low Body / Diluted',
      grindAdvice: 'finer',
      grindDeltaSteps: 0.5,
      puckAdvice: 'Check basket headspace and verify dry dose weight.',
      rationale: `Extraction lacked body. Grind slightly finer or increase dry dose by 0.5g while maintaining target yield.`,
    };
  }

  return {
    summary: 'Balanced & Sweet (Dial-in Sweet Spot)',
    grindAdvice: 'keep',
    grindDeltaSteps: 0,
    rationale: `Great extraction! ${yieldGrams.toFixed(1)}g out in ${totalTimeSeconds.toFixed(1)}s (flow rate optimal ~1.2-1.5 g/s). Lock this recipe in your logbook.`,
  };
}
