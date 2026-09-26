import type { ShotRecord, UserAccessState, CoffeeBeanProfile, GrinderProfile } from '../types/espresso';

const STORAGE_KEYS = {
  SHOTS: 'espressoflow_shots_v1',
  ACCESS: 'espressoflow_access_v1',
  BEANS: 'espressoflow_beans_v1',
  ACTIVE_BEAN_ID: 'espressoflow_active_bean_v1',
  GRINDERS: 'espressoflow_grinders_v1',
  ACTIVE_GRINDER_ID: 'espressoflow_active_grinder_v1',
  MACHINE: 'espressoflow_machine_v1',
  ACTIVE_BAR_DRINKS: 'espressoflow_active_bar_drinks_v1',
  DRINK_GRINDS: 'espressoflow_drink_grinds_v1',
  ONBOARDING_COMPLETE: 'espressoflow_onboarding_done_v1',
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

export function deleteShot(shotId: string): ShotRecord[] {
  try {
    const current = loadShots();
    const updated = current.filter((s) => s.id !== shotId);
    localStorage.setItem(STORAGE_KEYS.SHOTS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete shot record', err);
    return [];
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

export function loadBeans(): CoffeeBeanProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BEANS);
    return raw ? JSON.parse(raw) : getDefaultBeans();
  } catch {
    return getDefaultBeans();
  }
}

export function saveBeans(beans: CoffeeBeanProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BEANS, JSON.stringify(beans));
  } catch (err) {
    console.error('Failed to save coffee beans', err);
  }
}

export function getDefaultBeans(): CoffeeBeanProfile[] {
  return [
    {
      id: 'bean-ethiopia',
      name: 'Ethiopia Yirgacheffe (Washed)',
      roaster: 'Nomad Coffee',
      roastDate: '2026-09-14',
      roastLevel: 'light',
      doseGrams: 18.0,
      ratioStyle: 'lungo',
      targetYieldGrams: 45.0,
      grindSetting: '1.4',
      grinderName: 'Eureka Mignon Specialita',
      notes: 'Floral jasmine, bergamot, peach sweetness.',
    },
    {
      id: 'bean-colombia',
      name: 'Colombia Huila Pink Bourbon',
      roaster: 'La Cabra',
      roastDate: '2026-09-10',
      roastLevel: 'medium',
      doseGrams: 18.0,
      ratioStyle: 'standard',
      targetYieldGrams: 36.0,
      grindSetting: '14.0',
      grinderName: 'DF64 Gen 2',
      notes: 'Juicy red apple, cane sugar, creamy chocolate body.',
    },
    {
      id: 'bean-napoli',
      name: 'Napoli Dark Velvet Espresso',
      roaster: 'Caffè Vergnano',
      roastDate: '2026-09-02',
      roastLevel: 'dark',
      doseGrams: 18.0,
      ratioStyle: 'ristretto',
      targetYieldGrams: 27.0,
      grindSetting: '2.2',
      grinderName: 'Eureka Mignon Specialita',
      notes: 'Dark cacao, toasted hazelnuts, thick crema syrup.',
    },
  ];
}

export function loadGrinders(): GrinderProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRINDERS);
    return raw ? JSON.parse(raw) : getDefaultGrinders();
  } catch {
    return getDefaultGrinders();
  }
}

export function saveGrinders(grinders: GrinderProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GRINDERS, JSON.stringify(grinders));
  } catch (err) {
    console.error('Failed to save grinder profiles', err);
  }
}

