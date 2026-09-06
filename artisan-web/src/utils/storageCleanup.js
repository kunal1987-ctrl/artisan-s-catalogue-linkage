/**
 * Storage Cleanup and Quota Management Utilities
 * Handles LevelDB/IndexedDB quota exhaustion (e.g., FILE_ERROR_NO_SPACE)
 * and unhandled browser storage corruption.
 */

const STORAGE_ERROR_PATTERNS = [
  'file_error_no_space',
  'quotaexceedederror',
  'ns_error_dom_quota_reached',
  'database or disk is full',
  'quota exceeded',
  'not enough storage',
  'leveldb',
  'storage quota',
];

/**
 * Checks whether an error is caused by storage quota exhaustion or LevelDB failure.
 * @param {any} error
 * @returns {boolean}
 */
export function isStorageQuotaError(error) {
  if (!error) return false;

  const message = String(error.message || error.name || error).toLowerCase();
  const code = error.code;

  // DOMException code 22 is QuotaExceededError
  if (code === 22 || code === 'QuotaExceededError') {
    return true;
  }

  return STORAGE_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

/**
 * Deletes all IndexedDB databases, Cache API entries, and clears local/session storage.
 * @returns {Promise<boolean>}
 */
export async function clearCorruptedStorage() {
  console.warn('[StorageCleanup] Initiating clean purge of browser storage...');

  try {
    // 1. Clear LocalStorage and SessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
      console.info('[StorageCleanup] Local & session storage cleared.');
    } catch (e) {
      console.error('[StorageCleanup] Error clearing web storage:', e);
    }

    // 2. Clear Cache Storage API if available
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
        console.info('[StorageCleanup] Cache API cleared:', cacheKeys);
      } catch (e) {
        console.error('[StorageCleanup] Error deleting caches:', e);
      }
    }

    // 3. Delete IndexedDB Databases
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      // Known databases used by ONNX, imgly, and local offline caches
      const knownDbs = [
        'imgly-background-removal',
        'onnxruntime-web',
        'ort-wasm-simd-threaded',
        'localforage',
        'keyval-store',
        'artisan-cache',
      ];

      // Try discovering databases dynamically if supported
      let allDbNames = [...knownDbs];
      if (typeof indexedDB.databases === 'function') {
        try {
          const dbs = await indexedDB.databases();
          dbs.forEach((db) => {
            if (db.name && !allDbNames.includes(db.name)) {
              allDbNames.push(db.name);
            }
          });
        } catch (e) {
          console.warn('[StorageCleanup] indexedDB.databases() failed, falling back to known names', e);
        }
      }

      // Delete each DB
      const deletePromises = allDbNames.map(
        (dbName) =>
          new Promise((resolve) => {
            try {
              const request = indexedDB.deleteDatabase(dbName);
              request.onsuccess = () => {
                console.info(`[StorageCleanup] Deleted IndexedDB: ${dbName}`);
                resolve(true);
              };
              request.onerror = () => {
                console.warn(`[StorageCleanup] Failed to delete IndexedDB: ${dbName}`);
                resolve(false);
              };
              request.onblocked = () => {
                console.warn(`[StorageCleanup] IndexedDB delete blocked: ${dbName}`);
                resolve(false);
              };
            } catch (err) {
              console.warn(`[StorageCleanup] Error requesting delete for ${dbName}:`, err);
              resolve(false);
            }
          })
      );

      await Promise.all(deletePromises);
    }

    console.info('[StorageCleanup] Storage purge completed successfully.');
    return true;
  } catch (error) {
    console.error('[StorageCleanup] Purge encountered unexpected error:', error);
    return false;
  }
}

/**
 * Checks whether an error originates from an external browser extension
 * (e.g., AdBlock, password managers, or injected content scripts like globals-front.js, content.js).
 */
export function isExtensionError(error) {
  if (!error) return false;
  const msg = String(error.message || error.name || error.reason || error).toLowerCase();
  const stack = String(error.stack || '').toLowerCase();

  return (
    msg.includes('writablefileappend') ||
    msg.includes('000188.ldb') ||
    msg.includes('.ldb') ||
    msg.includes('globals-front.js') ||
    msg.includes('content.js') ||
    stack.includes('chrome-extension://') ||
    stack.includes('moz-extension://') ||
    stack.includes('globals-front.js') ||
    stack.includes('content.js')
  );
}

/**
 * Automatically sets up global window error and unhandledrejection handlers
 * to suppress third-party extension LevelDB crashes and gracefully manage app quota errors.
 */
export function setupGlobalStorageErrorHandler() {
  if (typeof window === 'undefined') return;

  const handleRejectionOrError = (event, isRejection) => {
    const errorObj = isRejection ? event.reason : (event.error || event.message);

    // 1. If this is an external browser extension LevelDB error (e.g., AdBlock WritableFileAppend),
    // intercept and silence it immediately so it doesn't pollute the console or crash the app.
    if (isExtensionError(errorObj)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn('[StorageCleanup] Silenced external browser extension LevelDB error:', errorObj?.message || errorObj);
      return true;
    }

    // 2. If it's an app-level storage quota error, handle gracefully without blind reload loops
    if (isStorageQuotaError(errorObj)) {
      event.preventDefault();
      console.warn('[StorageCleanup] Application storage quota error intercepted:', errorObj);
      clearCorruptedStorage().catch((err) => {
        console.error('[StorageCleanup] Background storage purge failed:', err);
      });
      return true;
    }

    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    handleRejectionOrError(event, true);
  }, true);

  window.addEventListener('error', (event) => {
    handleRejectionOrError(event, false);
  }, true);
}

