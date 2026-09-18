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
              text: `You are an expert Indian rural commerce appraiser and cataloger. You are given an image of a handmade product and a transcribed voice note. You must generate a highly accurate, unique product listing in JSON format. Strictly prevent repetitive defaulting.

Rules for Extraction & Appraisal:
1. Category: Deduce strictly from visual features (e.g., Woodwork, Handloom, Metalcraft, Clay/Pottery). Do not default.
2. Price: Extract the stated audio amount first. If the transcript is empty or lacks a price, perform a "Smart Appraisal"—calculate a specific fair market valuation based on the visual material and craft complexity.
3. HSN Code: Map the precise 4-to-6 digit Indian GST classification to the primary material detected in the image.
4. Description: Write a unique 2-sentence marketing copy reflecting only the specific colors, patterns, and design details visible in the uploaded frame.

Required JSON Output Format:
{
  "name": "Specific product name",
  "material": "Specific material",
  "category": "Specific category deduced strictly from visual features",
  "hsn_code": "Precise 4-to-6 digit Indian GST classification code",
  "price": <integer>,
  "pricing_method": "<'spoken' or 'smart_appraisal'>",
  "description": "Unique 2-sentence marketing copy reflecting only the specific colors, patterns, and design details visible in the uploaded frame"
}`
            }
          ]
        },
        contents: [
          {
            parts: [
              {
                text: `Analyze the provided image and generate the appraised product listing following the system instructions. Strictly prevent repetitive defaulting:
- Category: Deduce strictly from visual features (e.g., Woodwork, Handloom, Metalcraft, Clay/Pottery). Do not default.
- Price: Extract the stated audio amount first. If the transcript is empty or lacks a price, perform a "Smart Appraisal"—calculate a specific fair market valuation based on the visual material and craft complexity.
- HSN Code: Map the precise 4-to-6 digit Indian GST classification to the primary material detected in the image.
- Description: Write a unique 2-sentence marketing copy reflecting only the specific colors, patterns, and design details visible in the uploaded frame.

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
