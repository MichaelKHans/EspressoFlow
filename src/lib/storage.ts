import type { ShotRecord, ShotDataPoint, UserAccessState, CoffeeBeanProfile, GrinderProfile, TempUnit, EspressoMachineProfile } from '../types/espresso';
import { MACHINE_CATALOG } from '../data/gearCatalog';

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
  FILTER_BREWER: 'espressoflow_filter_brewer_v1',
  KETTLE: 'espressoflow_kettle_v1',
  GRIND_INTELLIGENCE: 'flowbean_grind_intelligence_v1',
  BEAN_ANCHORS: 'flowbean_bean_anchors_v1',
  CUSTOM_PREINFUSION_OVERRIDES: 'flowbean_custom_preinfusion_overrides_v1',
  LAST_CLEANSE_TIMESTAMP: 'flowbean_last_cleanse_timestamp_v1',
  LAST_CLEANSE_TYPE: 'flowbean_last_cleanse_type_v1',
  MACHINES_IN_SETUP: 'espressoflow_machines_in_setup_v1',
  BREWERS_IN_SETUP: 'espressoflow_brewers_in_setup_v1',
  KETTLES_IN_SETUP: 'espressoflow_kettles_in_setup_v1',
  FRENCH_PRESS_SETTINGS: 'espressoflow_french_press_settings_v1',
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
    let beans: CoffeeBeanProfile[] = raw ? JSON.parse(raw) : getDefaultBeans();
    // Purge legacy sample/test beans to ensure a clean start with only user's own beans
    const beforeCount = beans.length;
    beans = beans.filter(
      (b) => b.id !== 'bean-ethiopia' && b.id !== 'bean-colombia' && b.id !== 'bean-napoli'
    );
    if (raw && beans.length !== beforeCount) {
      saveBeans(beans);
    }
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
    return [];
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
  // Clean start: no synthetic mock beans by default
  return [];
}

