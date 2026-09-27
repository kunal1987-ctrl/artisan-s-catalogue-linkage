/**
 * db.js — IndexedDB Storage Layer (Staging)
 *
 * Uses the `idb` library to provide a lightweight outbox store
 * for offline-first product uploads. Every item that cannot be
 * pushed to the server immediately is persisted here and replayed
 * when connectivity is restored.
 *
 * Database : shilp-setu-staging-db  (v1)
 * Store    : outbox
 */

import { openDB } from 'idb';

const DB_NAME    = 'shilp-setu-staging-db';
const DB_VERSION = 1;
const STORE_NAME = 'outbox';

/**
 * Open (or create) the IndexedDB database.
 * The outbox store uses auto-incrementing keys so each item gets
 * a unique numeric `id` that can be used for targeted removal.
 */
function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
}

/**
 * Persist a payload in the outbox.
 *
 * @param {Object} payload — The product data to queue.
 *   Expected shape (example):
 *   {
 *     type: 'product_upload',
 *     data: { name, description, images[], ... },
 *     createdAt: Date.now(),
 *   }
 * @returns {Promise<number>} The auto-generated outbox ID.
 */
export async function saveToOutbox(payload) {
  const db = await getDB();
  const item = {
    ...payload,
    createdAt: payload.createdAt ?? Date.now(),
    status: 'pending',           // pending | syncing | failed
    retryCount: 0,
  };
  const id = await db.add(STORE_NAME, item);
  return id;
}

/**
 * Retrieve every item currently sitting in the outbox.
 *
 * @returns {Promise<Array>} All queued outbox items.
 */
export async function getOutboxItems() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * Remove a single item from the outbox after it has been
 * successfully synced to the server.
 *
 * @param {number} id — The outbox item's auto-generated key.
 */
export async function removeFromOutbox(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * Update an existing outbox item (e.g. bump retryCount or status).
 *
 * @param {number} id
 * @param {Object} patch — Fields to merge into the existing record.
 */
export async function updateOutboxItem(id, patch) {
  const db = await getDB();
  const tx   = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const item  = await store.get(id);
  if (item) {
    await store.put({ ...item, ...patch });
  }
  await tx.done;
}

/**
 * Nuke the entire outbox (useful during dev / testing).
 */
export async function clearOutbox() {
  const db = await getDB();
  await db.clear(STORE_NAME);
}
