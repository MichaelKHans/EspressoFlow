/**
 * antiLiveSync.ts
 * Real-time bidirectional telemetry & test control between Mobile App and Antigravity Agent.
 * Uses Supabase Realtime Broadcast channels for zero-latency, sub-50ms peer-to-peer streaming.
 */

import { getSupabaseClient } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveFramePayload {
  timestamp: number;
  weight: number;
  rawText: string;
  confidence: number;
  flow: number;
  isOutlier: boolean;
  polarity: string;
  isBrewing: boolean;
  fps?: number;
}

const STORAGE_SYNC_KEY = 'flowbean_anti_live_sync_enabled';
const CHANNEL_NAME = 'anti-testbed-live';

let activeChannel: RealtimeChannel | null = null;
let lastSentTime = 0;

/**
 * Checks if live streaming to Antigravity is enabled
 */
export function isAntiLiveSyncEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_SYNC_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets live streaming state
 */
export function setAntiLiveSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, enabled ? 'true' : 'false');
  } catch (err) {
    console.warn('Failed to persist live sync state:', err);
  }
}

/**
 * Initializes or returns active Supabase broadcast channel
 */
export function getAntiLiveChannel(): RealtimeChannel | null {
  if (activeChannel) return activeChannel;

  const client = getSupabaseClient();
  if (!client) return null;

  try {
    activeChannel = client.channel(CHANNEL_NAME, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    activeChannel.subscribe((status) => {
      console.log(`[AntiLiveSync] Channel status: ${status}`);
    });

    return activeChannel;
  } catch (err) {
    console.warn('[AntiLiveSync] Failed to create channel:', err);
    return null;
  }
}

/**
 * Broadcasts a live telemetry frame to Antigravity (throttled to max 5 Hz to conserve battery and bandwidth)
 */
export function broadcastLiveFrame(payload: LiveFramePayload): void {
  if (!isAntiLiveSyncEnabled()) return;

  const now = Date.now();
  if (now - lastSentTime < 200) return; // 5 FPS throttle
  lastSentTime = now;

  const channel = getAntiLiveChannel();
  if (!channel) return;

  channel.send({
    type: 'broadcast',
    event: 'live_frame',
    payload,
  }).catch(() => {});
}

export type RemoteAction =
  | 'start_shot'
  | 'stop_shot'
  | 'tare'
  | 'calibrate'
  | 'run_scenario'
  | 'stop'
  | 'close_modal'
  | 'switch_tab'
  | 'set_method';

export interface RemoteCommandPayload {
  action: RemoteAction;
  name?: string;
  source?: string;
  timestamp?: number;
}

/**
 * Sends a command from Mobile to PC Simulator to start a specific test scenario
 */
export function triggerRemoteScenario(scenarioName: 'standard' | 'spike' | 'digits' | 'timer' | 'stop'): void {
  const channel = getAntiLiveChannel();
  if (!channel) return;

  channel.send({
    type: 'broadcast',
    event: 'remote_cmd',
    payload: {
      action: scenarioName === 'stop' ? 'stop' : 'run_scenario',
      name: scenarioName,
      source: 'mobile_app',
      timestamp: Date.now(),
    },
  }).then(() => {
    console.log(`[AntiLiveSync] Remote command sent from mobile: ${scenarioName}`);
  }).catch((err) => {
    console.warn('[AntiLiveSync] Failed to send remote command:', err);
  });
}

/**
 * Subscribes to incoming remote control commands from Antigravity PC agent
 */
export function subscribeToRemoteCommands(callback: (cmd: RemoteCommandPayload) => void): () => void {
  const channel = getAntiLiveChannel();
  if (!channel) return () => {};

  const handler = (payload: { payload: RemoteCommandPayload }) => {
    if (payload && payload.payload) {
      callback(payload.payload);
    }
  };

  channel.on('broadcast', { event: 'remote_cmd' }, handler);

  return () => {
    // Channel remains open for telemetry streaming
  };
}
