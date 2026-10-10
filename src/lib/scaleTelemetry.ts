/**
 * Espresso Flow - Flight Data Recorder (Scale Telemetry Engine)
 * Captures high-frequency computer vision metrics, raw vs filtered weights,
 * and diagnostic thumbnails for deep optical debugging.
 */

import { getSupabaseClient } from './supabase';

export interface TelemetrySample {
  timestampMs: number;
  rawText: string;
  rawWeight: number | null;
  filteredWeight: number;
  isOutlier: boolean;
  flowGps: number;
  confidence: number;
  polarity: string;
  candidatesCount: number;
  topScore: number;
}

export interface ScaleTelemetrySession {
  sessionId: string;
  createdAt: string;
  device: {
    userAgent: string;
    screenWidth: number;
    screenHeight: number;
    platform: string;
  };
  recipe: {
    beanName: string;
    doseGrams: number;
    targetYieldGrams: number;
    method: string;
  };
  summary: {
    totalFrames: number;
    outlierFrames: number;
    durationSeconds: number;
    peakFlowGps: number;
    finalWeightGrams: number;
  };
  samples: TelemetrySample[];
  initialImageBase64?: string;
  finalImageBase64?: string;
}

const STORAGE_KEY = 'flowbean_admin_telemetry_enabled';

/**
 * Checks whether Admin Flight Data Recorder is enabled
 */
export function isTelemetryEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Toggles Admin Flight Data Recorder
 */
export function setTelemetryEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('Failed to persist telemetry setting:', err);
  }
}

/**
 * Active In-Memory Telemetry Collector
 */
export class ScaleTelemetryCollector {
  private sessionId: string;
  private startTime: number = 0;
  private samples: TelemetrySample[] = [];
  private initialImage: string | undefined;
  private finalImage: string | undefined;
  private beanName: string = '';
  private doseGrams: number = 0;
  private targetYieldGrams: number = 0;
  private method: string = 'espresso';
  private isActive: boolean = false;

  constructor() {
    this.sessionId = `flight_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  public start(config: {
    beanName?: string;
    doseGrams?: number;
    targetYieldGrams?: number;
    method?: string;
    initialThumbnail?: string;
  }) {
    this.sessionId = `flight_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.startTime = Date.now();
    this.samples = [];
    this.beanName = config.beanName || 'Espresso';
    this.doseGrams = config.doseGrams || 18;
    this.targetYieldGrams = config.targetYieldGrams || 36;
    this.method = config.method || 'espresso';
    this.initialImage = config.initialThumbnail;
    this.finalImage = undefined;
    this.isActive = true;
  }

  public recordFrame(sample: Omit<TelemetrySample, 'timestampMs'>) {
    if (!this.isActive) return;
    const now = Date.now();
    const ms = this.startTime > 0 ? now - this.startTime : 0;
    
    // Store up to 1800 frames (~60 seconds at 30 FPS)
    if (this.samples.length < 1800) {
      this.samples.push({
        ...sample,
        timestampMs: ms,
      });
    }
  }

  public setInitialImage(base64: string) {
    if (!this.initialImage) {
      this.initialImage = base64;
    }
  }

  public setFinalImage(base64: string) {
    this.finalImage = base64;
  }

  public async finishAndUpload(): Promise<boolean> {
    if (!this.isActive || this.samples.length === 0) {
      this.isActive = false;
      return false;
    }
    this.isActive = false;

    const durationSeconds = this.samples.length > 0 ? (this.samples[this.samples.length - 1].timestampMs / 1000) : 0;
    const outlierCount = this.samples.filter((s) => s.isOutlier).length;
    const peakFlow = this.samples.reduce((max, s) => Math.max(max, s.flowGps), 0);
    const finalWeight = this.samples.length > 0 ? this.samples[this.samples.length - 1].filteredWeight : 0;

    const sessionPayload: ScaleTelemetrySession = {
      sessionId: this.sessionId,
      createdAt: new Date().toISOString(),
      device: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
        platform: typeof navigator !== 'undefined' ? (navigator.platform || 'mobile') : 'unknown',
      },
      recipe: {
        beanName: this.beanName,
        doseGrams: this.doseGrams,
        targetYieldGrams: this.targetYieldGrams,
        method: this.method,
      },
      summary: {
        totalFrames: this.samples.length,
        outlierFrames: outlierCount,
        durationSeconds: Math.round(durationSeconds * 10) / 10,
        peakFlowGps: Math.round(peakFlow * 10) / 10,
        finalWeightGrams: finalWeight,
      },
      samples: this.samples,
      initialImageBase64: this.initialImage,
      finalImageBase64: this.finalImage,
    };

    return await uploadScaleTelemetrySession(sessionPayload);
  }
}

/**
 * Uploads diagnostic telemetry session to Supabase
 */
export async function uploadScaleTelemetrySession(
  session: ScaleTelemetrySession
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[Telemetry] Supabase client unavailable, skipping telemetry upload.');
    return false;
  }

  try {
    const { error } = await client.from('scale_diagnostic_sessions').insert([
      {
        session_id: session.sessionId,
        device_info: session.device,
        recipe_info: session.recipe,
        summary_info: session.summary,
        telemetry_samples: session.samples,
        initial_image: session.initialImageBase64 || null,
        final_image: session.finalImageBase64 || null,
        created_at: session.createdAt,
      },
    ]);

    if (error) {
      console.warn('[Telemetry] Upload failed:', error.message);
      return false;
    }

    console.info(`[Telemetry] Session ${session.sessionId} successfully uploaded to Supabase (${session.samples.length} frames).`);
    return true;
  } catch (err) {
    console.warn('[Telemetry] Network error uploading telemetry:', err);
    return false;
  }
}
