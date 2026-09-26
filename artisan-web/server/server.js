/**
 * Shilp Setu — Express API Backend
 * ----------------------------------
 * Exposes REST endpoints for:
 *   1. POST /api/orders/new         — Simulate a buyer purchase notification
 *   2. POST /api/demo/trigger-khata — Force-send a Khata PDF (hackathon demo)
 *   3. GET  /api/whatsapp/status    — Health check for WhatsApp client
 *
 * Starts the WhatsApp Web client on boot for persistent session.
 */

const express = require('express');
const cors = require('cors');
const {
  initWhatsAppClient,
  isClientReady,
  sendNewOrderNotification,
  generateAndSendKhata
} = require('./whatsappService');

// ─── App Configuration ────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',   // Vite dev server
    'http://localhost:5174',   // Vite alt port
    'http://localhost:3000',   // CRA fallback
    /\.vercel\.app$/           // Vercel deployments
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// ─── Initialize WhatsApp on server start ──────────────────────────
initWhatsAppClient();

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: isClientReady() ? 'connected' : 'disconnected',
    message: isClientReady()
      ? 'WhatsApp client is authenticated and ready.'
      : 'WhatsApp client is not ready. Check terminal for QR code.',
    timestamp: new Date().toISOString()
  });
});

// ─── POST /api/orders/new ─────────────────────────────────────────
// Simulates a buyer purchasing an item; sends a WhatsApp notification
// to the artisan's phone number asking for order confirmation.
//
// Body: { phoneNumber: "9876543210", itemName: "Terracotta Vase" }
app.post('/api/orders/new', async (req, res) => {
  try {
    const { phoneNumber, itemName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: phoneNumber'
      });
    }

    // Pre-flight: ensure WhatsApp session is active
    if (!isClientReady()) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client is not connected. Scan QR code first.'
      });
    }

    const result = await sendNewOrderNotification(phoneNumber, itemName || 'Handcrafted Product');

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (err) {
    console.error('[API /api/orders/new] Unhandled error:', err);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${err.message}`
    });
  }
});

// ─── POST /api/demo/trigger-khata ─────────────────────────────────
// Hackathon demo endpoint: generates a Khata (weekly ledger) PDF
// and sends it to the specified WhatsApp number.
//
// Body: { phoneNumber: "9876543210" }
app.post('/api/demo/trigger-khata', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: phoneNumber'
      });
    }

    // Pre-flight: ensure WhatsApp session is active
    if (!isClientReady()) {
      return res.status(503).json({
        success: false,
        error: 'WhatsApp client is not connected. Scan QR code first.'
      });
    }

    console.log(`[API] 🛠 Demo: Triggering Khata PDF for ${phoneNumber}...`);
    const result = await generateAndSendKhata(phoneNumber);

    if (result.success) {
      return res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.message
      });
    }
  } catch (err) {
    console.error('[API /api/demo/trigger-khata] Unhandled error:', err);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${err.message}`
    });
  }
});

// ─── 404 Catch-all ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist.`,
    availableEndpoints: [
      'GET  /api/whatsapp/status',
      'POST /api/orders/new',
      'POST /api/demo/trigger-khata'
    ]
  });
});

// ─── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  🚀 Shilp Setu Backend running on port ${PORT}`);
  console.log(`  📡 API:       http://localhost:${PORT}`);
  console.log(`  💬 WhatsApp:  Initializing... (check QR below)`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
