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
    return new Response('ok', { headers: corsHeaders });
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
        contents: [
          {
            parts: [
              { text: "Analyze this image and generate details for an artisan e-commerce product catalog. Return ONLY a valid JSON object with the following keys: 'title' (a short, catchy product name), 'description' (a 2-3 sentence engaging description), 'price' (a reasonable estimated price in INR as a number), 'tags' (an array of 3-5 relevant string tags like 'Handmade', 'Ceramic', etc). Do not include any other text." },
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
          responseMimeType: "application/json"
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
