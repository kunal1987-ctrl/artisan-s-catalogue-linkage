import { supabase } from '../lib/supabaseClient';

/**
 * Converts a File or Blob to a base64 string using FileReader.
 * @param {File|Blob} fileOrBlob
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
function fileToBase64(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // result is a data-URI: "data:image/jpeg;base64,/9j/4AAQ..."
      const dataUri = reader.result;
      const commaIdx = dataUri.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error('FileReader produced an unexpected data-URI format.'));
        return;
      }
      // Extract raw base64 (after the comma)
      const base64 = dataUri.slice(commaIdx + 1);
      // Extract MIME type from the data-URI header
      const mimeMatch = dataUri.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : (fileOrBlob.type || 'image/jpeg');
      resolve({ base64, mimeType });
    };

    reader.onerror = () =>
      reject(new Error('FileReader failed to read the file. Please try again.'));

    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Sends a craft image to the fair-pricing-agent Edge Function and returns
 * the full pricing analysis result.
 *
 * @param {File|Blob} fileOrBlob    - The craft product image file.
 * @param {number}    statedCost    - Artisan's stated raw material cost in INR (default 0).
 * @returns {Promise<{
 *   suggested_price: number,
 *   fair_range: { min: number, max: number },
 *   rationale: string,
 *   craft_profile: {
 *     craft_category: string,
 *     primary_material: string,
 *     craftsmanship_style: string,
 *     labor_intensity: 'low'|'medium'|'high'|'masterpiece',
 *     search_query: string
 *   },
 *   market_data: object,
 *   input: object
 * }>}
 */
export async function appraiseProduct(fileOrBlob, statedCost = 0) {
  if (!fileOrBlob) {
    throw new Error('appraiseProduct: fileOrBlob is required.');
  }

  // ── 1. Convert image to base64 ─────────────────────────────────────────────
  const { base64: imageBase64, mimeType } = await fileToBase64(fileOrBlob);

  if (!imageBase64 || imageBase64.length < 50) {
    throw new Error(
      'appraiseProduct: Failed to read image file — base64 output was empty.'
    );
  }

  // ── 2. Invoke the Supabase Edge Function ───────────────────────────────────
  const { data, error } = await supabase.functions.invoke('fair-pricing-agent', {
    body: {
      imageBase64,
      statedMaterialCost: Number(statedCost) || 0,
      mimeType,
    },
  });

  // ── 3. Surface errors cleanly ──────────────────────────────────────────────
  if (error) {
    // Supabase wraps Edge Function HTTP errors in the error object
    const detail =
      error?.context?.json?.details ||
      error?.context?.json?.message ||
      error?.message ||
      'Unknown error from fair-pricing-agent.';
    throw new Error(`Fair Pricing Agent error: ${detail}`);
  }

  if (!data) {
    throw new Error(
      'fair-pricing-agent returned an empty response. Please try again.'
    );
  }

  // Edge Function may return an error payload with status 500
  if (data.error) {
    throw new Error(
      `fair-pricing-agent: ${data.message || data.error}${data.details ? ` — ${data.details}` : ''}`
    );
  }

  return data;
}
