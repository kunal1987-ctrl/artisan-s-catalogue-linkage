/**
 * WhatsApp Service for Shilp Setu
 * ---------------------------------
 * Handles WhatsApp Web client lifecycle, order confirmations,
 * and Khata PDF generation + delivery via whatsapp-web.js.
 *
 * IMPORTANT: This service must be `require()`d only once (singleton).
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Client Singleton ──────────────────────────────────────────────
let client = null;
let isReady = false;

/**
 * Formats a 10-digit Indian phone number into whatsapp-web.js chat ID format.
 * Strips any leading "+91", "91", or "0" prefix, then prepends "91" and "@c.us".
 * @param {string} phone - Raw phone input (e.g. "9876543210", "+919876543210")
 * @returns {string} Formatted WhatsApp chat ID (e.g. "919876543210@c.us")
 */
function formatIndianNumber(phone) {
  // Remove all non-digit characters
  let digits = String(phone).replace(/\D/g, '');

  // Strip leading country code if present
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length > 10) {
    digits = digits.slice(1);
  }

  return `91${digits}@c.us`;
}

/**
 * Initialize the WhatsApp Web client with persistent LocalAuth.
 * Prints the QR code to terminal for first-time pairing.
 */
function initWhatsAppClient() {
  if (client) {
    console.log('[WhatsApp] Client already initialized. Skipping.');
    return client;
  }

  console.log('[WhatsApp] Initializing client with LocalAuth...');

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu'
      ]
    }
  });

  // ── QR Code Event ──
  client.on('qr', (qr) => {
    console.log('\n[WhatsApp] ▶ Scan this QR code with WhatsApp on your phone:\n');
    qrcode.generate(qr, { small: true });
  });

  // ── Ready Event ──
  client.on('ready', () => {
    isReady = true;
    console.log('[WhatsApp] ✅ Client is ready and authenticated!');
    console.log(`[WhatsApp] Connected as: ${client.info?.pushname || 'Unknown'}`);
  });

  // ── Authentication Failure ──
  client.on('auth_failure', (msg) => {
    isReady = false;
    console.error('[WhatsApp] ❌ Authentication failed:', msg);
  });

  // ── Disconnected ──
  client.on('disconnected', (reason) => {
    isReady = false;
    console.warn('[WhatsApp] ⚠ Disconnected:', reason);
    console.log('[WhatsApp] Attempting to re-initialize in 10 seconds...');
    client = null;
    setTimeout(() => initWhatsAppClient(), 10000);
  });

  // ── Incoming Message Listener (Order Confirmation) ──
  client.on('message', async (msg) => {
    const body = msg.body?.trim();

    if (body === '1') {
      console.log(`[WhatsApp] ✅ Order Confirmed by ${msg.from}`);
      try {
        await msg.reply('धन्यवाद! आपका ऑर्डर कन्फर्म हो गया है। 🎉\n\nThank you! Your order has been confirmed.');
      } catch (replyErr) {
        console.error('[WhatsApp] Failed to send confirmation reply:', replyErr.message);
      }
    } else if (body === '2') {
      console.log(`[WhatsApp] ❌ Order Rejected by ${msg.from}`);
      try {
        await msg.reply('ऑर्डर रद्द किया गया। यदि कोई प्रश्न हो तो संपर्क करें।\n\nOrder cancelled. Contact us for any queries.');
      } catch (replyErr) {
        console.error('[WhatsApp] Failed to send rejection reply:', replyErr.message);
      }
    }
  });

  // ── Start the client ──
  client.initialize().catch((err) => {
    console.error('[WhatsApp] Failed to initialize client:', err.message);
  });

  return client;
}

/**
 * Check whether the WhatsApp client is fully authenticated and ready.
 * @returns {boolean}
 */
function isClientReady() {
  return Boolean(isReady && client && client.info);
}

