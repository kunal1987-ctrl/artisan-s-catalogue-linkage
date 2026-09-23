/**
 * Indian Handicraft AI Categorization Engine & Visual Fraud Detector
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides strict category classification and authenticity verification prompt
 * for detecting stock photos, digital white backgrounds, and watermarks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ALLOWED_CATEGORIES = [
  'Textiles',
  'Pottery',
  'Woodcraft',
  'Metal',
  'Jute',
  'Art',
  'Leather',
  'Jewelry'
] as const;

export type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];

export const systemPrompt = `You are an expert Indian Handicraft Cataloging AI and Fraud Detector. 

TASK 1: CLASSIFY
Classify the product strictly into ONE allowed category: [Textiles, Pottery, Woodcraft, Metal, Jute, Art, Leather, Jewelry].

TASK 2: AUTHENTICITY CHECK
Analyze the image background and context. 
- REJECT if the background is pure digital white, transparent, or a perfect studio gradient.
- REJECT if there are digital watermarks, stock photo logos, or promotional text overlays.
- ACCEPT ONLY if the image shows natural physical environments (e.g., human hands, workshop tables, raw materials, natural outdoor/indoor lighting, natural shadows).

EXPECTED JSON FORMAT:
{
  "category": "Exact String or null",
  "is_authentic_photo": boolean,
  "rejection_reason": "Provide reason if is_authentic_photo is false, else null"
}
`;

export interface ClassificationResult {
  category: AllowedCategory | null;
  is_authentic_photo: boolean;
  rejection_reason: string | null;
}

/**
 * Deterministic fallback classifier matching product text to allowed categories.
 * Also performs local heuristic authenticity check on text.
 */
export function classifyCraftLocally(description: string): ClassificationResult {
  const text = (description || '').toLowerCase();

  // Heuristic fraud check
  if (
    text.includes('stock photo') || 
    text.includes('shutterstock') || 
    text.includes('getty') || 
    text.includes('watermark') || 
    text.includes('clipart') ||
    text.includes('pure white background')
  ) {
    return {
      category: null,
      is_authentic_photo: false,
      rejection_reason: 'Detected stock photo watermark or non-physical studio background.'
    };
  }

  let category: AllowedCategory = 'Textiles';
  if (
    text.includes('clay') || text.includes('terracotta') || text.includes('pottery') ||
    text.includes('ceramic') || text.includes('earthen') || text.includes('मिट्टी') ||
    text.includes('घड़ा') || text.includes('सुराही') || text.includes('दीया') ||
    text.includes('कुम्हार') || text.includes('टेराकोटा')
  ) {
    category = 'Pottery';
  } else if (
    text.includes('wood') || text.includes('sheesham') || text.includes('teak') ||
    text.includes('carving') || text.includes('wooden toy') || text.includes('लकड़ी') ||
    text.includes('काष्ठ') || text.includes('नक्काशी')
  ) {
    category = 'Woodcraft';
  } else if (
    text.includes('brass') || text.includes('metal') || text.includes('copper') ||
    text.includes('bronze') || text.includes('dhokra') || text.includes('bell metal') ||
    text.includes('पीतल') || text.includes('तांबा') || text.includes('धातु') ||
    text.includes('कांसा')
  ) {
    category = 'Metal';
  } else if (
    text.includes('jute') || text.includes('bamboo') || text.includes('cane') ||
    text.includes('basket') || text.includes('जूट') || text.includes('बांस') ||
    text.includes('बेंत')
  ) {
    category = 'Jute';
  } else if (
    text.includes('painting') || text.includes('madhubani') || text.includes('warli') ||
    text.includes('gond') || text.includes('pattachitra') || text.includes('tribal art') ||
    text.includes('मधुबनी') || text.includes('वारली') || text.includes('चित्रकला')
  ) {
    category = 'Art';
  } else if (
    text.includes('leather') || text.includes('mojari') || text.includes('jooti') ||
    text.includes('kolhapuri') || text.includes('चमड़ा') || text.includes('जूती')
  ) {
    category = 'Leather';
  } else if (
    text.includes('jewelry') || text.includes('jewellery') || text.includes('kundan') ||
    text.includes('meenakari') || text.includes('bead') || text.includes('necklace') ||
    text.includes('earring') || text.includes('आभूषण') || text.includes('गहने')
  ) {
    category = 'Jewelry';
  } else {
    category = 'Textiles';
  }

  return {
    category,
    is_authentic_photo: true,
    rejection_reason: null
  };
}

export default {
  ALLOWED_CATEGORIES,
  systemPrompt,
  classifyCraftLocally
};
