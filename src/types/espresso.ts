export type TasteRating = 'sour' | 'bitter' | 'balanced' | 'watery';
export type RoastLevel = 'light' | 'medium' | 'medium-dark' | 'dark';
export type RatioStyle = 'ristretto' | 'standard' | 'lungo' | 'allonge' | 'custom';
export type TempUnit = 'C' | 'F';

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
  brewTempC?: number; // Target brew temperature in Celsius (e.g. 93)
  dateOpened?: string; // ISO date string (YYYY-MM-DD) when the bag was unsealed
  notes?: string;
  barcode?: string;
  rating?: number; // 1 to 5 stars
  isFavorite?: boolean;
  purchaseCountry?: string; // e.g. 'DK', 'SE', 'NO', 'DE'
  purchaseLocation?: string; // Untappd-style store/venue (e.g. 'Føtex', 'Hedekaffe Gårdbutik', 'Meny', 'Online')
  suitableFor?: string[]; // e.g. ['pure_espresso', 'flat_white', 'cortado', 'cappuccino']
  communityRating?: number;
  communityVotes?: number;
  expertScore?: number; // 0-100 scale (e.g. 94.0 from Coffee Review or SCA Q-Grader)
  expertSource?: string; // e.g. 'Coffee Review' | 'SCA Cupping' | 'Cup of Excellence'
  imageUrl?: string; // Optional bag photo thumbnail (data URL or cloud link)
  flavorNotes?: string[]; // Vivino-style sensory flavor tags (e.g. ['Dark Chocolate', 'Caramel'])
  originCountry?: string; // Origin region or country (e.g. 'Colombia', 'Vestjylland')
  pourOverGrindSetting?: string; // Grind setting for filter / pour over
  pourOverDoseGrams?: number;
  pourOverTargetYieldGrams?: number;
}

export interface ShotRecord {
  id: string;
  timestamp: string;
  method?: BrewMethod; // 'espresso' | 'pour_over'
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
  bloomSeconds?: number; // Pour over bloom duration
  averageFlowGps: number;
  peakFlowGps: number;
  channeling: ChannelingEvent;
  channelingDetected: boolean;
  grinderName: string;
  grindSetting: string;
  machineName?: string;
  brewTempC?: number;
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
  inSetup?: boolean; // Whether user has this grinder in their personal setup / coffee bar
}

export interface EspressoMachineProfile {
  id: string;
  name: string;
  defaultPreInfusionSeconds: number;
  type: 'timed' | 'manual' | 'straight-9bar';
  tempControl?: 'pid' | 'stepped' | 'fixed';
  minTempC?: number; // e.g. 88
  maxTempC?: number; // e.g. 96
  defaultTempC?: number; // e.g. 93
}

export interface UserAccessState {
  isProLifetime: boolean;
  installTimestampMs: number;
  isWithinTrial: boolean;
  daysRemainingInTrial: number;
}

export type BrewMethod = 'espresso' | 'pour_over';

export interface PourOverGuide {
  bloomSeconds: number;       // e.g. 45
  bloomWaterGrams: number;    // e.g. 50
  targetFlowRateGps: number;  // e.g. 5.0
  flowRateMinGps: number;     // e.g. 4.0
  flowRateMaxGps: number;     // e.g. 6.0
  poursCount: number;         // e.g. 1, 3, or 5
  grindType: string;          // e.g. "Medium-Fine" or "Medium-Coarse"
  waterTempC: number;         // e.g. 93
  dripperType?: string;       // e.g. "V60 02"
  filterPaper?: string;       // e.g. "Tabbed White Paper"
  pouringTechnique?: string;  // e.g. "Concentric spirals from center out"
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
  | 'piccolo'
  | 'v60'
  | 'v60-kasuya'
  | 'chemex'
  | 'kalita-wave'
  | 'aeropress'
  | 'french-press';

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
  category: 'black' | 'milk' | 'dessert' | 'filter';
  method?: BrewMethod; // 'espresso' (default) | 'pour_over'
  brewStyle?: 'percolation' | 'immersion'; // 'percolation' (V60, Chemex) vs 'immersion' (AeroPress, French Press)
  steepSeconds?: number; // Total steep / infusion time before plunging
  plungeWarning?: boolean; // Warn barista to lift off scale before downward plunging
  defaultDoseGrams: number;
  targetYieldGrams: number;
  targetRatio: number;
  ratioStyle: RatioStyle;
  expectedTimeSeconds: number;
  cupVolumeMl?: number;
  glassStyle?: 'cup' | 'glass' | 'tall-glass' | 'demitasse' | 'server' | 'press';
  isDefaultActive?: boolean;
  idealRoastLevels?: RoastLevel[];
  pourOverGuide?: PourOverGuide;
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


