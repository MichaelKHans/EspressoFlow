import type { ShotRecord, ShotDataPoint, UserAccessState, CoffeeBeanProfile, GrinderProfile, TempUnit, EspressoMachineProfile } from '../types/espresso';

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
  TEMP_UNIT: 'espressoflow_temp_unit_v1',
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
    if (!raw) return [];
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
    return [];
  }
}

export function saveShot(shot: ShotRecord): void {
  try {
    const current = loadShots();
    const existingIndex = current.findIndex((s) => s.id === shot.id);
    let updated: ShotRecord[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = shot;
    } else {
      updated = [shot, ...current];
    }
    try {
      localStorage.setItem(STORAGE_KEYS.SHOTS, JSON.stringify(updated));
    } catch {
      console.warn('LocalStorage quota warning. Pruning high-frequency telemetry for older shots to preserve history.');
      // Downsample dataPoints from shots older than index 25 (keep summary, stats, notes and essential curve points)
      const pruned = updated.map((s, idx) => {
        if (idx > 25 && s.dataPoints && s.dataPoints.length > 20) {
          return {
            ...s,
            dataPoints: s.dataPoints.filter((_: ShotDataPoint, pIdx: number) => pIdx % 5 === 0),
          };
        }
        return s;
      });
      localStorage.setItem(STORAGE_KEYS.SHOTS, JSON.stringify(pruned));
    }
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

export function resolveGrinder(name: string | undefined, grinders: GrinderProfile[]): GrinderProfile | undefined {
  if (!name || grinders.length === 0) return undefined;
  // 1. Exact match
  const exact = grinders.find((g) => g.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact;

  // 2. Prefix or substring match (e.g. "Eureka Mignon Specialita" matches "Eureka Mignon Specialita 16CR")
  const prefix = grinders.find(
    (g) => g.name.toLowerCase().startsWith(name.toLowerCase()) || name.toLowerCase().startsWith(g.name.toLowerCase())
  );
  if (prefix) return prefix;

  // 3. First brand word match (e.g. "Eureka", "DF64", "Baratza", "Niche", "Varia")
  const firstWord = name.split(' ')[0].toLowerCase();
  const brandMatch = grinders.find((g) => g.name.toLowerCase().startsWith(firstWord));
  return brandMatch;
}

export function loadBeans(): CoffeeBeanProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BEANS);
    const beans: CoffeeBeanProfile[] = raw ? JSON.parse(raw) : getDefaultBeans();
    // Normalize grinder names to ensure 100% exact match with grinder catalog
    return beans.map((b) => {
      let gName = b.grinderName;
      if (gName === 'Eureka Mignon Specialita') gName = 'Eureka Mignon Specialita 16CR';
      if (gName === 'DF64 Gen 2') gName = 'DF64 Gen 2 (Single Dose)';
      const fallbackTemp = b.roastLevel === 'light' ? 94 : b.roastLevel === 'dark' ? 89 : 93;
      return {
        ...b,
        grinderName: gName,
        brewTempC: b.brewTempC ?? fallbackTemp,
      };
    });
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
  const getRoastDateAgo = (days: number) => {
    const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'bean-ethiopia',
      name: 'Ethiopia Yirgacheffe (Washed)',
      roaster: 'Nomad Coffee',
      roastDate: getRoastDateAgo(5),
      roastLevel: 'light',
      doseGrams: 18.0,
      ratioStyle: 'lungo',
      targetYieldGrams: 45.0,
      grindSetting: '1.4',
      grinderName: 'Eureka Mignon Specialita 16CR',
      brewTempC: 94,
      notes: 'Floral jasmine, bergamot, peach sweetness.',
      rating: 0,
    },
    {
      id: 'bean-colombia',
      name: 'Colombia Huila Pink Bourbon',
      roaster: 'La Cabra',
      roastDate: getRoastDateAgo(8),
      roastLevel: 'medium',
      doseGrams: 18.0,
      ratioStyle: 'standard',
      targetYieldGrams: 36.0,
      grindSetting: '14.0',
      grinderName: 'DF64 Gen 2 (Single Dose)',
      brewTempC: 93,
      notes: 'Juicy red apple, cane sugar, creamy chocolate body.',
      rating: 0,
    },
    {
      id: 'bean-napoli',
      name: 'Napoli Dark Velvet Espresso',
      roaster: 'Caffè Vergnano',
      roastDate: getRoastDateAgo(12),
      roastLevel: 'dark',
      doseGrams: 18.0,
      ratioStyle: 'ristretto',
      targetYieldGrams: 27.0,
      grindSetting: '2.2',
      grinderName: 'Eureka Mignon Specialita 16CR',
      brewTempC: 89,
      notes: 'Dark cacao, toasted hazelnuts, thick crema syrup.',
      rating: 0,
    },
  ];
}

