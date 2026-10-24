/**
 * Flowbean Fleet Shot Telemetry Engine (Etape 4)
 *
 * Collects ultra-compact (<450 bytes) anonymous shot telemetry vectors to enable:
 * 1. Global Bayesian starting point consensus for new beans and equipment.
 * 2. Quality research on channeling vs basket sizes (51mm vs 54mm vs 58mm).
 * 3. Flowbean Lab quantitative intelligence in the Admin Portal.
 *
 * Privacy & GDPR:
 * - 100% anonymous (device fingerprint only, no IP, no names, no photos, no personal notes).
 * - Full opt-out support stored in local device preferences.
 */

import type { ShotRecord, ShotDataPoint } from '../types/espresso';
import { uploadFleetShotTelemetry, type FleetShotTelemetryVector } from './supabase';
import { resolveBrewPhysics, toGearKey } from './brewPhysics';
import { getMachineTempProfile } from './storage';

const OPT_IN_STORAGE_KEY = 'flowbean_fleet_telemetry_opt_in_v1';
const CURRENT_MATH_VERSION = 'v1.21.9';

export function isFleetTelemetryOptedIn(): boolean {
  try {
    const val = localStorage.getItem(OPT_IN_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setFleetTelemetryOptIn(optIn: boolean): void {
  try {
    localStorage.setItem(OPT_IN_STORAGE_KEY, optIn ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set telemetry opt-in preference', err);
  }
}

/**
 * Downsamples high-frequency sensor/camera data points to a compact 1Hz array of flow rates
 */
function downsampleFlowCurve1Hz(dataPoints?: ShotDataPoint[]): number[] {
  if (!dataPoints || dataPoints.length === 0) return [];

  const curve1Hz: number[] = [];
  let currentSecond = 0;

  for (const dp of dataPoints) {
    const sec = Math.floor(dp.timeSeconds);
    if (sec >= currentSecond) {
      curve1Hz.push(Math.round((dp.flowRateGps || 0) * 10) / 10);
      currentSecond = sec + 1;
    }
    if (curve1Hz.length >= 60) break; // Cap at 60 seconds
  }

  return curve1Hz;
}

/**
 * Fires an anonymous telemetry vector to the Supabase fleet table
 */
export async function recordShotFleetTelemetry(
  shot: ShotRecord,
  options?: { aiPredictedTimeS?: number; userOverrideDelta?: number }
): Promise<void> {
  if (!isFleetTelemetryOptedIn()) return;
  if (!shot.doseGrams || !shot.actualYieldGrams || !shot.totalTimeSeconds) return;

  const machineName = shot.machineName || 'Unknown Machine';
  const grinderName = shot.grinderName || 'Unknown Grinder';
  const machineKey = toGearKey(machineName);
  const grinderKey = toGearKey(grinderName);

  const physics = resolveBrewPhysics({
    machineName,
    filterBrewer: (shot as any).filterBrewer,
  });

  const machineProfile = getMachineTempProfile(machineName);
  const basketDiameterMm = (machineProfile as any)?.basketDiameterMm ?? (machineName.toLowerCase().includes('dedica') ? 51 : 58);

  const vector: Omit<FleetShotTelemetryVector, 'userFingerprint'> = {
    mathVersion: CURRENT_MATH_VERSION,
    machineKey,
    grinderKey,
    physicsClass: physics,
    basketDiameterMm,
    doseG: Math.round(shot.doseGrams * 100) / 100,
    yieldG: Math.round(shot.actualYieldGrams * 100) / 100,
    brewTimeS: Math.round(shot.totalTimeSeconds * 10) / 10,
    preInfusionS: shot.preInfusionSeconds ? Math.round(shot.preInfusionSeconds * 10) / 10 : undefined,
    grindSetting: shot.grindSetting || '15.0',
    flowCurve1Hz: downsampleFlowCurve1Hz(shot.dataPoints),
    tasteRating: (shot as any).rating || (shot as any).tasteRating,
    channelingDetected: Boolean(shot.channelingDetected || (shot.channeling && shot.channeling.detected)),
    aiPredictedTimeS: options?.aiPredictedTimeS,
    userOverrideDelta: options?.userOverrideDelta,
  };

  void uploadFleetShotTelemetry(vector);
}
