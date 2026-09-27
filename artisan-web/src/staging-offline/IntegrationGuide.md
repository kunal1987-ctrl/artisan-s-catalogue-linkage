# 🔌 Offline Outbox — Integration Guide

> **Status:** Staging · Do **NOT** merge into main until the hackathon screening is complete.

This guide explains exactly what to copy-paste into your production components when you're ready to go live with offline resilience.

---

## 1. Install Dependency

```bash
npm install idb
```

*(Already done if you ran the staging setup command.)*

---

## 2. Wire Up the Capture / Studio Page

Open your product-capture component (e.g., `src/pages/Capture.jsx` or `src/pages/Studio.jsx`) and make the following additions.

### 2a. Imports

Add these at the top of the file:

```jsx
import { saveToOutbox }   from '../staging-offline/db';
import useNetworkSync      from '../staging-offline/useNetworkSync';
```

### 2b. Use the Hook

Inside the component function, add:

```jsx
const { isOnline, isSyncing, pendingCount, forceSync } = useNetworkSync();
```

### 2c. Modify the Submit / Save Handler

Locate your existing submit handler (e.g., `handleSave`, `handleCapture`). Wrap the network call with an offline fallback:

```jsx
async function handleSave(productData) {
  if (!isOnline) {
    // ── Offline: queue to IndexedDB ──────────────────────
    await saveToOutbox({
      type: 'product_upload',
      data: {
        name: productData.name,
        description: productData.description,
        images: productData.images,       // base64 or blob URLs
        thumbnail: productData.images?.[0], // first image for card preview
      },
    });
    toast.info('📦 Saved offline — will upload when you're back online.');
    return;
  }

  // ── Online: push to Supabase as usual ────────────────
  // ... your existing Supabase / API call ...
}
```

### 2d. Show Pending Count in the Header (Optional)

If you want a small badge on the nav bar:

```jsx
{pendingCount > 0 && (
  <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
    {pendingCount} pending
  </span>
)}
```

---

## 3. Add the Outbox Page / Route

When you're ready to give users a dedicated page to view their pending uploads:

### 3a. Create a Route

In `App.jsx` (or your router config), add:

```jsx
import Outbox from './staging-offline/Outbox';

// Inside your <Routes>:
<Route path="/outbox" element={<Outbox />} />
```

### 3b. Navigation Link

Add a link to the outbox from your sidebar, bottom nav, or profile page:

```jsx
<Link to="/outbox">📦 Pending Uploads ({pendingCount})</Link>
```

---

## 4. Replace the Simulated API Call

Open `src/staging-offline/useNetworkSync.js` and find the `pushToServer()` function.

**Remove** the simulated `setTimeout` block and **uncomment** the real `fetch` implementation, updating the URL to your actual API endpoint:

```js
async function pushToServer(item) {
  const res = await fetch('/api/products/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item.data),
  });
  if (!res.ok) throw new Error(`Server responded ${res.status}`);
  return res.json();
}
```

Or, if using Supabase directly:

```js
async function pushToServer(item) {
  const { error } = await supabase
    .from('products')
    .insert(item.data);
  if (error) throw error;
}
```

---

## 5. File Overview

| File | Purpose |
|---|---|
| `staging-offline/db.js` | IndexedDB CRUD via `idb` — outbox store |
| `staging-offline/useNetworkSync.js` | React hook — online/offline tracking + auto-drain |
| `staging-offline/Outbox.jsx` | Standalone UI component — shows pending items |

---

## 6. Testing Offline Mode

1. Open Chrome DevTools → **Network** tab → set to **Offline**.
2. Submit a product — it should be saved to IndexedDB silently.
3. Toggle back to **Online** — the hook will auto-sync and the item will disappear from the outbox.
4. Check the console for `[sync] ✓ Pushed item …` logs.

---

*Questions? Ping the channel or check the staging branch.*
