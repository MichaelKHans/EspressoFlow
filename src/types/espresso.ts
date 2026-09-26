export type TasteRating = 'sour' | 'bitter' | 'balanced' | 'watery';
export type RoastLevel = 'light' | 'medium' | 'medium-dark' | 'dark';
export type RatioStyle = 'ristretto' | 'standard' | 'lungo' | 'allonge' | 'custom';

export interface ShotDataPoint {
  timeSeconds: number;
  weightGrams: number;
  flowRateGps: number; // grams per second
}

export interface ChannelingEvent {
  detected: boolean;
  timestampSeconds?: number;
  flowSpikeGps?: number;
  severity: 'none' | 'mild' | 'severe';
  message?: string;
}

export interface CoffeeBeanProfile {
  id: string;
  name: string;
  roaster?: string;
  roastDate: string;
  roastLevel: RoastLevel;
  doseGrams: number;
  ratioStyle: RatioStyle;
  targetYieldGrams: number;
  grindSetting: string;
  grinderName: string;
  notes?: string;
  barcode?: string;
}

export interface ShotRecord {
  id: string;
  timestamp: string;
  coffeeName: string;
  roaster?: string;
  roastDate?: string;
  roastLevel?: RoastLevel;
  ratioStyle?: RatioStyle;
  drinkId?: string;
  drinkName?: string;
  doseGrams: number;
  targetYieldGrams: number;
  actualYieldGrams: number;
  totalTimeSeconds: number;
  preInfusionSeconds: number; // Time from pump on to first drop (>= 0.1g)
  flowTimeSeconds: number; // Active liquid extraction time
  averageFlowGps: number;
  peakFlowGps: number;
  channeling: ChannelingEvent;
  channelingDetected: boolean;
  grinderName: string;
  grindSetting: string;
  machineName?: string;
  tasteRating?: TasteRating;
  notes?: string;
  dataPoints: ShotDataPoint[];
}

export interface GrinderProfile {
  id: string;
  name: string;
  type: 'stepped' | 'stepless';
  defaultSetting: string;
  stepUnit: string; // e.g. "clicks", "numbers", "marks"
  secondsPerStep?: number; // Approximate extraction time delta (seconds) per step
}

export interface EspressoMachineProfile {
  id: string;
  name: string;
  defaultPreInfusionSeconds: number;
  type: 'timed' | 'manual' | 'straight-9bar';
}

export interface UserAccessState {
  isProLifetime: boolean;
  installTimestampMs: number;
  isWithinTrial: boolean;
  daysRemainingInTrial: number;
}

export type DrinkId =
  | 'cappuccino'
  | 'espresso'
  | 'single-espresso'
  | 'flat-white'
  | 'cortado'
  | 'latte'
  | 'macchiato'
  | 'ristretto'
  | 'lungo'
  | 'americano'
  | 'affogato'
  | 'cafe-bombon'
  | 'espresso-tonic'
  | 'mocha'
  | 'con-panna'
  | 'iced-latte'
  | 'shakerato'
  | 'allonge'
  | 'piccolo';

export interface DrinkLayer {
  name: string;
  percentage: number; // 0-100
  color: string;
  description: string;
  volumeMl?: number;
}

export interface DrinkRecipe {
  id: DrinkId;
  name: string;
  subtitle: string;
  category: 'black' | 'milk' | 'dessert';
  defaultDoseGrams: number;
  targetYieldGrams: number;
  targetRatio: number;
  ratioStyle: RatioStyle;
  expectedTimeSeconds: number;
  cupVolumeMl?: number;
  glassStyle?: 'cup' | 'glass' | 'tall-glass' | 'demitasse';
  isDefaultActive?: boolean;
  idealRoastLevels?: RoastLevel[];
  milkGuide?: {
    volumeMl: number;
    tempCelsius: number;
    foamStyle: string;
    ratioDescription: string;
  };
  waterGuide?: {
    volumeMl: number;
    tempCelsius: number;
    method: string;
    techniqueDescription: string;
  };
  layers: DrinkLayer[];
  description: string;
  dialInTip: string;
}


