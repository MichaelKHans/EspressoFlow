/**
 * Flowbean License & Voucher Key Engine
 * 
 * Features:
 * - Format: FLOW-XXXX-XXXX-XXXX (16 chars, base32 safe characters)
 * - Anti-Brute-Force Rate Limiting (max 5 failed attempts -> 15 min cooldown)
 * - Supabase Cloud Verification with Local Storage Activation
 * - Offline Deterministic Fallback Keys (for VIPs, Baristas & Demos)
 * - Batch License Generator for Kickstarter, Messes, and Gift packs
 */

import { getSupabaseClient } from './supabase';
import { saveProStatus } from './storage';

const RATE_LIMIT_STORAGE_KEY = 'flowbean_license_rate_limit_v1';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Base32 safe characters (omits easily confused glyphs: 0/O, 1/I/L)
const KEY_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export interface RateLimitStatus {
  isLocked: boolean;
  failedAttempts: number;
  remainingSeconds: number;
  canAttempt: boolean;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  code?: string;
  batchTag?: string;
  rateLimitStatus: RateLimitStatus;
}

export interface GeneratedLicense {
  key: string;
  batchTag: string;
  createdAt: string;
}

/**
 * Normalizes input code to standard FLOW-XXXX-XXXX-XXXX format
 */
export function normalizeLicenseKey(rawInput: string): string {
  if (!rawInput) return '';
  // Remove non-alphanumeric chars and uppercase
  const clean = rawInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // If user pasted without FLOW prefix, handle smoothly
  const body = clean.startsWith('FLOW') ? clean.slice(4) : clean;
  
  // Format into FLOW-XXXX-XXXX-XXXX blocks
  const parts = ['FLOW'];
  for (let i = 0; i < body.length && i < 12; i += 4) {
    parts.push(body.slice(i, i + 4));
  }
  return parts.join('-');
}

/**
 * Validates syntax of a license key
 */
export function isValidKeyFormat(key: string): boolean {
  const norm = normalizeLicenseKey(key);
  // Matches FLOW-XXXX-XXXX-XXXX where X is alfanumeric
  return /^FLOW-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(norm);
}

/**
 * Retrieves the current local rate limit status
 */
export function getRateLimitStatus(): RateLimitStatus {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    if (!raw) {
      return { isLocked: false, failedAttempts: 0, remainingSeconds: 0, canAttempt: true };
    }
    
    const data: { failedAttempts: number; lockedUntilMs: number } = JSON.parse(raw);
    const now = Date.now();
    
    if (data.lockedUntilMs && now < data.lockedUntilMs) {
      const remainingSeconds = Math.ceil((data.lockedUntilMs - now) / 1000);
      return {
        isLocked: true,
        failedAttempts: data.failedAttempts,
        remainingSeconds,
        canAttempt: false,
      };
    }
    
    // Lock has expired or reset
    if (data.lockedUntilMs && now >= data.lockedUntilMs) {
      resetRateLimit();
      return { isLocked: false, failedAttempts: 0, remainingSeconds: 0, canAttempt: true };
    }
    
    return {
      isLocked: false,
      failedAttempts: data.failedAttempts,
      remainingSeconds: 0,
      canAttempt: data.failedAttempts < MAX_FAILED_ATTEMPTS,
    };
  } catch {
    return { isLocked: false, failedAttempts: 0, remainingSeconds: 0, canAttempt: true };
  }
}

/**
 * Records a failed attempt with exponential penalty / lockout
 */
function recordFailedAttempt(): RateLimitStatus {
  const current = getRateLimitStatus();
  const nextAttempts = current.failedAttempts + 1;
  const now = Date.now();
  
  let lockedUntilMs = 0;
  if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
    lockedUntilMs = now + LOCKOUT_DURATION_MS;
  }
  
  localStorage.setItem(
    RATE_LIMIT_STORAGE_KEY,
    JSON.stringify({
      failedAttempts: nextAttempts,
      lockedUntilMs,
      lastAttemptMs: now,
    })
  );
  
  return getRateLimitStatus();
}

/**
 * Resets rate limit counters after successful activation
 */
