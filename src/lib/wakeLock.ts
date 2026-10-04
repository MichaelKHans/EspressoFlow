/**
 * Espresso Flow Screen Wake Lock Manager
 * Prevents screen dimming or sleeping during espresso extraction and scale monitoring
 * Uses standard HTML5 Screen Wake Lock API supported on iOS (WebKit 16.4+) and Android (Chromium).
 */

class ScreenWakeLockManager {
  private sentinel: WakeLockSentinel | null = null;
  private isRequested = false;

  constructor() {
    // Handle tab visibility changes: wake lock is released automatically by OS on background
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
    try {
      if ('wakeLock' in navigator && (!this.sentinel || this.sentinel.released)) {
        this.sentinel = await navigator.wakeLock.request('screen');
        this.sentinel.addEventListener('release', () => {
          this.sentinel = null;
        });
      }
    } catch (err) {
      console.debug('WakeLock acquire skipped or denied:', err);
    }
  }

  public async release(): Promise<void> {
    this.isRequested = false;
    try {
      if (this.sentinel && !this.sentinel.released) {
        await this.sentinel.release();
        this.sentinel = null;
      }
    } catch (err) {
      console.debug('WakeLock release skipped:', err);
    }
  }
}

export const wakeLock = new ScreenWakeLockManager();
