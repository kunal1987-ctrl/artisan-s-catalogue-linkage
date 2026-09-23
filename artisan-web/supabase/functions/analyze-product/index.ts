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
              text: `You are an expert Indian Handicraft Cataloging AI and Fraud Detector.

TASK 1: CLASSIFY
Classify the product strictly into ONE allowed category: [Textiles, Pottery, Woodcraft, Metal, Jute, Art, Leather, Jewelry].

TASK 2: AUTHENTICITY CHECK
Analyze the image background and context.
- REJECT if the background is pure digital white, transparent, or a perfect studio gradient.
- REJECT if there are digital watermarks, stock photo logos, or promotional text overlays.
- REJECT if the image is a photograph taken of another digital screen (screen moiré, frame, glass glare).
- ACCEPT ONLY if the image shows natural physical environments (e.g., human hands, workshop tables, raw materials, natural outdoor/indoor lighting, natural shadows).

IF the image FAILS authenticity check:
Set "is_authentic_photo": false, "is_valid": false, and populate "rejection_reason" with the specific violation. Leave category and catalog fields null.

IF the image PASSES authenticity check:
Set "is_authentic_photo": true, "is_valid": true, "rejection_reason": null, assign the exact category, and extract product details.

EXPECTED JSON FORMAT:
{
  "category": "Exact String from [Textiles, Pottery, Woodcraft, Metal, Jute, Art, Leather, Jewelry] or null",
  "is_authentic_photo": boolean,
  "is_valid": boolean,
  "rejection_reason": "Provide reason if is_authentic_photo is false, else null",
  "name": "Specific product name or null",
  "product_name": "Specific product name or null",
  "material": "Specific material or null",
  "hsn_code": "Precise 4-to-6 digit Indian GST classification code or null",
  "price": 0,
  "suggested_price_inr": 0,
  "pricing_method": "smart_appraisal",
  "description": "Unique 2-sentence description of the handcrafted item or null"
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