export function loadGrinders(): GrinderProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRINDERS);
    const grinders: GrinderProfile[] = raw ? JSON.parse(raw) : getDefaultGrinders();

    // Clean up older legacy default where Eureka was unintentionally enabled alongside Baratza
    const baratza = grinders.find((g) => g.id === 'grinder-baratza-esp');
    const eureka = grinders.find((g) => g.id === 'grinder-eureka-specialita');
    const legacyFlag = localStorage.getItem('espressoflow_eureka_cleaned_v1');
    if (!legacyFlag && baratza?.inSetup && eureka?.inSetup) {
      eureka.inSetup = false;
      localStorage.setItem('espressoflow_eureka_cleaned_v1', 'true');
      saveGrinders(grinders);
    }

    // Guarantee at least one grinder has inSetup: true
    const hasAnyInSetup = grinders.some((g) => g.inSetup === true);
    if (!hasAnyInSetup && grinders.length > 0) {
      grinders[0].inSetup = true;
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
      defaultSetting: '15.0',
      stepUnit: 'micro-steps (1-20 espresso / 21-40 filter)',
      secondsPerStep: 2.5,
      inSetup: true,
      burrType: 'M2 40mm Steel Conical',
      minSetting: 1.0,
      maxSetting: 40.0,
      espressoMaxSetting: 20.0,
    },
    {
      id: 'grinder-eureka-specialita',
      name: 'Eureka Mignon Specialita 16CR',
      type: 'stepless',
      defaultSetting: '1.4',
      stepUnit: 'micrometric dial (0-5)',
      secondsPerStep: 6.0,
      inSetup: false,
      burrType: '55mm Hardened Steel Flat',
      minSetting: 0.0,
      maxSetting: 6.0,
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
  'v60-standard',
  'chemex-classic',
  'aeropress-inverted',
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
    preInfusionControl: 'fixed',
    preInfusionNote: 'Kort 2s elektronisk puls',
    maxPumpBar: 15.0,
  },
  'Ninja Luxe Café / Ninja Pro': {
    category: 'combo',
    hasBuiltInGrinder: true,
    builtInGrinderName: 'Ninja Luxe Conical Grinder (15-step)',
    builtInGrinderType: 'stepped',
    builtInGrinderSteps: '1-15 (Fine to Drip)',
    tempControl: 'stepped',
    minTempC: 90,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 6.0,
    preInfusionControl: 'adjustable',
    preInfusionNote: 'Justerbar pre-infusion soak (0-12s)',
    maxPumpBar: 9.0,
  },
  "De'Longhi La Specialista": {
    category: 'combo',
    hasBuiltInGrinder: true,
    builtInGrinderName: 'Sensor Grinding Conical Burr (8-step)',
    builtInGrinderType: 'stepped',
    builtInGrinderSteps: '1-8',
    tempControl: 'stepped',
    minTempC: 90,
    maxTempC: 96,
    defaultTempC: 92,
    defaultPreInfusionSeconds: 3.0,
    preInfusionControl: 'fixed',
    preInfusionNote: 'Fast for-vædning (~3s)',
    maxPumpBar: 15.0,
  },
  'Sage / Breville Dual Boiler': {
    category: 'manual',
    tempControl: 'pid',
    minTempC: 86,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 6.0,
    preInfusionControl: 'adjustable',
    preInfusionNote: 'Manuel hold-knap & programmerbar (1-15s)',
    maxPumpBar: 9.0,
  },
  'Sage / Breville Barista Touch/Express': {
    category: 'combo',
    hasBuiltInGrinder: true,
    builtInGrinderName: 'Barista Series Integrated Conical Burr (30-step)',
    builtInGrinderType: 'stepped',
    builtInGrinderSteps: '1-30',
    tempControl: 'pid',
    minTempC: 88,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 7.0,
    preInfusionControl: 'fixed',
    preInfusionNote: 'Fabriks-pre-infusion (~7s lavtryk)',
    maxPumpBar: 15.0,
  },
  'Jura Z10 / E8 (Super-Automatic)': {
    category: 'super_automatic',
    hasBuiltInGrinder: true,
    builtInGrinderName: 'Jura Product Recognising Grinder (PRG)',
    builtInGrinderType: 'stepped',
    builtInGrinderSteps: 'Electronic 1-5 levels',
    tempControl: 'stepped',
    minTempC: 90,
    maxTempC: 95,
    defaultTempC: 92,
    defaultPreInfusionSeconds: 2.0,
    preInfusionControl: 'fixed',
    preInfusionNote: 'I.P.B.A.S. for-vædning (~2s)',
    maxPumpBar: 15.0,
  },
  'Philips LatteGo 5400 / 3200': {
    category: 'super_automatic',
    hasBuiltInGrinder: true,
    builtInGrinderName: '100% Ceramic Flat Burr (12-step)',
    builtInGrinderType: 'stepped',
    builtInGrinderSteps: '1-12 under hopper lid',
    tempControl: 'stepped',
    minTempC: 90,
    maxTempC: 95,
    defaultTempC: 92,
    defaultPreInfusionSeconds: 1.5,
    preInfusionControl: 'fixed',
    preInfusionNote: 'Automatisk for-brygning (~1.5s)',
    maxPumpBar: 15.0,
  },
  "De'Longhi Magnifica / Eletta": {
    category: 'super_automatic',
    hasBuiltInGrinder: true,
    builtInGrinderName: 'Tubeless Steel Conical Burr (13-step)',
    builtInGrinderType: 'stepped',
    builtInGrinderSteps: '1-13 dial inside hopper',
    tempControl: 'stepped',
    minTempC: 90,
    maxTempC: 95,
    defaultTempC: 92,
    defaultPreInfusionSeconds: 2.0,
    preInfusionControl: 'fixed',
    preInfusionNote: 'Elektronisk for-infusion (~2s)',
    maxPumpBar: 15.0,
  },
  'Sage Bambino / Bambino Plus': {
    category: 'manual',
    tempControl: 'stepped',
    minTempC: 91,
    maxTempC: 95,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 8.0,
    preInfusionControl: 'fixed',
    preInfusionNote: 'ThermoJet lavtryks-rampe (~8-10s)',
    maxPumpBar: 9.0,
  },
  'Gaggia Classic Pro / Evo': {
    tempControl: 'fixed',
    minTempC: 93,
    maxTempC: 93,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 0.0,
    preInfusionControl: 'none',
    preInfusionNote: 'Direkte 9-bar pumpe (Ingen for-infusion)',
    maxPumpBar: 9.0,
  },
  'Rancilio Silvia / Silvia Pro X': {
    tempControl: 'fixed',
    minTempC: 93,
    maxTempC: 93,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 0.0,
    preInfusionControl: 'none',
    preInfusionNote: 'Direkte pumpe (Ingen for-infusion)',
    maxPumpBar: 9.0,
  },
  'E61 Manual Flow Control': {
    tempControl: 'fixed',
    minTempC: 92,
    maxTempC: 94,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 8.0,
    preInfusionControl: 'adjustable',
    preInfusionNote: 'Manuel flow paddle profilering (0-30s)',
    maxPumpBar: 9.0,
  },
  'La Marzocco Linea Micra / Mini': {
    tempControl: 'pid',
    minTempC: 88,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 4.0,
    preInfusionControl: 'fixed',
    preInfusionNote: 'Elektronisk for-vædning via app (~4s)',
    maxPumpBar: 9.0,
  },
  'Decent DE1 (Profiling)': {
    tempControl: 'pid',
    minTempC: 80,
    maxTempC: 98,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 6.0,
    preInfusionControl: 'adjustable',
    preInfusionNote: 'Fuld avanceret tryk/flow profilering (0-30s)',
    maxPumpBar: 9.0,
  },
};

