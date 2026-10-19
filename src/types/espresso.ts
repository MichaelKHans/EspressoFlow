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
  reason?: 'sustained_midshot_surge' | 'rapid_puck_erosion';
}

export type FlowProfileType =
  | 'declining'      // Ideal lever / healthy puck compression (flow tapers gently)
  | 'flat'           // Steady 9-bar pump extraction
  | 'accelerating'   // Late-shot puck erosion / soluble washout
  | 'gushing'        // Coarse grind / low resistance throughout
  | 'choked';        // Overly fine grind / restricted dripping

export interface ExtractionTelemetrySummary {
  preInfusionSeconds: number;
  activeFlowSeconds: number;
  finalYieldGrams: number;
  steadyFlowGps: number;
  peakMidShotFlowGps: number;
  flowSlopeGps2: number;
  flowStabilityPercent: number;
  flowProfile: FlowProfileType;
  puckAnomaly: ChannelingEvent;
}

export type RepurchaseVerdict = 'buy_again' | 'neutral' | 'never_again';
export type PriceTier = 'budget' | 'standard' | 'premium' | 'ultra_rare';

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
  dateFinished?: string; // ISO date string (YYYY-MM-DD) when the bag was emptied
  isFinished?: boolean; // True if archived / emptied
  repurchaseVerdict?: RepurchaseVerdict; // Barista repurchase recommendation
  finishNotes?: string; // Final thoughts / tasting note upon finishing the bag
  bagCount?: number; // Total number of times this specific coffee has been purchased/enjoyed (1, 2, 3...)
  shotsCount?: number; // Number of shots brewed on this specific bag
  notes?: string;
  barcode?: string;
  rating?: number; // 1 to 5 stars
  isFavorite?: boolean;
  purchaseCountry?: string; // e.g. 'DK', 'SE', 'NO', 'DE'
  purchaseLocation?: string; // Retail store/venue (e.g. 'Føtex', 'Hedekaffe Gårdbutik', 'Meny', 'Online')
  suitableFor?: string[]; // e.g. ['pure_espresso', 'flat_white', 'cortado', 'cappuccino']
  communityRating?: number;
  communityVotes?: number;
  expertScore?: number; // 0-100 scale (e.g. 94.0 from Coffee Review or SCA Q-Grader)
  expertSource?: string; // e.g. 'Coffee Review' | 'SCA Cupping' | 'Cup of Excellence'
  imageUrl?: string; // Optional bag photo thumbnail (data URL or cloud link)
  flavorNotes?: string[]; // Beandex sensory flavor tags (e.g. ['Dark Chocolate', 'Caramel'])
  originCountry?: string; // Origin region or country (e.g. 'Colombia', 'Vestjylland')
  species?: '100% Arabica' | '100% Robusta' | 'Arabica / Robusta Blend' | 'Liberica' | string; // Botanical coffee species
  varietal?: string; // Botanical varietals (e.g. 'Geisha', 'SL28 / SL34', 'Bourbon', 'Catuaí', 'Heirloom', 'Caturra')
  processMethod?: 'washed' | 'natural' | 'honey' | 'anaerobic' | 'monsooned' | 'pulped natural' | string;
  priceTier?: PriceTier; // 'budget' | 'standard' | 'premium' | 'ultra_rare'
  approxPriceDkk?: number; // Retail price estimate in DKK for 250g
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
  flowProfile?: FlowProfileType;
  flowStabilityPercent?: number;
  grinderName: string;
  grindSetting: string;
  machineName?: string;
  filterBrewer?: string;
  kettleName?: string;
  waterVolumeMl?: number;
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
  burrType?: string; // e.g. "M2 40mm Steel Conical"
  minSetting?: number; // e.g. 1
  maxSetting?: number; // e.g. 40
  espressoMaxSetting?: number; // e.g. 20 (for dual-zone grinders like Baratza ESP)
}

export type MachineCategory = 'manual' | 'combo' | 'super_automatic';

export interface EspressoMachineProfile {
  id: string;
  name: string;
  defaultPreInfusionSeconds: number;
  type: 'timed' | 'manual' | 'straight-9bar';
  category?: MachineCategory;
  hasBuiltInGrinder?: boolean;
  builtInGrinderName?: string;
  builtInGrinderType?: 'stepped' | 'stepless';
  builtInGrinderSteps?: string;
  tempControl?: 'pid' | 'stepped' | 'fixed';
  minTempC?: number; // e.g. 88
  maxTempC?: number; // e.g. 96
  defaultTempC?: number; // e.g. 93
  preInfusionControl?: 'adjustable' | 'fixed' | 'none';
  preInfusionNote?: string;
  maxPumpBar?: number;
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
  glassStyle?: 'cup' | 'glass' | 'tall-glass' | 'demitasse' | 'server' | 'press' | 'chemex' | 'kalita' | 'aeropress' | 'french-press';
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


