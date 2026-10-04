import { registerPlugin } from '@capacitor/core';

/**
 * Espresso Flow Screen Wake Lock Manager
 * Prevents screen dimming or sleeping during espresso extraction and scale monitoring
 * Dual-layered:
 * 1. Native Capacitor bridge for iOS (isIdleTimerDisabled) & Android (FLAG_KEEP_SCREEN_ON)
 * 2. Standard HTML5 Screen Wake Lock API for modern browsers & WebViews
 */

interface NativeScreenLockPluginInterface {
  keepAwake(): Promise<{ isKeptAwake?: boolean }>;
  allowSleep(): Promise<{ isKeptAwake?: boolean }>;
}

const NativeScreenLock = registerPlugin<NativeScreenLockPluginInterface>('NativeScreenLock');

class ScreenWakeLockManager {
  private sentinel: WakeLockSentinel | null = null;
  private isRequested = false;

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.isRequested) {
          this.acquire();
        }
      });
    }
  }

  public async acquire(): Promise<void> {
    this.isRequested = true;

    // 1. Native bridge: iOS (UIApplication.shared.isIdleTimerDisabled) & Android (FLAG_KEEP_SCREEN_ON)
    try {
      await NativeScreenLock.keepAwake();
    } catch {
      // Running in browser or desktop environment
    }

    // 2. HTML5 Web standard Screen Wake Lock API
    try {
      if ('wakeLock' in navigator && (!this.sentinel || this.sentinel.released)) {
        this.sentinel = await navigator.wakeLock.request('screen');
        this.sentinel.addEventListener('release', () => {
          this.sentinel = null;
        });
      }
    } catch (err) {
      console.debug('HTML5 WakeLock acquire skipped or denied:', err);
    }
  }

  public async release(): Promise<void> {
    this.isRequested = false;

    // 1. Native bridge release
    try {
      await NativeScreenLock.allowSleep();
    } catch {
      // Running in browser or desktop environment
    }

    // 2. HTML5 Web standard release
    try {
      if (this.sentinel && !this.sentinel.released) {
        await this.sentinel.release();
        this.sentinel = null;
      }
    } catch (err) {
      console.debug('HTML5 WakeLock release skipped:', err);
    }
  }
}

export const wakeLock = new ScreenWakeLockManager();