export function loadPreinfusionOverride(machineName: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PREINFUSION_OVERRIDES);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Boolean(parsed[machineName]);
  } catch {
    return false;
  }
}

export function savePreinfusionOverride(machineName: string, enabled: boolean): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PREINFUSION_OVERRIDES);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[machineName] = enabled;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PREINFUSION_OVERRIDES, JSON.stringify(parsed));
  } catch (err) {
    console.error('Failed to save preinfusion override', err);
  }
}

export function loadLastCleanse(): { timestamp: number; type: string } {
  try {
    const rawTs = localStorage.getItem(STORAGE_KEYS.LAST_CLEANSE_TIMESTAMP);
    const rawType = localStorage.getItem(STORAGE_KEYS.LAST_CLEANSE_TYPE) || 'Urnex Cafiza Soak';
    const ts = rawTs ? parseInt(rawTs, 10) : Date.now() - 4 * 24 * 60 * 60 * 1000;
    return { timestamp: ts, type: rawType };
  } catch {
    return { timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000, type: 'Urnex Cafiza Soak' };
  }
}

export function saveLastCleanse(type: string = 'Urnex Cafiza Soak'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANSE_TIMESTAMP, Date.now().toString());
    localStorage.setItem(STORAGE_KEYS.LAST_CLEANSE_TYPE, type);
  } catch (err) {
    console.error('Failed to save cleanse log', err);
  }
}

