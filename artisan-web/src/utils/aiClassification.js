/**
 * Indian Handicraft AI Categorization Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides strict category classification and system prompt for cataloging
 * crafts from product descriptions, voice transcripts, and artisan media.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const ALLOWED_CATEGORIES = [
  'Handloom & Textiles (e.g., Sarees, Silk, Khadi)',
  'Terracotta & Clay Pottery',
  'Metal Crafts (e.g., Brass, Dhokra, Copper)',
  'Woodcraft & Carving (e.g., Sheesham, Wooden Toys)',
  'Jute, Bamboo & Cane Products',
  'Tribal Paintings & Art (e.g., Madhubani, Warli, Gond)',
  'Leather Crafts',
  'Imitation & Traditional Jewelry',
  'Natural Fiber & Grass Crafts'
];

export const systemPrompt = `You are an expert Indian Handicraft Cataloging AI. 
Your sole task is to analyze the product description, voice transcript, or image provided by the artisan and classify it strictly into ONE of the following official categories.

ALLOWED CATEGORIES:
- Handloom & Textiles (e.g., Sarees, Silk, Khadi)
- Terracotta & Clay Pottery
- Metal Crafts (e.g., Brass, Dhokra, Copper)
- Woodcraft & Carving (e.g., Sheesham, Wooden Toys)
- Jute, Bamboo & Cane Products
- Tribal Paintings & Art (e.g., Madhubani, Warli, Gond)
- Leather Crafts
- Imitation & Traditional Jewelry
- Natural Fiber & Grass Crafts

RULES:
1. You MUST choose exactly one category from the exact text in the ALLOWED CATEGORIES list.
2. Do NOT invent, modify, or abbreviate categories.
3. If the product bridges two categories, select the category of the primary base material.
4. Output ONLY valid JSON in the exact format below. Do not include markdown blocks, conversational text, or explanations.

EXPECTED JSON FORMAT:
{
  "category": "Exact String from Allowed Categories",
  "confidence": "High/Medium/Low"
}
`;

/**
 * Deterministic fallback classifier matching product text to allowed categories.
 */
export function classifyCraftLocally(description) {
  const text = (description || '').toLowerCase();

  if (
    text.includes('saree') || text.includes('sari') || text.includes('silk') ||
    text.includes('khadi') || text.includes('handloom') || text.includes('textile') ||
    text.includes('weave') || text.includes('cotton') || text.includes('chanderi') ||
    text.includes('banarasi') || text.includes('साड़ी') || text.includes('वस्त्र') ||
    text.includes('हथकरघा') || text.includes('रेशम')
  ) {
    return { category: 'Handloom & Textiles (e.g., Sarees, Silk, Khadi)', confidence: 'High' };
  }

  if (
    text.includes('clay') || text.includes('terracotta') || text.includes('pottery') ||
    text.includes('ceramic') || text.includes('earthen') || text.includes('मिट्टी') ||
    text.includes('घड़ा') || text.includes('सुराही') || text.includes('दीया') ||
    text.includes('कुम्हार') || text.includes('टेराकोटा')
  ) {
    return { category: 'Terracotta & Clay Pottery', confidence: 'High' };
  }

  if (
    text.includes('brass') || text.includes('metal') || text.includes('copper') ||
    text.includes('bronze') || text.includes('dhokra') || text.includes('bell metal') ||
    text.includes('पीतल') || text.includes('तांबा') || text.includes('धातु') ||
    text.includes('कांसा')
  ) {
    return { category: 'Metal Crafts (e.g., Brass, Dhokra, Copper)', confidence: 'High' };
  }

  if (
    text.includes('wood') || text.includes('sheesham') || text.includes('teak') ||
    text.includes('carving') || text.includes('wooden toy') || text.includes('लकड़ी') ||
    text.includes('काष्ठ') || text.includes('नक्काशी')
  ) {
    return { category: 'Woodcraft & Carving (e.g., Sheesham, Wooden Toys)', confidence: 'High' };
  }

  if (
    text.includes('jute') || text.includes('bamboo') || text.includes('cane') ||
    text.includes('basket') || text.includes('जूट') || text.includes('बांस') ||
    text.includes('बेंत')
  ) {
    return { category: 'Jute, Bamboo & Cane Products', confidence: 'High' };
  }

  if (
    text.includes('painting') || text.includes('madhubani') || text.includes('warli') ||
    text.includes('gond') || text.includes('pattachitra') || text.includes('tribal art') ||
    text.includes('मधुबनी') || text.includes('वारली') || text.includes('चित्रकला')
  ) {
    return { category: 'Tribal Paintings & Art (e.g., Madhubani, Warli, Gond)', confidence: 'High' };
  }

  if (
    text.includes('leather') || text.includes('mojari') || text.includes('jooti') ||
    text.includes('kolhapuri') || text.includes('चमड़ा') || text.includes('जूती')
  ) {
    return { category: 'Leather Crafts', confidence: 'High' };
  }

  if (
    text.includes('jewelry') || text.includes('jewellery') || text.includes('kundan') ||
    text.includes('meenakari') || text.includes('bead') || text.includes('necklace') ||
    text.includes('earring') || text.includes('आभूषण') || text.includes('गहने')
  ) {
    return { category: 'Imitation & Traditional Jewelry', confidence: 'High' };
  }

  if (
    text.includes('grass') || text.includes('fiber') || text.includes('fibre') ||
    text.includes('sabai') || text.includes('moonj') || text.includes('kauna') ||
    text.includes('घास') || text.includes('मूंज')
  ) {
    return { category: 'Natural Fiber & Grass Crafts', confidence: 'Medium' };
  }

  return { category: 'Handloom & Textiles (e.g., Sarees, Silk, Khadi)', confidence: 'Low' };
}