/**
 * Send a new-order notification to an artisan's WhatsApp.
 * @param {string} phoneNumber - The artisan's 10-digit phone number
 * @param {string} itemName - The ordered product name
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendNewOrderNotification(phoneNumber, itemName) {
  if (!isClientReady()) {
    return {
      success: false,
      message: 'WhatsApp client is not ready. Please scan the QR code first.'
    };
  }

  const chatId = formatIndianNumber(phoneNumber);

  const orderMessage = [
    '🛒 *Shilp Setu — नया ऑर्डर प्राप्त!*',
    '',
    `📦 उत्पाद / Item: *${itemName || 'Handcrafted Product'}*`,
    `📅 दिनांक / Date: ${new Date().toLocaleDateString('hi-IN')}`,
    '',
    '➡️ *कृपया उत्तर दें / Please reply:*',
    '   *1* → ✅ ऑर्डर स्वीकार करें (Accept Order)',
    '   *2* → ❌ ऑर्डर रद्द करें (Reject Order)',
    '',
    '_Shilp Setu — शिल्प सेतु | Digital Artisan Platform_'
  ].join('\n');

  try {
    await client.sendMessage(chatId, orderMessage);
    console.log(`[WhatsApp] 📩 Order notification sent to ${chatId}`);
    return { success: true, message: `Order notification sent to ${phoneNumber}` };
  } catch (err) {
    console.error(`[WhatsApp] Failed to send order notification to ${chatId}:`, err.message);
    return { success: false, message: `Failed to send: ${err.message}` };
  }
}

/**
 * Generate a mock Khata (weekly ledger) PDF and send it via WhatsApp.
 * @param {string} phoneNumber - The artisan's 10-digit phone number
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function generateAndSendKhata(phoneNumber) {
  if (!isClientReady()) {
    return {
      success: false,
      message: 'WhatsApp client is not ready. Please scan the QR code first.'
    };
  }

  const chatId = formatIndianNumber(phoneNumber);
  const tmpDir = path.join(__dirname, 'tmp');
  const pdfPath = path.join(tmpDir, `Shilp_Setu_Weekly_Ledger_${Date.now()}.pdf`);

  // Ensure tmp directory exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  try {
    // ── Generate PDF ──
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      stream.on('finish', resolve);
      stream.on('error', reject);
      doc.pipe(stream);

      // === Header ===
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('Shilp Setu — Weekly Khata Report', { align: 'center' })
        .moveDown(0.3);

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#666666')
        .text('शिल्प सेतु — साप्ताहिक खाता विवरणी', { align: 'center' })
        .moveDown(0.5);

      // Horizontal rule
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#cccccc')
        .stroke()
        .moveDown(0.8);

      // === Artisan Info ===
      doc
        .fillColor('#333333')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Artisan Phone: ', { continued: true })
        .font('Helvetica')
        .text(`+91 ${phoneNumber}`)
        .moveDown(0.2);

      doc
        .font('Helvetica-Bold')
        .text('Report Period: ', { continued: true })
        .font('Helvetica')
        .text(`${getWeekRange()}`)
        .moveDown(0.2);

      doc
        .font('Helvetica-Bold')
        .text('Generated: ', { continued: true })
        .font('Helvetica')
        .text(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }))
        .moveDown(1);

      // === Sales Table Header ===
      const tableTop = doc.y;
      const col = { date: 50, item: 140, qty: 320, rate: 380, total: 460 };

      doc
        .rect(50, tableTop - 5, 495, 22)
        .fillColor('#2563eb')
        .fill();

      doc
        .fillColor('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Date', col.date, tableTop, { width: 80 })
        .text('Item', col.item, tableTop, { width: 170 })
        .text('Qty', col.qty, tableTop, { width: 50, align: 'center' })
        .text('Rate (₹)', col.rate, tableTop, { width: 70, align: 'right' })
        .text('Total (₹)', col.total, tableTop, { width: 80, align: 'right' });

      doc.moveDown(0.8);

      // === Mock Sales Rows ===
      const salesData = [
        { date: '22 Sep', item: 'Terracotta Diya Set (12 pcs)', qty: 4, rate: 350 },
        { date: '23 Sep', item: 'Blue Pottery Vase — Large', qty: 1, rate: 1200 },
        { date: '24 Sep', item: 'Hand-painted Kulhar (6 pcs)', qty: 8, rate: 180 },
        { date: '25 Sep', item: 'Brass Dhokra Figurine', qty: 2, rate: 950 },
        { date: '26 Sep', item: 'Jute Macramé Wall Hanging', qty: 3, rate: 420 },
        { date: '27 Sep', item: 'Madhubani Canvas Print', qty: 1, rate: 2800 }
      ];

      let grandTotal = 0;

      salesData.forEach((row, idx) => {
        const y = doc.y;
        const total = row.qty * row.rate;
        grandTotal += total;

        // Zebra striping
        if (idx % 2 === 0) {
          doc.rect(50, y - 3, 495, 18).fillColor('#f8fafc').fill();
        }

        doc
          .fillColor('#333333')
          .fontSize(9)
          .font('Helvetica')
          .text(row.date, col.date, y, { width: 80 })
          .text(row.item, col.item, y, { width: 170 })
          .text(String(row.qty), col.qty, y, { width: 50, align: 'center' })
          .text(`₹${row.rate.toLocaleString('en-IN')}`, col.rate, y, { width: 70, align: 'right' })
          .text(`₹${total.toLocaleString('en-IN')}`, col.total, y, { width: 80, align: 'right' });

        doc.moveDown(0.6);
      });

      // === Summary Row ===
      doc.moveDown(0.3);

      const summaryY = doc.y;
      doc.rect(50, summaryY - 5, 495, 24).fillColor('#f0fdf4').fill();

      const platformFee = Math.round(grandTotal * 0.02);
      const netPayout = grandTotal - platformFee;

      doc
        .fillColor('#166534')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Gross Total:', col.item, summaryY, { width: 170 })
        .text(`₹${grandTotal.toLocaleString('en-IN')}`, col.total, summaryY, { width: 80, align: 'right' });

      doc.moveDown(0.6);

      doc
        .fillColor('#666666')
        .fontSize(9)
        .font('Helvetica')
        .text(`Platform Fee (2%): ₹${platformFee.toLocaleString('en-IN')}`, col.item, doc.y)
        .moveDown(0.3);

      doc
        .fillColor('#166534')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`Net Payout: ₹${netPayout.toLocaleString('en-IN')}`, col.item, doc.y)
        .moveDown(1.5);

      // === Footer ===
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .strokeColor('#cccccc')
        .stroke()
        .moveDown(0.5);

      doc
        .fillColor('#999999')
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This is an auto-generated ledger by Shilp Setu Digital Platform. ' +
          'For queries, contact support@shilpsetu.gov.in or call 1800-XXX-XXXX.',
          50,
          doc.y,
          { align: 'center', width: 495 }
        );

      doc.end();
    });

    // ── Send the PDF via WhatsApp ──
    const media = MessageMedia.fromFilePath(pdfPath);
    media.filename = 'Shilp_Setu_Weekly_Ledger.pdf';

    await client.sendMessage(
      chatId,
      '📊 *शिल्प सेतु — साप्ताहिक खाता विवरणी*\n\nआपकी इस सप्ताह की बिक्री विवरणी संलग्न है।\nYour weekly sales ledger is attached below.'
    );
    await client.sendMessage(chatId, media);

    console.log(`[WhatsApp] 📄 Khata PDF sent to ${chatId}`);

    // Clean up temp file
    fs.unlink(pdfPath, (err) => {
      if (err) console.warn('[WhatsApp] Could not delete temp PDF:', err.message);
    });

    return { success: true, message: `Khata PDF sent to ${phoneNumber}` };
  } catch (err) {
    console.error(`[WhatsApp] Failed to generate/send Khata PDF:`, err.message);

    // Clean up on failure
    try { fs.unlinkSync(pdfPath); } catch (_) { /* ignore */ }

    return { success: false, message: `Failed: ${err.message}` };
  }
}

/**
 * Returns a formatted string for the current week range.
 * @returns {string} e.g. "22 Sep 2026 — 28 Sep 2026"
 */
function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return `${fmt(monday)} — ${fmt(sunday)}`;
}

// ─── Exports ───────────────────────────────────────────────────────
module.exports = {
  initWhatsAppClient,
  isClientReady,
  sendNewOrderNotification,
  generateAndSendKhata,
  formatIndianNumber
};