export function getMachineTempProfile(machineName: string): Partial<EspressoMachineProfile> {
  const normName = machineName.toLowerCase().trim();

  // 1. Check custom presets
  const presetMatch = Object.keys(MACHINE_TEMP_PRESETS).find(
    (k) => normName.includes(k.toLowerCase()) || k.toLowerCase().includes(normName)
  );
  const preset = presetMatch ? MACHINE_TEMP_PRESETS[presetMatch] : undefined;

  // 2. Check full hardware catalog (including all 24 new machines)
  const catalogMatch = MACHINE_CATALOG.find((c) => {
    const cName = c.name.toLowerCase().trim();
    const cBrand = c.brand ? c.brand.toLowerCase().trim() : '';
    return (
      cName === normName ||
      cName.includes(normName) ||
      normName.includes(cName) ||
      (cBrand && normName.includes(cBrand) && cName.split(' ').some((w) => w.length > 2 && normName.includes(w)))
    );
  });

  const catalogSpecs = catalogMatch?.specs;
  const catalogProfile: Partial<EspressoMachineProfile> = catalogSpecs
    ? {
        tempControl: catalogSpecs.tempControl,
        minTempC: catalogSpecs.tempControl === 'fixed' ? (catalogSpecs.defaultTempC ?? 93) : 88,
        maxTempC: catalogSpecs.tempControl === 'fixed' ? (catalogSpecs.defaultTempC ?? 93) : 96,
        defaultTempC: catalogSpecs.defaultTempC,
        defaultPreInfusionSeconds: catalogSpecs.defaultPreInfusionSeconds,
        preInfusionControl: catalogSpecs.preInfusionControl,
        preInfusionNote: catalogSpecs.preInfusionNote,
        maxPumpBar: catalogSpecs.pumpBar,
      }
    : {};

  // Merge: preset takes precedence on combo grinder fields, catalog supplies verified hydraulic & pre-infusion specs
  if (preset || catalogSpecs) {
    return {
      tempControl: preset?.tempControl ?? catalogProfile.tempControl ?? 'pid',
      minTempC: preset?.minTempC ?? catalogProfile.minTempC ?? 88,
      maxTempC: preset?.maxTempC ?? catalogProfile.maxTempC ?? 96,
      defaultTempC: preset?.defaultTempC ?? catalogProfile.defaultTempC ?? 93,
      defaultPreInfusionSeconds: preset?.defaultPreInfusionSeconds ?? catalogProfile.defaultPreInfusionSeconds ?? 6.0,
      preInfusionControl: preset?.preInfusionControl ?? catalogProfile.preInfusionControl ?? 'adjustable',
      preInfusionNote: preset?.preInfusionNote ?? catalogProfile.preInfusionNote,
      maxPumpBar: preset?.maxPumpBar ?? catalogProfile.maxPumpBar ?? 9.0,
      hasBuiltInGrinder: preset?.hasBuiltInGrinder,
      builtInGrinderName: preset?.builtInGrinderName,
      builtInGrinderType: preset?.builtInGrinderType,
      builtInGrinderSteps: preset?.builtInGrinderSteps,
      category: preset?.category,
    };
  }

  return {
    tempControl: 'pid',
    minTempC: 88,
    maxTempC: 96,
    defaultTempC: 93,
    defaultPreInfusionSeconds: 6.0,
    preInfusionControl: 'adjustable',
    maxPumpBar: 9.0,
  };
}

export interface FrenchPressSettings {
  waterMl: number;
  ratio: number;
}

export function loadFrenchPressSettings(): FrenchPressSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FRENCH_PRESS_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return { waterMl: 500, ratio: 15.0 };
}

export function saveFrenchPressSettings(settings: FrenchPressSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FRENCH_PRESS_SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(
      new CustomEvent('flowbean_frenchpress_updated', {
        detail: settings,
      })
    );
  } catch (err) {
    console.error('Failed to save French Press settings', err);
  }
}

export interface DrinkCalibration {
  doseGrams: number;
  targetYieldGrams: number;
  grindSetting: string;
  brewTempC?: number;
  grinderName?: string;
}

export function loadDrinkCalibrations(): Record<string, DrinkCalibration> {
  try {
    const raw = localStorage.getItem('flowbean_drink_calibrations_v1');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDrinkCalibration(key: string, calibration: DrinkCalibration): void {
  try {
    const current = loadDrinkCalibrations();
    current[key] = calibration;
    localStorage.setItem('flowbean_drink_calibrations_v1', JSON.stringify(current));
  } catch (err) {
    console.error('Failed to save drink calibration', err);
  }
}

export const FILTER_BREWER_PRESETS = [
  'Hario V60 (02 Ceramic / Plastic / Metal)',
  'French Press / Stempelkande (Bodum Chambord / Espro P7)',
  'AeroPress (Inverted & Standard Method)',
  'Chemex (6-Cup / 8-Cup Classic Bonded Paper)',
  'Kalita Wave (185 Flat-Bottom Stainless)',
  'Moccamaster / Batch Filter Brewer',
  'Clever Dripper / Hario Switch (Hybrid Immersion)',
];

export const KETTLE_PRESETS = [
  'Fellow Stagg EKG (Variable Temp Gooseneck)',
  'Timemore Fish Smart Kettle (PID)',
  'Brewista Artisan Variable Temp Gooseneck',
  'Hario Buono Stovetop / Electric Gooseneck',
  'Standard Elkedel (Kogende vand lades stå 1-2 min for ~93°C)',
];

export function loadFilterBrewer(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.FILTER_BREWER) || FILTER_BREWER_PRESETS[0];
  } catch {
    return FILTER_BREWER_PRESETS[0];
  }
}

