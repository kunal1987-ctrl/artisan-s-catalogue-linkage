/**
 * cacheCleaner.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shilp Setu — Data Integrity & Cache Purge Utility
 *
 * Purges stale demo items, phantom data, and mock caches lingering in:
 *  • localStorage
 *  • sessionStorage
 *  • IndexedDB
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function clearStaleCatalogCache() {
  if (typeof window === 'undefined') return;

  try {
    // 1. Target known stale cache keys
    const staleKeys = [
      'mock_products',
      'demo_products',
      'artisan_mock_items',
      'artisan_cached_products',
      'catalog_cache',
      'initial_products',
      'shilp_setu_demo_catalog',
      'shilp_setu_preview_items',
    ];

    staleKeys.forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
      try { sessionStorage.removeItem(k); } catch {}
    });

    // 2. Clear any keys containing demo, mock, or phantom
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('demo_') ||
          key.startsWith('mock_') ||
          key.toLowerCase().includes('phantom') ||
          key.toLowerCase().includes('mockproduct'))
      ) {
        try { localStorage.removeItem(key); } catch {}
      }
    }

    // 3. Clear demo IndexedDB stores if present
    if (window.indexedDB && typeof window.indexedDB.databases === 'function') {
      try {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (
            db.name &&
            (db.name.toLowerCase().includes('mock') ||
              db.name.toLowerCase().includes('demo') ||
              db.name.toLowerCase().includes('phantom'))
          ) {
            try {
              window.indexedDB.deleteDatabase(db.name);
            } catch (idbErr) {
              console.warn('[cacheCleaner] IndexedDB delete skipped:', idbErr);
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[cacheCleaner] Cache purge notice:', err);
  }
}

export default clearStaleCatalogCache;
