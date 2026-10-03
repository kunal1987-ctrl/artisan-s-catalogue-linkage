import { supabase } from '../supabaseClient';

/**
 * Converts a File or Blob to a base64 string using FileReader.
 * @param {File|Blob|string} fileOrBlob
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
function fileToBase64(fileOrBlob) {
  return new Promise((resolve, reject) => {
    if (typeof fileOrBlob === 'string') {
      if (fileOrBlob.startsWith('data:')) {
        const commaIdx = fileOrBlob.indexOf(',');
        const mimeMatch = fileOrBlob.match(/^data:([^;]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const base64 = commaIdx !== -1 ? fileOrBlob.slice(commaIdx + 1) : fileOrBlob;
        resolve({ base64, mimeType });
        return;
      }
      resolve({ base64: fileOrBlob, mimeType: 'image/jpeg' });
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUri = reader.result;
      const commaIdx = dataUri.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error('FileReader produced an unexpected data-URI format.'));
        return;
      }
      const base64 = dataUri.slice(commaIdx + 1);
      const mimeMatch = dataUri.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : (fileOrBlob.type || 'image/jpeg');
      resolve({ base64, mimeType });
    };

    reader.onerror = () =>
      reject(new Error('FileReader failed to read the craft image file. Please try again.'));

    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Sends a craft image and metadata to the fair-pricing-agent Supabase Edge Function.
 *
 * @param {File|Blob|string} fileOrBlob  - The craft product image file, Blob, or base64 string.
 * @param {number}           statedCost  - Artisan's stated raw material cost in INR (default 0).
 * @param {string}           claimedTime - Artisan claimed production time or audio note.
 * @returns {Promise<{
 *   suggested_price: number,
 *   fair_range: { min: number, max: number },
 *   rationale: string,
 *   labor_audit: {
 *     artisan_claimed_time: string,
 *     benchmark_standard_days: number,
 *     validated_days_used: number,
 *     labor_discrepancy_detected: boolean,
 *     applicable_daily_wage: number,
 *     audit_notes: string
 *   },
 *   cost_breakdown: {
 *     material_cost: number,
 *     calculated_labor_cost: number,
 *     market_anchor_median: number|null
 *   },
 *   market_sources_evaluated: {
 *     amazon_rainforest_count: number,
 *     ondc_comps_count: number,
 *     database_vector_matches: number
 *   },
 *   craft_profile: object,
 *   market_data: object,
 *   input: object
 * }>}
 */
export async function appraiseProduct(fileOrBlob, statedCost, claimedTime) {
  if (!fileOrBlob) {
    throw new Error('appraiseProduct: fileOrBlob is required.');
  }

  const { base64: imageBase64, mimeType } = await fileToBase64(fileOrBlob);

  if (!imageBase64 || imageBase64.length < 10) {
    throw new Error('appraiseProduct: Failed to extract valid base64 image data.');
  }

  // Ensure statedCost and claimedTime are passed directly into the body without hardcoded defaults
  const body = {
    imageBase64,
    statedMaterialCost: Number(statedCost),
    claimed_time_or_audio_note: claimedTime ? String(claimedTime) : "Not specified",
    mimeType: fileOrBlob.type || mimeType || 'image/jpeg',
  };

  const { data, error } = await supabase.functions.invoke('fair-pricing-agent', {
    body,
  });

  if (error) {
    let detail = error?.message || 'Unknown error from fair-pricing-agent.';
    if (error?.context?.json) {
      const errJson = error.context.json;
      detail = errJson?.details || errJson?.message || errJson?.error || detail;
    }
    throw new Error(`Fair Pricing Agent: ${detail}`);
  }

  if (!data) {
    throw new Error('fair-pricing-agent returned an empty response. Please try again.');
  }

  if (data.error) {
    throw new Error(
      `fair-pricing-agent: ${data.message || data.error}${data.details ? ` — ${data.details}` : ''}`
    );
  }

  return data;
}

export default appraiseProduct;