export function loadGrinders(): GrinderProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRINDERS);
    const grinders: GrinderProfile[] = raw ? JSON.parse(raw) : getDefaultGrinders();
    // Guarantee at least one or two grinders have inSetup: true
    const hasAnyInSetup = grinders.some((g) => g.inSetup === true);
    if (!hasAnyInSetup && grinders.length > 0) {
      grinders[0].inSetup = true;
      if (grinders.length > 1) {
        grinders[1].inSetup = true;
      }
      saveGrinders(grinders);
    }
    return grinders;
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
      inSetup: true,
    },
    {
      id: 'grinder-eureka-specialita',
      name: 'Eureka Mignon Specialita 16CR',
      type: 'stepless',
      defaultSetting: '1.4',
      stepUnit: 'micrometric dial (0-5)',
      secondsPerStep: 6.0,
      inSetup: true,
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

export function loadTempUnit(): TempUnit {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEMP_UNIT);
    return raw === 'F' ? 'F' : 'C';
  } catch {
    return 'C';
  }
}

export function saveTempUnit(unit: TempUnit): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMP_UNIT, unit);
  } catch (err) {
    console.error('Failed to save temperature unit', err);
  }
}

export const MACHINE_TEMP_PRESETS: Record<string, Partial<EspressoMachineProfile>> = {
  "De'Longhi Dedica (EC680 / EC685 / EC885)": {
    tempControl: 'stepped',
    minTempC: 90,
    maxTempC: 94,
    defaultTempC: 92,
    defaultPreInfusionSeconds: 2.0,
  },
  "De'Longhi La Specialista": {
    tempControl: 'stepped',
    minTempC: 90,
    maxTempC: 96,
    defaultTempC: 92,
    defaultPreInfusionSeconds: 3.0,
  },
  'Sage / Breville Dual Boiler': {
    tempControl: 'pid',
    minTempC: 86,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 6.0,
  },
  'Sage / Breville Barista Touch/Express': {
    tempControl: 'pid',
    minTempC: 88,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 7.0,
  },
  'Sage Bambino / Bambino Plus': {
    tempControl: 'stepped',
    minTempC: 91,
    maxTempC: 95,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 5.0,
  },
  'Gaggia Classic Pro / Evo': {
    tempControl: 'fixed',
    minTempC: 93,
    maxTempC: 93,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 0.0,
  },
  'Rancilio Silvia / Silvia Pro X': {
    tempControl: 'fixed',
    minTempC: 93,
    maxTempC: 93,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 0.0,
  },
  'E61 Manual Flow Control': {
    tempControl: 'fixed',
    minTempC: 92,
    maxTempC: 94,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 8.0,
  },
  'La Marzocco Linea Micra / Mini': {
    tempControl: 'pid',
    minTempC: 88,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 4.0,
  },
  'Decent DE1 (Profiling)': {
    tempControl: 'pid',
    minTempC: 80,
    maxTempC: 98,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 6.0,
  },
};

export function getMachineTempProfile(machineName: string): Partial<EspressoMachineProfile> {
  const match = Object.keys(MACHINE_TEMP_PRESETS).find(
    (k) => machineName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(machineName.toLowerCase())
  );
  if (match) return MACHINE_TEMP_PRESETS[match];
  return {
    tempControl: 'pid',
    minTempC: 88,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 6.0,
  };
}

