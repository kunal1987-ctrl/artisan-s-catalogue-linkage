// @ts-ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore
import { createClient } from "jsr:@supabase/supabase-js@2";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

// ─────────────────────────────────────────────────────────────────
// CORS Headers – preserved on ALL responses
// ─────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper to convert base64 data to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  // Strip potential data URL prefix
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 2. Auth verification: check for Authorization header
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Missing Authorization header. Supabase JWT or token required.",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 3. Read fal.ai API key securely
    const falApiKey =
      Deno.env.get("FAL_KEY") ||
      Deno.env.get("VITE_FAL_API_KEY") ||
      "b39b82a4-540f-48cb-92f5-f03e61f41cdb:22ada45a4191b4edfdeff0b1c4726692";

    // 4. Parse incoming payload (supports JSON or multipart/form-data)
    let imageBase64Data = "";
    let contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const rawBase64 = body.imageBase64 || body.image;
      if (!rawBase64) {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "imageBase64 is required in JSON body" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      imageBase64Data = rawBase64.includes(",") ? rawBase64 : `data:image/jpeg;base64,${rawBase64}`;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = (await req.formData()) as any;
      const fileEntry = formData.get("imageFile") || formData.get("image") || formData.get("file");
      if (fileEntry instanceof Blob) {
        const arrayBuf = await fileEntry.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuf);
        let binary = "";
        for (let i = 0; i < uint8.byteLength; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        imageBase64Data = `data:image/jpeg;base64,${btoa(binary)}`;
      } else {
        return new Response(
          JSON.stringify({ error: "Bad Request", message: "imageFile file is required in form data" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      const rawText = await req.text();
      try {
        const body = JSON.parse(rawText);
        if (body.imageBase64) {
          imageBase64Data = body.imageBase64.includes(",")
            ? body.imageBase64
            : `data:image/jpeg;base64,${body.imageBase64}`;
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "Unsupported Media Type", message: "Use application/json or multipart/form-data" }),
          {
            status: 415,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (!imageBase64Data) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "No valid image data could be extracted" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.info(`[Lifestyle-AI] Sending request to fal.ai API natively without watermarks`);

    // 5. POST request to fal.ai Bria background replace API
    const falResponse = await fetch("https://fal.run/fal-ai/bria/background/replace", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageBase64Data,
        prompt: "a clean, well-lit wooden table in a sunny room, minimalist artisan craft studio, commercial studio lighting",
      }),
    });

    if (!falResponse.ok) {
      const errText = await falResponse.text();
      console.error(`[fal.ai API Error] Status ${falResponse.status}:`, errText);
      return new Response(
        JSON.stringify({
          error: "fal.ai API Error",
          status: falResponse.status,
          details: errText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const falData = await falResponse.json();
    const resultImageUrl = falData?.image?.url || falData?.image_url || falData?.url;

    if (!resultImageUrl) {
      throw new Error("fal.ai did not return a valid image URL");
    }

    // 6. Fetch returned high-resolution image blob from fal.ai CDN
    const generatedRes = await fetch(resultImageUrl);
    const generatedBlob = await generatedRes.blob();
    const generatedBuffer = await generatedBlob.arrayBuffer();

    console.info(`[Lifestyle-AI] Received generated image from fal.ai: ${generatedBlob.size} bytes. Uploading to Supabase Storage...`);

    // 8. Securely upload to Supabase Storage bucket (`product-images`)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ANON_KEY") ||
      "";

    const supabase = createClient(supabaseUrl, supabaseKey);

    const fileName = `lifestyle_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, generatedBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Storage Upload Error]:", uploadError);
      // Fallback: try artisan-images bucket if product-images fails
      const { data: fallbackData, error: fallbackError } = await supabase.storage
        .from("artisan-images")
        .upload(fileName, generatedBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (fallbackError) {
        throw new Error(`Storage upload failed: ${uploadError.message}; Fallback failed: ${fallbackError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("artisan-images")
        .getPublicUrl(fallbackData.path);

      return new Response(
        JSON.stringify({
          success: true,
          imageUrl: publicUrlData.publicUrl,
          bucket: "artisan-images",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 9. Get public URL and return to client
    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(uploadData.path);

    console.info(`[Lifestyle-AI] Successfully generated & stored lifestyle image: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrlData.publicUrl,
        bucket: "product-images",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("[Lifestyle-AI Fatal Error]:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: err?.message || "Failed to generate lifestyle image",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
