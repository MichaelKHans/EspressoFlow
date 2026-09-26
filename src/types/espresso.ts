export type TasteRating = 'sour' | 'bitter' | 'balanced' | 'watery';

export interface ShotDataPoint {
  timeSeconds: number;
  weightGrams: number;
  flowRateGps: number; // grams per second
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
  averageFlowGps: number;
  peakFlowGps: number;
  channelingDetected: boolean;
  grinderName: string;
  grindSetting: string;
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

export interface UserAccessState {
  isProLifetime: boolean;
  installTimestampMs: number;
  isWithinTrial: boolean;
  daysRemainingInTrial: number;
}
