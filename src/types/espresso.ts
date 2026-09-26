export type TasteRating = 'sour' | 'bitter' | 'balanced' | 'watery';

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

export interface ShotRecord {
  id: string;
  timestamp: string;
  coffeeName: string;
  roaster?: string;
  roastDate?: string;
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

