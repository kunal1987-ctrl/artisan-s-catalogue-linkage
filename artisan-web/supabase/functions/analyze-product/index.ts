// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { image_base64, mime_type = "image/jpeg" } = await req.json();
    
    if (!image_base64 || typeof image_base64 !== "string") {
      throw new Error("Missing or invalid image_base64 in request body");
    }

    const cleanImageBase64 = image_base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: `You are Shilp Setu's authentic artisan inventory verification and cataloging engine. You are given an image of a handmade product.

AUTHENTICITY & INTEGRITY RULES:
1. is_authentic_craft: Image MUST clearly display an authentic, physical handmade craft, textile, pottery, metalwork, sculpture, or indigenous art piece. It must NOT be a selfie, pet, food, industrial machinery, or irrelevant object.
2. is_screen_recapture: Detect if this image is a photograph taken of another digital screen (monitor, mobile screen, TV, tablet). Look for pixel grid moiré patterns, screen bevels/frames, glare on glass, or UI icons.
3. is_watermarked_or_stock: Detect if this is an e-commerce stock photo from Amazon/Flipkart/Etsy with clean-cut pure white studio backdrops, watermarks, or digital catalog banners.

IF the image FAILS any of these criteria:
Set "is_valid": false and populate "rejection_reason" in simple Hindi and English (e.g. "तस्वीर किसी स्क्रीन से ली गई प्रतीत होती है। कृपया असली उत्पाद की फोटो लें। / Photo appears to be taken from a screen. Please photograph the physical craft directly."). Leave all catalog fields null.

IF the image PASSES:
Set "is_valid": true, "rejection_reason": null, and generate the full product catalog fields.
- Category: Deduce strictly from visual features (e.g., Woodwork, Handloom, Metalcraft, Clay/Pottery). Do not default.
- Price: Perform a Smart Appraisal calculating fair market valuation based on visual material and craft complexity.
- HSN Code: Map the precise 4-to-6 digit Indian GST classification code.
- Description: Write a unique 2-sentence marketing copy reflecting only the specific colors, patterns, and design details visible in the uploaded frame.

Required JSON Output Format:
{
  "is_valid": boolean,
  "rejection_reason": string or null,
  "name": "Specific product name" or null,
  "product_name": "Specific product name" or null,
  "material": "Specific material" or null,
  "category": "Specific category deduced strictly from visual features" or null,
  "hsn_code": "Precise 4-to-6 digit Indian GST classification code" or null,
  "price": <integer or null>,
  "suggested_price_inr": <integer or null>,
  "pricing_method": "smart_appraisal",
  "description": "Unique 2-sentence marketing copy reflecting only the specific colors, patterns, and design details visible in the uploaded frame" or null
}`
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Analyze the provided craft photo.

AUTHENTICITY & INTEGRITY CHECKS:
1. Verify this is a genuine physical craft, not a selfie, screen photograph, or stock photo.
2. If invalid, set "is_valid": false and provide "rejection_reason" in Hindi and English.
3. If valid, set "is_valid": true, "rejection_reason": null, and extract full catalog fields.

Return strictly valid JSON adhering to the Required JSON Output Format.`
              },
              {
                inlineData: {
                  mimeType: mime_type,
                  data: cleanImageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3
        }
      })
    });

    const result: any = await response.json();
    
    if (!response.ok) {
      throw new Error(result?.error?.message || "Error calling Gemini API");
    }

    let textResult = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    textResult = textResult
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!textResult) {
      throw new Error("No text response received from Gemini API");
    }

    let productData: any;
    try {
      productData = JSON.parse(textResult);
    } catch (parseErr) {
      const jsonMatch = textResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        productData = JSON.parse(jsonMatch[0]);
      } else {
        throw parseErr;
      }
    }

    return new Response(
      JSON.stringify(productData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
    );
  }
});