export function getDefaultGrinders(): GrinderProfile[] {
  return [
    {
      id: 'grinder-baratza-esp',
      name: 'Baratza Encore ESP Pro',
      type: 'stepped',
      defaultSetting: '15',
      stepUnit: 'micro-steps (1-20)',
      secondsPerStep: 2.5,
    },
    {
      id: 'grinder-eureka-specialita',
      name: 'Eureka Mignon Specialita 16CR',
      type: 'stepless',
      defaultSetting: '1.4',
      stepUnit: 'micrometric dial (0-5)',
      secondsPerStep: 6.0,
    },
    {
      id: 'grinder-varia-vs3',
      name: 'Varia VS3 (Gen 2)',
      type: 'stepless',
      defaultSetting: '3.2',
      stepUnit: 'micrometric ticks (0.1 mark)',
      secondsPerStep: 4.0,
    },
    {
      id: 'grinder-varia-vs4',
      name: 'Varia VS4',
      type: 'stepless',
      defaultSetting: '2.8',
      stepUnit: 'stepless dial marks',
      secondsPerStep: 3.5,
    },
    {
      id: 'grinder-eureka-libra',
      name: 'Eureka Mignon Libra (Grind-by-Weight)',
      type: 'stepless',
      defaultSetting: '1.6',
      stepUnit: 'micrometric dial (0-5)',
      secondsPerStep: 6.0,
    },
    {
      id: 'grinder-eureka-zero',
      name: 'Eureka Mignon Zero / Oro Single Dose',
      type: 'stepless',
      defaultSetting: '1.2',
      stepUnit: 'single dose dial indicator',
      secondsPerStep: 5.0,
    },
    {
      id: 'grinder-eureka-manuale',
      name: 'Eureka Mignon Manuale / Silenzio 15BL',
      type: 'stepless',
      defaultSetting: '1.5',
      stepUnit: 'micrometric dial',
      secondsPerStep: 6.0,
    },
    {
      id: 'grinder-sage-smart',
      name: 'Sage The Smart Grinder Pro',
      type: 'stepped',
      defaultSetting: '12',
      stepUnit: 'espresso steps (1-30)',
      secondsPerStep: 2.0,
    },
    {
      id: 'grinder-sage-dose',
      name: 'Sage The Dose Control Pro',
      type: 'stepped',
      defaultSetting: '10',
      stepUnit: 'collar steps',
      secondsPerStep: 2.0,
    },
    {
      id: 'grinder-df64',
      name: 'DF64 Gen 2 (Single Dose)',
      type: 'stepless',
      defaultSetting: '14.0',
      stepUnit: 'collar ticks (0-90)',
      secondsPerStep: 2.0,
    },
    {
      id: 'grinder-niche',
      name: 'Niche Zero (Conical)',
      type: 'stepless',
      defaultSetting: '17.0',
      stepUnit: 'stepless calibration marks (0-50)',
      secondsPerStep: 1.5,
    },
    {
      id: 'grinder-fellow-opus',
      name: 'Fellow Opus Conical',
      type: 'stepped',
      defaultSetting: '2.0',
      stepUnit: 'bevel dial + inner micro ring',
      secondsPerStep: 2.5,
    },
    {
      id: 'grinder-baratza-sette',
      name: 'Baratza Sette 270 / 270Wi',
      type: 'stepped',
      defaultSetting: '9E',
      stepUnit: 'macro 1-31 & micro A-I',
      secondsPerStep: 2.0,
    },
    {
      id: 'grinder-timemore-sculptor',
      name: 'Timemore Sculptor 064S / 078S',
      type: 'stepless',
      defaultSetting: '2.5',
      stepUnit: 'stepless marks',
      secondsPerStep: 2.5,
    },
    {
      id: 'grinder-wilfa-uniform',
      name: 'Wilfa Uniform WSFBS-100B',
      type: 'stepped',
      defaultSetting: '6',
      stepUnit: 'steps (1-41)',
      secondsPerStep: 2.5,
    },
    {
      id: 'grinder-lelit-fred',
      name: 'Lelit Fred PL043MM',
      type: 'stepless',
      defaultSetting: '2.5',
      stepUnit: 'micrometric worm screw',
      secondsPerStep: 8.0,
    },
    {
      id: 'grinder-1zpresso',
      name: '1Zpresso J-Ultra / J-Max',
      type: 'stepped',
      defaultSetting: '1.3.5',
      stepUnit: 'rotations & clicks (8.4µm)',
      secondsPerStep: 3.0,
    },
    {
      id: 'grinder-comandante',
      name: 'Comandante C40 MK4',
      type: 'stepped',
      defaultSetting: '13 clicks',
      stepUnit: 'clicks (30µm per click)',
      secondsPerStep: 3.5,
    },
    {
      id: 'grinder-mahlkonig',
      name: 'Mahlkönig X54 Allround Home',
      type: 'stepless',
      defaultSetting: '3.5',
      stepUnit: 'stepless dial indicator (1-35)',
      secondsPerStep: 3.0,
    },
    {
      id: 'grinder-varia-vs6',
      name: 'Varia VS6 Commercial Grade',
      type: 'stepless',
      defaultSetting: '3.0',
      stepUnit: 'precision micrometric ticks',
      secondsPerStep: 3.0,
    },
    {
      id: 'grinder-timemore-bricks',
      name: 'Timemore Bricks 01S Electric',
      type: 'stepped',
      defaultSetting: '4.5',
      stepUnit: 'notches',
      secondsPerStep: 2.5,
    },
    {
      id: 'grinder-timemore-whirly',
      name: 'Timemore Whirly 01S Portable',
      type: 'stepped',
      defaultSetting: '3.0',
      stepUnit: 'clicks',
      secondsPerStep: 3.0,
    },
    {
      id: 'grinder-delonghi-kg79',
      name: 'DeLonghi KG79',
      type: 'stepped',
      defaultSetting: 'Fine 2',
      stepUnit: 'steps',
      secondsPerStep: 2.0,
    },
  ];
}

const DEFAULT_ACTIVE_BAR_DRINKS: string[] = [
  'cappuccino',
  'espresso',
  'flat-white',
  'cortado',
  'latte',
  'americano',
];

export function loadActiveBarDrinkIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_BAR_DRINKS);
    if (!raw) return DEFAULT_ACTIVE_BAR_DRINKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ACTIVE_BAR_DRINKS;
  } catch {
    return DEFAULT_ACTIVE_BAR_DRINKS;
  }
}

export function saveActiveBarDrinkIds(drinkIds: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BAR_DRINKS, JSON.stringify(drinkIds));
  } catch (err) {
    console.error('Failed to save active bar drinks', err);
  }
}

export function loadDrinkGrindSettings(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRINK_GRINDS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDrinkGrindSetting(key: string, setting: string): void {
  try {
    const current = loadDrinkGrindSettings();
    current[key] = setting;
    localStorage.setItem(STORAGE_KEYS.DRINK_GRINDS, JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save drink grind setting', err);
  }
}

export function loadOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  } catch {
    return false;
  }
}

export function saveOnboardingComplete(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (err) {
    console.error('Failed to save onboarding state', err);
  }
}

export function loadMachineName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.MACHINE) || 'Espresso Machine';
  } catch {
    return 'Espresso Machine';
  }
}

export function saveMachineName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MACHINE, name);
  } catch (err) {
    console.error('Failed to save machine name', err);
  }
}
