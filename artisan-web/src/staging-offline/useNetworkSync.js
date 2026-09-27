/**
 * useNetworkSync.js — Auto-Sync Engine (Staging)
 *
 * A custom React hook that:
 *  1. Tracks real-time online / offline status.
 *  2. When connectivity is restored, drains the IndexedDB outbox
 *     by pushing each item to the server and removing it on success.
 *  3. Exposes `isSyncing` and `syncError` for UI feedback.
 *
 * Usage:
 *   const { isOnline, isSyncing, pendingCount, syncError, forceSync } = useNetworkSync();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOutboxItems,
  removeFromOutbox,
  updateOutboxItem,
} from './db';

// ------------------------------------------------------------------
// Replace this URL with your actual API endpoint when integrating.
// For staging, every call resolves after a short simulated delay.
// ------------------------------------------------------------------
const API_ENDPOINT = '/api/products/sync';
const SIMULATED_DELAY_MS = 800;

/**
 * Simulate pushing a single outbox item to the server.
 * Replace this function body with a real `fetch` / `supabase.from(...)`
 * call during integration.
 */
async function pushToServer(item) {
  // ── Real implementation (uncomment when ready) ──────────────
  // const res = await fetch(API_ENDPOINT, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(item.data),
  // });
  // if (!res.ok) throw new Error(`Server responded ${res.status}`);
  // return res.json();

  // ── Simulated implementation ────────────────────────────────
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 5 % random failure rate so you can test retry logic
      if (Math.random() < 0.05) {
        reject(new Error('Simulated network failure'));
      } else {
        console.log('[sync] ✓ Pushed item', item.id, item.data?.name ?? '');
        resolve({ ok: true });
      }
    }, SIMULATED_DELAY_MS);
  });
}

// ------------------------------------------------------------------

export default function useNetworkSync() {
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [isSyncing, setIsSyncing]     = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError]     = useState(null);

  // Prevent concurrent processOutbox runs.
  const lockRef = useRef(false);

  // ── Network status listeners ────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ── Refresh pending count on mount & after every sync ───────
  const refreshCount = useCallback(async () => {
    try {
      const items = await getOutboxItems();
      setPendingCount(items.length);
    } catch {
      /* IndexedDB can throw in private / incognito — ignore */
    }
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  // ── Core sync engine ────────────────────────────────────────
  const processOutbox = useCallback(async () => {
    if (lockRef.current) return;          // already running
    if (!navigator.onLine) return;        // still offline

    lockRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const items = await getOutboxItems();
      if (items.length === 0) return;

      for (const item of items) {
        // Mark as "syncing" so the UI can reflect the state
        await updateOutboxItem(item.id, { status: 'syncing' });

        try {
          await pushToServer(item);
          await removeFromOutbox(item.id);
        } catch (err) {
          console.warn('[sync] ✗ Failed to push item', item.id, err.message);
          await updateOutboxItem(item.id, {
            status: 'failed',
            retryCount: (item.retryCount || 0) + 1,
            lastError: err.message,
          });
          setSyncError(err.message);
        }
      }
    } catch (err) {
      console.error('[sync] Fatal outbox error', err);
      setSyncError(err.message);
    } finally {
      lockRef.current = false;
      setIsSyncing(false);
      await refreshCount();
    }
  }, [refreshCount]);

  // ── Auto-trigger when connectivity is restored ──────────────
  useEffect(() => {
    if (isOnline) {
      processOutbox();
    }
  }, [isOnline, processOutbox]);

  // ── Public API ──────────────────────────────────────────────
  return {
    /** Current browser connectivity status */
    isOnline,
    /** True while the outbox is actively being drained */
    isSyncing,
    /** Number of items remaining in the outbox */
    pendingCount,
    /** Last error message (null when everything is fine) */
    syncError,
    /** Manually trigger a sync attempt */
    forceSync: processOutbox,
    /** Manually refresh the pending count */
    refreshCount,
  };
}
