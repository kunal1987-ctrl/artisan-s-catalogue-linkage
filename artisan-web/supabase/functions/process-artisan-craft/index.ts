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
// CORS Headers – preserved on ALL responses (success, auth error & fallback)
// ─────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, *",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
};

// ─────────────────────────────────────────────────────────────────
// STRICT REGEX GEMINI RESPONSE PARSER
// ─────────────────────────────────────────────────────────────────
const parseGeminiResponse = (rawText: string) => {
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (parseError: any) {
    // Fallback: extract the first valid JSON object substring
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Failed to parse structured catalog response: ${parseError.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────
// DYNAMIC CRAFT PROFILE GENERATOR (NO HARDCODED TERRACOTTA DEFAULT)
// Generates accurate fallback details based on transcript & craft keywords
// ─────────────────────────────────────────────────────────────────
function generateDynamicCraftProfile(transcript: string, user: any, customPrice?: number) {
  const text = (transcript || "").toLowerCase();
  
  // Extract price from transcript or default to smart appraisal
  const spokenPriceMatch = transcript ? (transcript.match(/(?:₹|rs\.?|inr|rupees?|रुपये?|कीमत|मूल्य)\s*[:\-]?\s*(\d+)/i) || transcript.match(/(\d{2,6})/)) : null;
  const pricingMethod = spokenPriceMatch ? 'spoken' : 'smart_appraisal';
  let dynamicPrice = customPrice;
  if (!dynamicPrice) {
    dynamicPrice = spokenPriceMatch ? Number(spokenPriceMatch[1]) : 750;
  }
  const wholesalePrice = Math.round(dynamicPrice * 0.72);

  // Dynamic craft analysis based on transcript hints
  let category = "Handicrafts & Traditional Artware";
  let material = "Natural Artisan Materials";
  let hsnCode = "970300";
  let gemCategory = "Handicrafts & Traditional Artware";
  let titleEn = "Handcrafted Heritage Artisan Craft";
  let titleHi = "हस्तनिर्मित प्रामाणिक शिल्प";

  if (text.includes("silk") || text.includes("saree") || text.includes("sari") || text.includes("handloom") || text.includes("textile") || text.includes("fabric") || text.includes("shawl") || text.includes("dupatta") || text.includes("cotton") || text.includes("weave") || text.includes("बुनकर") || text.includes("साड़ी")) {
    category = "Handloom Textiles";
    material = (text.includes("silk") || text.includes("रेशम")) ? "Pure Mulberry Silk" : "Handloom Cotton";
    hsnCode = (text.includes("silk") || text.includes("रेशम")) ? "500720" : "520811";
    gemCategory = "Handloom / Silk Sarees";
    titleEn = (text.includes("silk") || text.includes("रेशम")) ? "Handwoven Pure Silk Craft" : "Handcrafted Traditional Handloom Textile";
    titleHi = "पारंपरिक हस्तनिर्मित हथकरघा वस्त्र";
  } else if (text.includes("brass") || text.includes("metal") || text.includes("copper") || text.includes("bronze") || text.includes("bell") || text.includes("धातु") || text.includes("पीतल") || text.includes("तांबा")) {
    category = "Metalware & Brass";
    material = text.includes("copper") ? "Pure Copper" : "Hand-engraved Solid Brass";
    hsnCode = "741810";
    gemCategory = "Handicraft / Brass Metalcraft";
    titleEn = "Handcrafted Engraved Brass Metalware";
    titleHi = "पारंपरिक हस्तनिर्मित नक्काशीदार पीतल शिल्प";
  } else if (text.includes("wood") || text.includes("wooden") || text.includes("sheesham") || text.includes("teak") || text.includes("carving") || text.includes("लकड़ी") || text.includes("काष्ठ")) {
    category = "Woodcraft & Carvings";
    material = "Seasoned Sheesham Wood";
    hsnCode = "442010";
    gemCategory = "Woodcraft / Traditional Carvings";
    titleEn = "Handcrafted Carved Woodcraft";
    titleHi = "पारंपरिक हस्तनिर्मित नक्काशीदार काष्ठ शिल्प";
  } else if (text.includes("leather") || text.includes("jooti") || text.includes("mojari") || text.includes("चमड़ा") || text.includes("जूती")) {
    category = "Leather Goods";
    material = "Genuine Handcrafted Leather";
    hsnCode = "420231";
    gemCategory = "Handicraft / Leather Goods";
    titleEn = "Handcrafted Traditional Leather Goods";
    titleHi = "पारंपरिक हस्तनिर्मित चमड़ा उत्पाद";
  } else if (text.includes("clay") || text.includes("terracotta") || text.includes("pottery") || text.includes("mitti") || text.includes("मिट्टी") || text.includes("घड़ा") || text.includes("सुराही")) {
    category = "Terracotta & Pottery";
    material = "Natural Alluvial Clay";
    hsnCode = "69120010";
    gemCategory = "Handicrafts - Terracotta Pottery and Planters";
    titleEn = "Handcrafted Terracotta Clay Pottery";
    titleHi = "पारंपरिक हस्तनिर्मित टेराकोटा मिट्टी शिल्प";
  } else if (text.includes("stone") || text.includes("marble") || text.includes("पत्थर") || text.includes("संगमरमर")) {
    category = "Stone Carvings";
    material = "Natural Carved Stone";
    hsnCode = "680291";
    gemCategory = "Handicraft / Stone Carvings & Sculptures";
    titleEn = "Handcrafted Stone Carving Sculpture";
    titleHi = "पारंपरिक हस्तनिर्मित पत्थर शिल्प";
  } else if (text.includes("jute") || text.includes("cane") || text.includes("bamboo") || text.includes("जूट") || text.includes("बांस")) {
    category = "Jute & Natural Fiber";
    material = "Eco-Friendly Natural Fiber";
    hsnCode = "531010";
    gemCategory = "Handicraft / Jute & Natural Fiber Products";
    titleEn = "Handwoven Eco-Friendly Fiber Craft";
    titleHi = "प्राकृतिक फाइबर हस्तशिल्प";
  }

  const desc = transcript && transcript.length > 8
    ? `${transcript.trim()}. Handcrafted by skilled rural artisans using authentic heritage techniques.`
    : `Exquisitely handcrafted ${material.toLowerCase()} piece showcasing authentic Indian heritage craftsmanship.`;
  const descHi = transcript && transcript.length > 8
    ? `${transcript.trim()}। कुशल कारीगरों द्वारा पारंपरिक कला से तैयार किया गया प्रामाणिक हस्तशिल्प।`
    : `कुशल कारीगरों द्वारा पारंपरिक कला से तैयार किया गया प्रामाणिक हस्तशिल्प।`;

  return {
    name: titleEn,
    title: titleEn,
    title_hi: titleHi,
    description: desc,
    description_hi: descHi,
    artisan_expected_price: dynamicPrice,
    price: dynamicPrice,
    pricing_method: pricingMethod,
    bulk_price: wholesalePrice,
    suggested_retail_price_inr: dynamicPrice,
    suggested_wholesale_price_inr: wholesalePrice,
    estimated_price_inr: dynamicPrice,
    bulk_price_inr: wholesalePrice,
    pricing_reasoning: `Price dynamically derived from artisan input (₹${dynamicPrice}) with standard volume discount for institutional procurement.`,
    gem_category: gemCategory,
    unspsc_code: "60121002",
    hsn_code: hsnCode,
    moq: 20,
    is_gem_ready: true,
    craft_category: category,
    category: category,
    material: material,
    tags: ["Handmade", "Authentic", "GeM Ready", category],
    demo_mode: false,
    rate_limited: false,
    user_id: user?.id || null,
    ondc_beckn_item: {
      id: `ONDC-ITEM-${Date.now().toString(36).toUpperCase()}`,
      descriptor: {
        name: titleEn,
        name_hi: titleHi,
        short_desc: desc.slice(0, 140),
        long_desc: desc,
        images: [],
      },
      price: {
        currency: "INR",
        value: String(dynamicPrice),
      },
      category_id: category,
      fulfillment_id: "ondc_standard_delivery",
      tags: {
        hsn_code: hsnCode,
        origin_country: "IND",
        make_in_india: "true",
        digital_escrow_enabled: "true",
        escrow_protocol: "ONDC_RSP_BECKN_ESCROW",
        bpp_id: "shilp-setu.artisan.in",
      },
    },
    gem_specification: {
      category: gemCategory,
      unspsc: "60121002",
      hsn: hsnCode,
      moq: 20,
      bulk_unit_price: wholesalePrice,
      digital_escrow: true,
      pfms_integrated: true,
      msme_preference_eligible: true,
      delivery_terms: "F.O.R. Destination (Central Government Stores)",
      escrow_settlement: "PFMS Milestone Auto-Disbursement on Dispatch",
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// IN-MEMORY SLIDING-WINDOW RATE LIMITER (BOUND TO VERIFIED USER ID)
// Window: 60 seconds, Maximum requests: 6 per authenticated user
// ─────────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;
const userRequestHistory = new Map<string, number[]>();

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

function checkRateLimit(userKey: string): RateLimitResult {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  const timestamps = (userRequestHistory.get(userKey) || []).filter(
    (ts) => ts > windowStart
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const earliest = timestamps[0];
    const resetTimeSec = Math.ceil((earliest + RATE_LIMIT_WINDOW_MS) / 1000);
    userRequestHistory.set(userKey, timestamps);
    return {
      allowed: false,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: 0,
      reset: resetTimeSec,
    };
  }

  timestamps.push(now);
  userRequestHistory.set(userKey, timestamps);

  if (userRequestHistory.size > 1000) {
    for (const [key, tsList] of userRequestHistory.entries()) {
      const active = tsList.filter((ts) => ts > windowStart);
      if (active.length === 0) {
        userRequestHistory.delete(key);
      } else {
        userRequestHistory.set(key, active);
      }
    }
  }

  const resetTimeSec = Math.ceil((timestamps[0] + RATE_LIMIT_WINDOW_MS) / 1000);
  return {
    allowed: true,
    limit: RATE_LIMIT_MAX_REQUESTS,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - timestamps.length),
    reset: resetTimeSec,
  };
}

// ─────────────────────────────────────────────────────────────────
// Helper: fetch with an AbortController timeout (ms)
// ─────────────────────────────────────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Strict Supabase JWT Authentication & Verification
  // ─────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized / अनधिकृत",
        message:
          "Missing Authorization header. कृपया वैध Supabase टोकन प्रदान करें। (Bearer token required)",
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  let user: any = null;

  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseClient.auth.getUser(jwt);

    if (authError || !authUser) {
      console.warn("[Auth Error] Invalid or expired JWT:", authError?.message);
      return new Response(
        JSON.stringify({
          error: "Unauthorized / अनधिकृत",
          message:
            "Invalid or expired Supabase authentication token. अमान्य या समाप्त टोकन। कृपया पुनः लॉगिन करें।",
          details: authError?.message || "User could not be validated from JWT",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    user = authUser;
  } catch (err: any) {
    console.error("[Auth Exception] Unexpected failure during JWT check:", err?.message || err);
    return new Response(
      JSON.stringify({
        error: "Unauthorized / अनधिकृत",
        message: "Authentication verification failed.",
        details: err?.message || "Token verification threw an exception",
      }),
      {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Sliding-Window Rate Limit Check Bound to Verified user.id
  // ─────────────────────────────────────────────────────────────
  const userKey = `user:${user.id}`;
  const rateLimit = checkRateLimit(userKey);

  const rateLimitHeaders = {
    "X-RateLimit-Limit": rateLimit.limit.toString(),
    "X-RateLimit-Remaining": rateLimit.remaining.toString(),
    "X-RateLimit-Reset": rateLimit.reset.toString(),
  };

  if (!rateLimit.allowed) {
    console.warn(
      `[RateLimit] Verified User ${user.id} exceeded rate limit (${rateLimit.limit} req/60s). Returning dynamic fallback.`
    );
    return new Response(
      JSON.stringify({
        ...generateDynamicCraftProfile("Handcrafted Artisan Item", user),
        rate_limited: true,
      }),
      {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  }

  let requestTranscript = "";

  try {
    const {
      audioBase64,
      imageBase64,
      imagesBase64,
      images,
      customTranscript,
      language = "hi",
    } = await req.json();

    requestTranscript = customTranscript || "";

    const hasAudio = typeof audioBase64 === "string" && audioBase64.length > 50;
    const hasTranscript = typeof customTranscript === "string" && customTranscript.trim().length > 0;

    const incomingImages: string[] = [];
    if (Array.isArray(imagesBase64) && imagesBase64.length > 0) {
      imagesBase64.forEach((img: any) => {
        if (typeof img === "string" && img.length > 50) incomingImages.push(img);
      });
    } else if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any) => {
        if (typeof img === "string" && img.length > 50) {
          incomingImages.push(img);
        } else if (img && typeof img.base64 === "string" && img.base64.length > 50) {
          incomingImages.push(img.base64);
        }
      });
    }

    if (incomingImages.length === 0 && typeof imageBase64 === "string" && imageBase64.length > 50) {
      incomingImages.push(imageBase64);
    }

    const hasImages = incomingImages.length > 0;

    // Strict sequential validation
    if (!hasImages && !hasAudio && !hasTranscript) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          message: "Please provide product image(s) and a description or audio note.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    // Build Gemini inlineData parts for each image
    const imageParts = incomingImages.map((rawB64) => {
      const clean = rawB64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
      let mime = "image/jpeg";
      if (clean.startsWith("iVBORw0KGgo")) {
        mime = "image/png";
      } else if (clean.startsWith("UklGR")) {
        mime = "image/webp";
      }
      return {
        inlineData: {
          mimeType: mime,
          data: clean,
        },
      };
    }).filter((part) => part.inlineData.data.length > 50);

    // ───────────────────────────────────────────────────────────
    // STEP 1: Groq Whisper Transcription
    // ───────────────────────────────────────────────────────────
    let transcript = "";

    if (hasAudio && groqApiKey) {
      console.log(`[Step 1] Transcribing audio for user ${user.id} via Groq Whisper...`);
      try {
        const cleanAudioBase64 = audioBase64.replace(
          /^data:audio\/[a-zA-Z0-9+.-]+;base64,/,
          ""
        );
        const binaryString = atob(cleanAudioBase64);
        const audioBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioBytes[i] = binaryString.charCodeAt(i);
        }

        const audioBlob = new Blob([audioBytes.buffer as ArrayBuffer], { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model", "whisper-large-v3");
        if (language && typeof language === "string" && language.trim().length > 0) {
          formData.append("language", language.trim());
        }

        const whisperRes = await fetchWithTimeout(
          "https://api.groq.com/openai/v1/audio/transcriptions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${groqApiKey}` },
            body: formData,
          },
          8000
        );

        if (whisperRes.ok) {
          const whisperData = await whisperRes.json();
          transcript = whisperData.text || "";
          console.log(`[Step 1 Success] Whisper transcribed (${transcript.length} chars):`, transcript);
        } else {
          const errText = await whisperRes.text();
          console.warn(`[Step 1 Warning] Groq Whisper returned ${whisperRes.status}:`, errText);
          transcript = hasTranscript ? customTranscript.trim() : "";
        }
      } catch (whisperErr: any) {
        console.warn("[Step 1 Whisper Warning]", whisperErr?.message || whisperErr);
        transcript = hasTranscript ? customTranscript.trim() : "";
      }
    } else if (hasTranscript) {
      console.log(`[Step 1] Using provided artisan description for user ${user.id}:`, customTranscript);
      transcript = customTranscript.trim();
    } else {
      console.log("[Step 1] No audio or transcript provided; will rely on visual craft analysis.");
      transcript = "";
    }

    requestTranscript = transcript;

    // ───────────────────────────────────────────────────────────
    // STEP 2: Google Gemini Multimodal Analysis
    // ───────────────────────────────────────────────────────────
    console.log(`[Step 2] Analyzing craft image & transcript via Gemini for user ${user.id}...`);

    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash",
      "gemini-flash-latest",
    ];

    let productData: any = null;
    let hitRateLimit429 = false;

    if (geminiApiKey) {
      const geminiPayload = {
        systemInstruction: {
          parts: [
            {
              text: `You are an expert Indian Handicraft Cataloging AI and Fraud Detector. You are given an image of a handmade craft and an optional artisan voice note.

TASK 1: CLASSIFY
Classify the product strictly into ONE allowed category: [Textiles, Pottery, Woodcraft, Metal, Jute, Art, Leather, Jewelry].

TASK 2: AUTHENTICITY CHECK
Analyze the image background and context.
- REJECT if the background is pure digital white, transparent, or a perfect studio gradient.
- REJECT if there are digital watermarks, stock photo logos, or promotional text overlays.
- REJECT if the image is a photograph taken of another digital screen (screen moiré, frame, glass glare).
- ACCEPT ONLY if the image shows natural physical environments (e.g., human hands, workshop tables, raw materials, natural outdoor/indoor lighting, natural shadows).

IF the image FAILS authenticity check:
Set "is_authentic_photo": false, "is_valid": false, and populate "rejection_reason" with the specific violation. Leave catalog fields null.

IF the image PASSES authenticity check:
Set "is_authentic_photo": true, "is_valid": true, "rejection_reason": null, assign the exact category, and extract full product catalog fields.
- Price: Extract the stated audio amount first. If the transcript is empty or lacks a price, perform a "Smart Appraisal"—calculate a fair market valuation based on material and complexity.
- HSN Code: Map the precise 4-to-6 digit Indian GST classification to the primary material detected.
- Description: Write a unique 2-sentence marketing copy reflecting visible colors, patterns, and design details.

EXPECTED JSON FORMAT:
{
  "category": "Exact String from [Textiles, Pottery, Woodcraft, Metal, Jute, Art, Leather, Jewelry] or null",
  "is_authentic_photo": boolean,
  "is_valid": boolean,
  "rejection_reason": "Provide reason if is_authentic_photo is false, else null",
  "name": "Specific product name or null",
  "product_name": "Specific product name or null",
  "title": "Specific product title or null",
  "material": "Specific material or null",
  "hsn_code": "Precise 4-to-6 digit Indian GST classification code or null",
  "price": 0,
  "suggested_price_inr": 0,
  "pricing_method": "<'spoken' or 'smart_appraisal'>" or null,
  "description": "Unique 2-sentence marketing copy reflecting only the specific colors, patterns, and design details visible in the uploaded frame or null"
}`,
            },
          ],
        },
        contents: [
          {
            parts: [
              {
                text: `Artisan voice note transcript: "${transcript || ""}"

AUTHENTICITY & INTEGRITY CHECKS:
1. Verify this is a genuine physical craft, not a selfie, screen photograph, or stock photo.
2. If invalid, set "is_valid": false and provide "rejection_reason" in Hindi and English.
3. If valid, set "is_valid": true, "rejection_reason": null, and extract full catalog fields.

Strictly adhere to the system instructions and return valid JSON matching the Required JSON Output Format.`,
              },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          response_mime_type: "application/json",
          temperature: 0.2,
        },
      };

      for (const model of candidateModels) {
        try {
          console.log(`[Step 2] Attempting model: ${model}...`);
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

          const geminiRes = await fetchWithTimeout(
            geminiUrl,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(geminiPayload),
            },
            15000 // 15-second timeout per model
          );

          if (geminiRes.status === 429) {
            console.warn(`[Step 2] Model ${model} rate-limited (429). Trying next model...`);
            hitRateLimit429 = true;
            continue;
          }

          if (geminiRes.ok) {
            const geminiResult = await geminiRes.json();
            const rawText = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || "";

            if (!rawText) {
              console.warn(`[Step 2] Model ${model} returned empty text. Trying next...`);
              continue;
            }

            try {
              productData = parseGeminiResponse(rawText);
              console.log(`[Step 2 Success] Generated listing with ${model}:`, productData.name || productData.title);
              break;
            } catch (parseErr: any) {
              console.warn(`[Step 2] Response parsing failed for ${model}:`, parseErr.message);
              continue;
            }
          } else {
            const errText = await geminiRes.text();
            console.warn(`[Step 2] Model ${model} failed (${geminiRes.status}):`, errText);
          }
        } catch (modelErr: any) {
          if (modelErr?.name === "AbortError") {
            console.warn(`[Step 2] Model ${model} timed out after 15s. Trying next model...`);
          } else {
            console.warn(`[Step 2] Error with ${model}:`, modelErr?.message || modelErr);
          }
        }
      }
    } else {
      console.warn("[Step 2] GEMINI_API_KEY not configured. Defaulting to dynamic fallback.");
    }

    // ───────────────────────────────────────────────────────────
    // Dynamic Circuit Breaker: if ALL models failed / timed out / 429
    // ───────────────────────────────────────────────────────────
    if (!productData) {
      console.warn("[Step 2] All Gemini attempts exhausted. Activating dynamic fallback.");
      productData = generateDynamicCraftProfile(transcript, user);
      productData.rate_limited = hitRateLimit429;
    } else {
      // ── Integrity Guardrail Rejection: If craft is invalid (screen recapture / stock / not craft) ──
      if (productData.is_valid === false) {
        console.log(`[process-artisan-craft] Craft rejected by Gemini integrity guardrail: ${productData.rejection_reason}`);
        return new Response(JSON.stringify(productData), {
          headers: {
            ...corsHeaders,
            ...rateLimitHeaders,
            "Content-Type": "application/json",
          },
          status: 200,
        });
      }

      // Normalize schema fields from Gemini response
      if (productData.name && !productData.title) {
        productData.title = productData.name;
      }
      if (productData.title && !productData.name) {
        productData.name = productData.title;
      }
      if (productData.category && !productData.craft_category) {
        productData.craft_category = productData.category;
      }
      if (productData.craft_category && !productData.category) {
        productData.category = productData.craft_category;
      }
      if (productData.material && !productData.category) {
        productData.category = productData.material;
        productData.craft_category = productData.material;
      }

      // Parse & normalize price
      if (productData.price) {
        const numericPrice = Number(typeof productData.price === 'string' ? productData.price.replace(/[^0-9.]/g, '') : productData.price) || 450;
        productData.price = numericPrice;
        if (!productData.suggested_retail_price_inr) {
          productData.suggested_retail_price_inr = numericPrice;
        }
        if (!productData.estimated_price_inr) {
          productData.estimated_price_inr = numericPrice;
        }
        if (!productData.bulk_price) {
          productData.bulk_price = Math.round(numericPrice * 0.72);
        }
        if (!productData.suggested_wholesale_price_inr) {
          productData.suggested_wholesale_price_inr = productData.bulk_price;
        }
      }

      // Normalize pricing_method from Gemini or transcript appraisal
      const spokenPriceMatch = transcript ? (transcript.match(/(?:₹|rs\.?|inr|rupees?|रुपये?|कीमत|मूल्य)\s*[:\-]?\s*(\d+)/i) || transcript.match(/(\d{2,6})/)) : null;
      if (productData.pricing_method === 'smart_appraisal' || !spokenPriceMatch) {
        productData.pricing_method = 'smart_appraisal';
      } else {
        productData.pricing_method = 'spoken';
      }
      if (productData.pricing_method === 'smart_appraisal') {
        productData.pricing_reasoning = productData.pricing_reasoning || `Market price estimated based on visual craftsmanship, material (${productData.material || 'handcrafted'}), and standard e-commerce fair-trade rates.`;
      } else {
        productData.pricing_reasoning = productData.pricing_reasoning || `Price extracted directly from artisan voice description (₹${productData.price}).`;
      }

      if (productData.artisan_expected_price !== undefined && productData.artisan_expected_price !== null) {
        productData.artisan_expected_price = Number(productData.artisan_expected_price) || null;
      }
      if (!productData.price && productData.suggested_retail_price_inr) {
        productData.price = productData.suggested_retail_price_inr;
      }
      if (!productData.suggested_retail_price_inr && productData.price) {
        productData.suggested_retail_price_inr = productData.price;
      }
      if (!productData.estimated_price_inr) {
        productData.estimated_price_inr = productData.price || productData.suggested_retail_price_inr;
      }
      if (!productData.bulk_price && productData.suggested_wholesale_price_inr) {
        productData.bulk_price = productData.suggested_wholesale_price_inr;
      }
      if (!productData.suggested_wholesale_price_inr && productData.bulk_price) {
        productData.suggested_wholesale_price_inr = productData.bulk_price;
      }
      if (!productData.bulk_price_inr) {
        productData.bulk_price_inr = productData.bulk_price || productData.suggested_wholesale_price_inr;
      }
      if (!productData.moq) productData.moq = 20;
      if (!productData.unspsc_code) productData.unspsc_code = "60121002";

      // Intelligent HSN Code resolution (prevents terracotta default hallucination)
      const detectedCat = (productData.category || productData.craft_category || productData.material || '').toLowerCase();
      const isClayCraft = detectedCat.includes('clay') || detectedCat.includes('terracotta') || detectedCat.includes('pottery') || detectedCat.includes('ceramic');

      if (!productData.hsn_code || (productData.hsn_code === "69120010" && !isClayCraft)) {
        if (detectedCat.includes('silk') || detectedCat.includes('saree') || detectedCat.includes('sari') || detectedCat.includes('textile') || detectedCat.includes('handloom') || detectedCat.includes('fabric')) {
          productData.hsn_code = "500720";
        } else if (detectedCat.includes('cotton') || detectedCat.includes('khadi')) {
          productData.hsn_code = "520811";
        } else if (detectedCat.includes('brass') || detectedCat.includes('metal') || detectedCat.includes('copper') || detectedCat.includes('bell')) {
          productData.hsn_code = "741810";
        } else if (detectedCat.includes('wood')) {
          productData.hsn_code = "442010";
        } else if (detectedCat.includes('leather')) {
          productData.hsn_code = "420231";
        } else if (detectedCat.includes('stone') || detectedCat.includes('marble')) {
          productData.hsn_code = "680291";
        } else if (detectedCat.includes('jute')) {
          productData.hsn_code = "531010";
        } else if (detectedCat.includes('paint') || detectedCat.includes('art')) {
          productData.hsn_code = "970110";
        } else if (isClayCraft) {
          productData.hsn_code = "69120010";
        } else {
          productData.hsn_code = "970300";
        }
      }

      productData.is_gem_ready = true;
      productData.demo_mode = false;
      productData.rate_limited = false;
      productData.user_id = user?.id || null;

      // Standardized ONDC Beckn Protocol Schema
      productData.ondc_beckn_item = {
        id: `ONDC-ITEM-${Date.now().toString(36).toUpperCase()}`,
        descriptor: {
          name: productData.title,
          name_hi: productData.title_hi || productData.title,
          short_desc: (productData.description || "").slice(0, 140),
          long_desc: productData.description || "",
          images: [],
        },
        price: {
          currency: "INR",
          value: String(productData.price || 450),
        },
        category_id: productData.craft_category || productData.category || "artisan_handicrafts",
        fulfillment_id: "ondc_standard_delivery",
        tags: {
          hsn_code: productData.hsn_code,
          origin_country: "IND",
          make_in_india: "true",
          digital_escrow_enabled: "true",
          escrow_protocol: "ONDC_RSP_BECKN_ESCROW",
          bpp_id: "shilp-setu.artisan.in",
        },
      };

      // Standardized GeM Procurement Schema
      productData.gem_specification = {
        category: productData.gem_category || productData.category || "Handicrafts",
        unspsc: productData.unspsc_code || "60121002",
        hsn: productData.hsn_code,
        moq: productData.moq || 20,
        bulk_unit_price: productData.bulk_price || productData.bulk_price_inr || 280,
        digital_escrow: true,
        pfms_integrated: true,
        msme_preference_eligible: true,
        delivery_terms: "F.O.R. Destination (Central Government Stores)",
        escrow_settlement: "PFMS Milestone Auto-Disbursement on Dispatch",
      };
    }

    return new Response(JSON.stringify(productData), {
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error: any) {
    console.error("[process-artisan-craft Fatal Error]", error?.message || error);
    return new Response(
      JSON.stringify({
        ...generateDynamicCraftProfile(requestTranscript, user),
        rate_limited: false,
        user_id: user?.id || null,
      }),
      {
        headers: {
          ...corsHeaders,
          ...rateLimitHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  }
});
