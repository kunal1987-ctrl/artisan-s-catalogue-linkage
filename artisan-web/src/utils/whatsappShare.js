/**
 * WhatsApp share utilities for the public Product Detail Page (PDP).
 *
 * Formats a buyer-facing message and builds a `wa.me` deep link that opens
 * either the native WhatsApp app (mobile) or WhatsApp Web / Desktop.
 */

/** Public, shareable PDP path for a product. */
export function buildProductUrl(productId, origin = typeof window !== 'undefined' ? window.location.origin : '') {
  return `${origin}/product/${productId}`;
}

/** Formats a price for Indian readers, e.g. 1250 -> "1,250". */
export function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '0';
  return num.toLocaleString('en-IN');
}

/**
 * Formats the exact customized WhatsApp text string:
 * "Check out this authentic [Product Title] handcrafted by [Artisan Name]. Direct Price: ₹[Price]. View details and order here: [URL]"
 */
export function formatWhatsAppMessage({ title, artisanName, price, url, language = 'en' }) {
  const safeTitle = title || 'Handcrafted Craft';
  const safeArtisan = artisanName || 'Master Artisan';
  const formattedPrice = formatPrice(price);

  if (language === 'hi') {
    return `शिल्प सेतु पर यह प्रामाणिक ${safeTitle} देखें, जिसे ${safeArtisan} ने हाथ से बनाया है। सीधा मूल्य: ₹${formattedPrice}। विवरण देखें और ऑर्डर करें: ${url}`;
  }

  return `Check out this authentic ${safeTitle} handcrafted by ${safeArtisan}. Direct Price: ₹${formattedPrice}. View details and order here: ${url}`;
}

/** Alias for backward compatibility */
export const buildShareMessage = formatWhatsAppMessage;

/**
 * Builds the `https://wa.me/?text=` deep link with encoded message.
 * Omitting the phone number opens WhatsApp's native contact picker, letting the
 * artisan forward the craft to any buyer without pre-selecting a recipient.
 */
export function buildWhatsAppShareUrl(params) {
  const message = formatWhatsAppMessage(params);
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Opens the WhatsApp share sheet in a new window/tab. */
export function shareViaWhatsApp(params) {
  const shareUrl = buildWhatsAppShareUrl(params);
  if (typeof window !== 'undefined') {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }
  return shareUrl;
}

