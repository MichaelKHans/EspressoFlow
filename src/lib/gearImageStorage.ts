/**
 * Flowbean IndexedDB Gear Image Storage Engine (Etape 2)
 *
 * Solves the browser/WebView 5MB localStorage quota limit for user gear photos
 * and high-resolution packshots.
 *
 * Architecture:
 * 1. Synchronous In-Memory Cache: Prevents UI flash of missing images on render.
 * 2. Asynchronous IndexedDB Persistence: Holds tens of megabytes of user photos safely.
 * 3. Graceful Migration: Automatically evacuates legacy base64 strings from localStorage
 *    into IndexedDB on first startup, freeing up local storage space.
 * 4. Reactive Dispatch: Emits 'flowbean_gear_images_updated' custom events when images change.
 */

const DB_NAME = 'flowbean_media_v1';
const STORE_NAME = 'gear_images';
const DB_VERSION = 1;
const LEGACY_STORAGE_KEY = 'flowbean_gear_image_overrides_v1';

export interface StoredGearImage {
  key: string;
  gearName?: string;
  dataUrl: string;
  mimeType?: string;
  byteSize?: number;
  timestamp: number;
  isCustomUserPhoto?: boolean;
}

// In-memory sync cache for instant non-blocking render
const memoryCache = new Map<string, string>();
let isInitialized = false;
let dbPromise: Promise<IDBDatabase | null> | null = null;

function normalizeKey(key: string): string {
  return key.toLowerCase().trim();
}

/**
 * Opens or retrieves the IndexedDB database connection
 */
function getDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = (err) => {
          console.warn('[GearImageStorage] IndexedDB open error, falling back to in-memory:', err);
          resolve(null);
        };
      } catch (err) {
        console.warn('[GearImageStorage] IndexedDB unsupported or blocked:', err);
        resolve(null);
      }
    });
  }

  return dbPromise;
}

/**
 * Initializes the storage, populates the in-memory cache, and migrates legacy localStorage
 */
export async function initGearImageStorage(): Promise<void> {
  if (isInitialized) return;
  isInitialized = true;

  // 1. First populate from legacy localStorage if available (synchronous warm-up)
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacyMap = JSON.parse(legacyRaw);
      for (const [k, val] of Object.entries(legacyMap)) {
        const dataUrl = (val as any)?.dataUrl;
        if (dataUrl && typeof dataUrl === 'string') {
          memoryCache.set(normalizeKey(k), dataUrl);
        }
      }
    }
  } catch {
    // Ignore legacy read errors
  }

  // 2. Open IndexedDB and hydrate all stored items into memoryCache
  const db = await getDB();
  if (!db) return;

  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: StoredGearImage[] = req.result || [];
        for (const item of items) {
          if (item?.key && item?.dataUrl) {
            memoryCache.set(normalizeKey(item.key), item.dataUrl);
            if (item.gearName) {
              memoryCache.set(normalizeKey(item.gearName), item.dataUrl);
            }
          }
        }
        resolve();
      };

      req.onerror = () => resolve();
    });

    // 3. Migrate and evacuate legacy localStorage to IndexedDB to free 5MB quota
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      try {
        const legacyMap = JSON.parse(legacyRaw);
        const keys = Object.keys(legacyMap);
        if (keys.length > 0) {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const k of keys) {
            const entry = legacyMap[k];
            if (entry?.dataUrl) {
              const record: StoredGearImage = {
                key: normalizeKey(entry.gearKey || k),
                gearName: entry.gearName || k,
                dataUrl: entry.dataUrl,
                timestamp: entry.timestamp || Date.now(),
              };
              store.put(record);
            }
          }
        }
        // Clean legacy key to prevent QuotaExceededError
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        console.info(`[GearImageStorage] Migrated ${keys.length} legacy images to IndexedDB and freed localStorage.`);
      } catch (err) {
        console.warn('[GearImageStorage] Legacy migration error:', err);
      }
    }
  } catch (err) {
    console.warn('[GearImageStorage] Initialization failed:', err);
  }
}

/**
 * Synchronous read from memory cache. Never blocks rendering.
 */
export function getGearImageDataUrl(keyOrName: string): string | null {
  if (!keyOrName) return null;
  // Trigger async init if not already started
  if (!isInitialized) {
    void initGearImageStorage();
  }
  return memoryCache.get(normalizeKey(keyOrName)) || null;
}

/**
 * Saves a gear image (e.g. user photo or high-res packshot) into IndexedDB & memory cache.
 */
export async function saveGearImageDataUrl(
  key: string,
  dataUrl: string,
  options?: { gearName?: string; isCustomUserPhoto?: boolean }
): Promise<void> {
  const normKey = normalizeKey(key);
  const gearName = options?.gearName?.trim() || key;
  const normName = normalizeKey(gearName);

  // Update sync cache immediately
  memoryCache.set(normKey, dataUrl);
  memoryCache.set(normName, dataUrl);

  // Save to IndexedDB
  const db = await getDB();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record: StoredGearImage = {
          key: normKey,
          gearName,
          dataUrl,
          byteSize: dataUrl.length,
          timestamp: Date.now(),
          isCustomUserPhoto: options?.isCustomUserPhoto ?? true,
        };

        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[GearImageStorage] Failed to save to IndexedDB:', err);
    }
  }

  // Notify UI components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowbean_gear_images_updated', { detail: { key: normKey } }));
  }
}

/**
 * Deletes a gear image from IndexedDB & cache.
 */
export async function deleteGearImageDataUrl(keyOrName: string): Promise<void> {
  const normKey = normalizeKey(keyOrName);
  memoryCache.delete(normKey);

  const db = await getDB();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(normKey);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[GearImageStorage] Failed to delete from IndexedDB:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flowbean_gear_images_updated', { detail: { key: normKey } }));
  }
}

/**
 * Returns all active keys currently loaded in cache
 */
export function getAllCachedImageKeys(): string[] {
  return Array.from(memoryCache.keys());
}
