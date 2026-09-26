import type { ShotRecord, UserAccessState } from '../types/espresso';

const STORAGE_KEYS = {
  SHOTS: 'espressoflow_shots_v1',
  ACCESS: 'espressoflow_access_v1',
  GRINDER: 'espressoflow_grinder_v1',
  BEAN: 'espressoflow_bean_v1',
};

const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

export function loadUserAccess(): UserAccessState {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACCESS);
    let state: { isProLifetime: boolean; installTimestampMs: number };

    if (!raw) {
      state = {
        isProLifetime: false,
        installTimestampMs: Date.now(),
      };
      localStorage.setItem(STORAGE_KEYS.ACCESS, JSON.stringify(state));
    } else {
      state = JSON.parse(raw);
    }

    const elapsed = Date.now() - state.installTimestampMs;
    const isWithinTrial = elapsed < TRIAL_DURATION_MS;
    const daysRemaining = Math.max(0, Math.ceil((TRIAL_DURATION_MS - elapsed) / (24 * 60 * 60 * 1000)));

    return {
      isProLifetime: state.isProLifetime,
      installTimestampMs: state.installTimestampMs,
      isWithinTrial,
      daysRemainingInTrial: daysRemaining,
    };
  } catch {
    return {
      isProLifetime: false,
      installTimestampMs: Date.now(),
      isWithinTrial: true,
      daysRemainingInTrial: TRIAL_DURATION_DAYS,
    };
  }
}

export function saveProStatus(isPro: boolean): void {
  try {
    const current = loadUserAccess();
    const updated = {
      isProLifetime: isPro,
      installTimestampMs: current.installTimestampMs,
    };
    localStorage.setItem(STORAGE_KEYS.ACCESS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save pro status', err);
  }
}

export function loadShots(): ShotRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOTS);
    if (!raw) return getSampleShots();
    const parsed = JSON.parse(raw) as ShotRecord[];
    // Ensure backwards compatibility with older stored records
    return parsed.map((s) => ({
      ...s,
      preInfusionSeconds: s.preInfusionSeconds ?? 5.0,
      flowTimeSeconds: s.flowTimeSeconds ?? Math.max(0, s.totalTimeSeconds - 5.0),
      channeling: s.channeling ?? {
        detected: Boolean(s.channelingDetected),
        severity: s.channelingDetected ? 'mild' : 'none',
      },
      channelingDetected: s.channelingDetected ?? false,
    }));
  } catch {
    return getSampleShots();
  }
}

export function saveShot(shot: ShotRecord): void {
  try {
    const current = loadShots();
    const updated = [shot, ...current];
    localStorage.setItem(STORAGE_KEYS.SHOTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save shot record', err);
  }
}

function getSampleShots(): ShotRecord[] {
  return [
    {
      id: 'shot-sample-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      coffeeName: 'Ethiopia Yirgacheffe (Washed)',
      roaster: 'Nomad Coffee',
      roastDate: '2026-09-14',
      doseGrams: 18.0,
      targetYieldGrams: 36.0,
      actualYieldGrams: 36.4,
      totalTimeSeconds: 29.2,
      preInfusionSeconds: 5.5,
      flowTimeSeconds: 23.7,
      averageFlowGps: 1.25,
      peakFlowGps: 1.6,
      channeling: { detected: false, severity: 'none' },
      channelingDetected: false,
      grinderName: 'Eureka Mignon Specialita',
      grindSetting: '1.4',
      machineName: 'Sage Dual Boiler',
      tasteRating: 'balanced',
      notes: 'Silky mouthfeel, bright bergamot and jasmine notes.',
      dataPoints: [],
    },
    {
      id: 'shot-sample-2',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      coffeeName: 'Colombia Huila Pink Bourbon',
      roaster: 'La Cabra',
      roastDate: '2026-09-10',
      doseGrams: 18.5,
      targetYieldGrams: 38.0,
      actualYieldGrams: 39.1,
      totalTimeSeconds: 22.8,
      preInfusionSeconds: 4.0,
      flowTimeSeconds: 18.8,
      averageFlowGps: 1.71,
      peakFlowGps: 3.4,
      channeling: {
        detected: true,
        severity: 'severe',
        timestampSeconds: 14.5,
        flowSpikeGps: 3.4,
        message: 'Severe channeling spike (3.4 g/s at 14.5s). Water broke through puck.',
      },
      channelingDetected: true,
      grinderName: 'DF64 Gen 2',
      grindSetting: '14.0',
      machineName: 'E61 Manual Flow Control',
      tasteRating: 'sour',
      notes: 'Mid-shot channeling spike. Needs finer grind and more thorough WDT puck prep.',
      dataPoints: [],
    },
  ];
}
