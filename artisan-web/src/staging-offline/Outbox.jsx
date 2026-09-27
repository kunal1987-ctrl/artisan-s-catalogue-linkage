/**
 * Outbox.jsx — Pending Uploads UI (Staging)
 *
 * Standalone React component that reads the IndexedDB outbox and
 * renders each queued product as a card with real-time status:
 *
 *   🔴 Waiting for Network   (offline)
 *   🟡 Retrying…             (failed, will retry)
 *   🟢 Syncing…              (online, being pushed)
 *   ✅ Sent                  (will disappear shortly)
 *
 * Drop this component anywhere in your tree. It self-manages its
 * own data fetching via useEffect + polling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getOutboxItems, clearOutbox } from './db';
import useNetworkSync from './useNetworkSync';

// ── Styles (co-located for portability) ──────────────────────
const styles = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    padding: '1rem',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  badge: (isOnline) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 9999,
    fontSize: '0.75rem',
    fontWeight: 600,
    background: isOnline
      ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
      : 'linear-gradient(135deg, #fee2e2, #fecaca)',
    color: isOnline ? '#065f46' : '#991b1b',
  }),
  dot: (isOnline) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: isOnline ? '#10b981' : '#ef4444',
    animation: isOnline ? 'pulse-green 1.5s infinite' : 'none',
  }),
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: '2.5rem',
    marginBottom: '0.75rem',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    marginBottom: '0.65rem',
    borderRadius: 12,
    background: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  cardThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    objectFit: 'cover',
    backgroundColor: '#f1f5f9',
    flexShrink: 0,
  },
  cardThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#1e293b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardMeta: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: 2,
  },
  statusPill: (status) => {
    const map = {
      pending:  { bg: '#fef2f2', color: '#dc2626', label: '🔴 Waiting for Network' },
      syncing:  { bg: '#f0fdf4', color: '#16a34a', label: '🟢 Syncing…' },
      failed:   { bg: '#fffbeb', color: '#d97706', label: '🟡 Retrying…' },
    };
    const cfg = map[status] || map.pending;
    return {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 9999,
      fontSize: '0.7rem',
      fontWeight: 600,
      backgroundColor: cfg.bg,
      color: cfg.color,
    };
  },
  statusLabel: (status) => {
    const map = {
      pending: '🔴 Waiting for Network',
      syncing: '🟢 Syncing…',
      failed:  '🟡 Retrying…',
    };
    return map[status] || map.pending;
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  btn: (variant) => ({
    flex: 1,
    padding: '0.65rem 1rem',
    border: 'none',
    borderRadius: 10,
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.15s ease',
    ...(variant === 'primary'
      ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }
      : { background: '#f1f5f9', color: '#475569' }),
  }),
  counter: {
    fontSize: '0.8rem',
    color: '#64748b',
    fontWeight: 500,
  },
};

// ── Keyframes (injected once) ────────────────────────────────
const KEYFRAMES_ID = 'outbox-keyframes';
function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes pulse-green {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.4; }
    }
  `;
  document.head.appendChild(style);
}

// ── Component ────────────────────────────────────────────────
export default function Outbox() {
  const { isOnline, isSyncing, forceSync, refreshCount } = useNetworkSync();
  const [items, setItems] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const all = await getOutboxItems();
      setItems(all);
    } catch {
      /* noop */
    }
  }, []);

  // Initial fetch + 2-second poll so the list stays fresh
  useEffect(() => {
    injectKeyframes();
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [refresh]);

  // Also refresh right after sync finishes
  useEffect(() => {
    if (!isSyncing) refresh();
  }, [isSyncing, refresh]);

  const handleForceSync = async () => {
    await forceSync();
    await refresh();
    await refreshCount();
  };

  const handleClear = async () => {
    if (window.confirm('Clear all pending uploads? This cannot be undone.')) {
      await clearOutbox();
      await refresh();
      await refreshCount();
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>📦 Upload Outbox</div>
          <div style={styles.counter}>{items.length} item{items.length !== 1 ? 's' : ''} queued</div>
        </div>
        <div style={styles.badge(isOnline)}>
          <span style={styles.dot(isOnline)} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>✅</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>All caught up!</div>
          <div>No pending uploads in the outbox.</div>
        </div>
      )}

      {/* Outbox items */}
      {items.map((item) => (
        <div
          key={item.id}
          style={styles.card}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)';
          }}
        >
          {/* Thumbnail or placeholder */}
          {item.data?.thumbnail ? (
            <img src={item.data.thumbnail} alt="" style={styles.cardThumb} />
          ) : (
            <div style={styles.cardThumbPlaceholder}>🖼️</div>
          )}

          {/* Body */}
          <div style={styles.cardBody}>
            <div style={styles.cardName}>
              {item.data?.name || item.type || 'Untitled Product'}
            </div>
            <div style={styles.cardMeta}>
              Queued at {formatTime(item.createdAt)}
              {item.retryCount > 0 && ` · ${item.retryCount} retries`}
            </div>
          </div>

          {/* Status pill */}
          <span style={styles.statusPill(isOnline ? (item.status || 'syncing') : 'pending')}>
            {styles.statusLabel(isOnline ? (item.status || 'syncing') : 'pending')}
          </span>
        </div>
      ))}

      {/* Action buttons */}
      {items.length > 0 && (
        <div style={styles.actions}>
          <button
            style={styles.btn('primary')}
            onClick={handleForceSync}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? '⏳ Syncing…' : '🔄 Force Sync Now'}
          </button>
          <button style={styles.btn('secondary')} onClick={handleClear}>
            🗑️ Clear All
          </button>
        </div>
      )}
    </div>
  );
}