export function saveFilterBrewer(brewer: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FILTER_BREWER, brewer);
  } catch (err) {
    console.error('Failed to save filter brewer', err);
  }
}

export function loadKettle(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.KETTLE) || KETTLE_PRESETS[0];
  } catch {
    return KETTLE_PRESETS[0];
  }
}

export function saveKettle(kettle: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.KETTLE, kettle);
  } catch (err) {
    console.error('Failed to save kettle', err);
  }
}

export function loadMachinesInSetup(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MACHINES_IN_SETUP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const current = loadMachineName();
    return [current];
  } catch {
    return [loadMachineName()];
  }
}

export function saveMachinesInSetup(machines: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MACHINES_IN_SETUP, JSON.stringify(machines));
  } catch (err) {
    console.error('Failed to save machines in setup', err);
  }
}

export function loadBrewersInSetup(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BREWERS_IN_SETUP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const current = loadFilterBrewer();
    const defaults = [current];
    if (!defaults.some((b) => b.toLowerCase().includes('french') || b.toLowerCase().includes('stempel'))) {
      defaults.push('French Press / Stempelkande (Bodum Chambord / Espro P7)');
    }
    return defaults;
  } catch {
    return [loadFilterBrewer()];
  }
}

export function saveBrewersInSetup(brewers: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BREWERS_IN_SETUP, JSON.stringify(brewers));
  } catch (err) {
    console.error('Failed to save brewers in setup', err);
  }
}

export function loadKettlesInSetup(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KETTLES_IN_SETUP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return [loadKettle()];
  } catch {
    return [loadKettle()];
  }
}

export function saveKettlesInSetup(kettles: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.KETTLES_IN_SETUP, JSON.stringify(kettles));
  } catch (err) {
    console.error('Failed to save kettles in setup', err);
  }
}


// -------------------------------------------------------------
// Universal Adaptive Grind Intelligence (On-Device Local-First)
// -------------------------------------------------------------
import type { GrinderLearnedProfile, BeanCalibrationAnchor } from './grindIntelligence';
import { createDefaultGrinderProfile } from './grindIntelligence';

export function loadGrinderProfiles(): Record<string, GrinderLearnedProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRIND_INTELLIGENCE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function loadOrCreateGrinderProfile(grinderId: string): GrinderLearnedProfile {
  const profiles = loadGrinderProfiles();
  if (profiles[grinderId]) {
    return profiles[grinderId];
  }
  const defaultProfile = createDefaultGrinderProfile(grinderId);
  profiles[grinderId] = defaultProfile;
  saveGrinderProfile(defaultProfile);
  return defaultProfile;
}

export function saveGrinderProfile(profile: GrinderLearnedProfile): void {
  try {
    const profiles = loadGrinderProfiles();
    profiles[profile.grinderId] = profile;
    localStorage.setItem(STORAGE_KEYS.GRIND_INTELLIGENCE, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save grinder learned profile', err);
  }
}

export function loadBeanAnchors(): Record<string, BeanCalibrationAnchor> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BEAN_ANCHORS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveBeanAnchor(anchor: BeanCalibrationAnchor): void {
  try {
    const anchors = loadBeanAnchors();
    anchors[anchor.beanId] = anchor;
    localStorage.setItem(STORAGE_KEYS.BEAN_ANCHORS, JSON.stringify(anchors));
  } catch (err) {
    console.error('Failed to save bean anchor', err);
  }
}

export function getAnchorForBean(beanId: string): BeanCalibrationAnchor | undefined {
  const anchors = loadBeanAnchors();
  return anchors[beanId];
}

export function getLatestAnchorForGrinder(grinderId: string): BeanCalibrationAnchor | undefined {
  const anchors = loadBeanAnchors();
  const matches = Object.values(anchors).filter((a) => a.grinderId.toLowerCase() === grinderId.toLowerCase());
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => new Date(b.anchorTimestamp).getTime() - new Date(a.anchorTimestamp).getTime());
  return matches[0];
}