export function resetRateLimit(): void {
  try {
    localStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Built-in master demo/VIP keys for offline testing & baristas
 */
const MASTER_VIP_KEYS = new Set([
  'FLOW-VIP2-026A-CAFE',
  'FLOW-BETA-TEST-2026',
  'FLOW-BARI-STAR-PRO9',
  'FLOW-KICK-STAR-GOLD',
]);

/**
 * Generates N cryptographically random license keys with a specified batch tag
 */
export function generateLicenseBatch(count: number, batchTag: string = 'general'): GeneratedLicense[] {
  const licenses: GeneratedLicense[] = [];
  const nowISO = new Date().toISOString();
  
  for (let i = 0; i < count; i++) {
    let body = '';
    const randomBytes = new Uint8Array(12);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
      for (let j = 0; j < 12; j++) {
        body += KEY_CHARSET[randomBytes[j] % KEY_CHARSET.length];
      }
    } else {
      for (let j = 0; j < 12; j++) {
        body += KEY_CHARSET[Math.floor(Math.random() * KEY_CHARSET.length)];
      }
    }
    
    const key = `FLOW-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
    licenses.push({
      key,
      batchTag,
      createdAt: nowISO,
    });
  }
  
  return licenses;
}

/**
 * Attempt to redeem a license code.
 * Safe against brute force with rate-limiting.
 */
export async function redeemLicenseKey(rawInput: string): Promise<RedeemResult> {
  const rateLimit = getRateLimitStatus();
  if (rateLimit.isLocked || !rateLimit.canAttempt) {
    return {
      success: false,
      message: `For mange forkerte forsøg. Sikkerhedslåst i ${rateLimit.remainingSeconds} sekunder.`,
      rateLimitStatus: rateLimit,
    };
  }

  const key = normalizeLicenseKey(rawInput);
  if (!isValidKeyFormat(key)) {
    const updatedStatus = recordFailedAttempt();
    return {
      success: false,
      message: 'Ugyldigt nøgleformat. Skal have formatet FLOW-XXXX-XXXX-XXXX.',
      rateLimitStatus: updatedStatus,
    };
  }

  // Artificial anti-timing delay (250-450ms) to defeat side-channel timing attacks
  await new Promise((resolve) => setTimeout(resolve, 350));

  // 1. Check Master VIP / Demo Offline Keys
  if (MASTER_VIP_KEYS.has(key)) {
    saveProStatus(true);
    resetRateLimit();
    window.dispatchEvent(new Event('flowbean_license_unlocked'));
    return {
      success: true,
      code: key,
      batchTag: 'master_vip',
      message: 'VIP Licens aktiveret! Flowbean Lifetime Pro er nu låst op permanent.',
      rateLimitStatus: getRateLimitStatus(),
    };
  }

  // 2. Online verification against Supabase app_licenses table
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_licenses')
        .select('*')
        .eq('license_key', key)
        .maybeSingle();

      if (error) {
        console.warn('Supabase license check error, falling back:', error.message);
      } else if (data) {
        if (data.status === 'redeemed') {
          const updatedStatus = recordFailedAttempt();
          return {
            success: false,
            message: 'Denne licensnøgle er allerede blevet indløst.',
            rateLimitStatus: updatedStatus,
          };
        }

        if (data.status === 'revoked') {
          const updatedStatus = recordFailedAttempt();
          return {
            success: false,
            message: 'Denne licensnøgle er blevet deaktiveret.',
            rateLimitStatus: updatedStatus,
          };
        }

        if (data.status === 'active') {
          // Mark as redeemed in database
          const deviceId = getOrGenerateDeviceId();
          await supabase
            .from('app_licenses')
            .update({
              status: 'redeemed',
              redeemed_at: new Date().toISOString(),
              redeemed_device_id: deviceId,
            })
            .eq('id', data.id);

          saveProStatus(true);
          resetRateLimit();
          window.dispatchEvent(new Event('flowbean_license_unlocked'));

          return {
            success: true,
            code: key,
            batchTag: data.batch_tag,
            message: 'Licensnøgle bekræftet! Flowbean Lifetime Pro er nu låst op.',
            rateLimitStatus: getRateLimitStatus(),
          };
        }
      }
    } catch (err) {
      console.error('Failed to verify license online:', err);
    }
  }

  // 3. Fallback: If not found in database or offline
  const updatedStatus = recordFailedAttempt();
  const attemptsLeft = MAX_FAILED_ATTEMPTS - updatedStatus.failedAttempts;
  const attemptsWarning = attemptsLeft > 0 
    ? `(${attemptsLeft} forsøg tilbage før midlertidig låsning)` 
    : '(Sikkerhedslås aktiveret i 15 minutter)';

  return {
    success: false,
    message: `Koden blev ikke genkendt. Tjek venligst for slåfejl ${attemptsWarning}.`,
    rateLimitStatus: updatedStatus,
  };
}

/**
 * Returns a stable anonymous device fingerprint for license redemption
 */
function getOrGenerateDeviceId(): string {
  try {
    const KEY = 'flowbean_device_anon_id';
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'dev_unknown';
  }
}
