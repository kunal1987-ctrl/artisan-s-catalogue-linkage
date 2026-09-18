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
              text: `You are an expert Indian rural commerce appraiser and cataloger. You are given an image of a handmade product and a transcribed voice note. You must generate a highly accurate, unique product listing in JSON format.

**Rules for Extraction & Appraisal:**
1. **Visual Identification (Mandatory):** Ignore the transcript for this step. Look at the image and precisely identify what the object is, its material (e.g., Terracotta, Handloom Silk, Bamboo, Brass), and its craft style.
2. **Category & HSN:** Assign a highly specific category based on the visual identification. Do NOT default to generic categories. Assign the exact 4-to-6 digit Indian HSN code for that specific material.
3. **Dynamic Smart Pricing (Crucial):** 
   - First, check the voice transcript. If the artisan explicitly states a reasonable price, extract that exact number.
   - **Fallback (Smart Price):** If the transcript is empty, unclear, or the stated price is missing, you must visually appraise the item. Estimate a fair, highly specific INR market price based on the material, complexity, and standard e-commerce rates for such handmade goods (e.g., do not just output 450. Output 220 for a small clay cup, or 1850 for a detailed brass lamp).
4. **Description:** Write a unique 2-sentence marketing description based *only* on the visual details in the image.

**Required JSON Output Format:**
{
  "name": "Specific product name",
  "material": "Specific material",
  "category": "Specific category",
  "hsn_code": "Exact HSN code",
  "price": <integer>,
  "pricing_method": "<'spoken' or 'smart_appraisal'>",
  "description": "Unique description"
}`
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Analyze the provided image and generate the appraised product listing following the system instructions. Return strictly valid JSON:
{
  "name": "Specific product name",
  "material": "Specific material",
  "category": "Specific category",
  "hsn_code": "Exact HSN code",
  "price": 1200,
  "pricing_method": "smart_appraisal",
  "description": "Unique description"
}`
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

    const productData = JSON.parse(textResult);

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
