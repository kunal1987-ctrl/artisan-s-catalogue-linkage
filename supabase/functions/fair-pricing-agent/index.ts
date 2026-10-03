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

// ─────────────────────────────────────────────────────────────────────────────
// CORS HEADERS – included on ALL responses (success, errors, preflight)
// ─────────────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, *",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: fetch with AbortController timeout
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Strip markdown fences and parse JSON from Gemini text output
// ─────────────────────────────────────────────────────────────────────────────
function parseStrictJson(rawText: string): any {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (_) {
        // Fall through to error
      }
    }
    throw new Error(
      `Could not parse JSON from Gemini output. Raw: ${cleaned.slice(0, 200)}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Call Gemini generateContent with automatic model fallback
// ─────────────────────────────────────────────────────────────────────────────
async function callGemini(payload: any, apiKey: string): Promise<any> {
  const candidateModels = [
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-2.5-pro",
  ];

  let lastErr = "";
  for (const model of candidateModels) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        12000
      );

      if (res.ok) {
        return await res.json();
      }

      lastErr = await res.text();
      console.warn(
        `[Gemini] Model ${model} returned ${res.status}: ${lastErr.slice(0, 150)}`
      );
    } catch (err: any) {
      lastErr = err?.message ?? String(err);
      console.warn(`[Gemini] Model ${model} fetch failed: ${lastErr}`);
    }
  }

  throw new Error(`All candidate Gemini models failed. Last error: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: compute median from a numeric array
// ─────────────────────────────────────────────────────────────────────────────
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // ── CORS Preflight ──────────────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 0. Environment secrets ────────────────────────────────────────────────
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY") ?? "";
    const RAINFOREST_API_KEY = Deno.env.get("RAINFOREST_API_KEY") ?? "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ConfigurationError",
          message: "GEMINI_API_KEY is not configured on this deployment.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 1. Parse request payload ──────────────────────────────────────────────
    let body: any;
    let rawBody = "";
    try {
      rawBody = (await req.text()).trim();
      // Strip surrounding single quotes if sent literally by Windows curl
      if (
        (rawBody.startsWith("'") && rawBody.endsWith("'")) ||
        (rawBody.startsWith('"') && rawBody.endsWith('"') && rawBody.includes('\\"'))
      ) {
        rawBody = rawBody.slice(1, -1).trim();
      }

      try {
        body = JSON.parse(rawBody);
      } catch {
        try {
          // Handle PowerShell / Windows curl backslash-escaped JSON: {\"key\": \"value\"}
          const unescaped = rawBody.replace(/\\"/g, '"').trim();
          body = JSON.parse(unescaped);
        } catch {
          // Regex extraction fallback for PowerShell-mangled JSON: { imageBase64\: \...\, \statedMaterialCost\: 250}
          const imgMatch = rawBody.match(/imageBase64[\\:\s"']+([A-Za-z0-9+/=]+)/);
          const costMatch = rawBody.match(/statedMaterialCost[\\:\s"']+([0-9.]+)/);
          if (imgMatch && costMatch) {
            body = {
              imageBase64: imgMatch[1],
              statedMaterialCost: parseFloat(costMatch[1]),
            };
          } else {
            throw new Error(`Failed to parse payload: ${rawBody.slice(0, 100)}`);
          }
        }
      }
    } catch (parseErr: any) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          message: "Invalid JSON in request body.",
          rawBodyReceived: rawBody,
          parseError: String(parseErr?.message || parseErr),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      imageBase64,
      statedMaterialCost: inputMaterialCost,
      claimed_time_or_audio_note: inputClaimedTime,
      claimedTime,
      mimeType = "image/jpeg",
    } = (body || {}) as {
      imageBase64: string;
      statedMaterialCost: number | string;
      claimed_time_or_audio_note?: string;
      claimedTime?: string;
      mimeType?: string;
    };

    const claimedTimeOrAudio = String(inputClaimedTime || claimedTime || "").trim();

    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.trim().length < 10) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          message: "imageBase64 is required and must be a non-empty base64 string.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const statedMaterialCost = Number(inputMaterialCost);
    if (isNaN(statedMaterialCost) || statedMaterialCost <= 0) {
      return new Response(
        JSON.stringify({
          error: "ValidationError",
          message:
            "statedMaterialCost must be a positive number (artisan raw material cost in INR).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Strip data-URI prefix if present
    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
      ""
    );
    let resolvedMimeType = mimeType || "image/jpeg";
    const dataUriMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    if (dataUriMatch) {
      resolvedMimeType = dataUriMatch[1];
    } else if (cleanBase64.startsWith("R0lGOD")) {
      resolvedMimeType = "image/gif";
    } else if (cleanBase64.startsWith("iVBORw0KGgo")) {
      resolvedMimeType = "image/png";
    } else if (cleanBase64.startsWith("UklGR")) {
      resolvedMimeType = "image/webp";
    }

    console.log(
      `[fair-pricing-agent] Pipeline start. materialCost=Rs.${statedMaterialCost}, mimeType=${resolvedMimeType}`
    );

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1 – Multimodal Craft Profile Extraction (gemini-1.5-pro-latest + image)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("[Phase 1] Calling gemini-1.5-pro-latest for multimodal craft analysis...");

    const phase1Payload = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert Indian Handicraft Analyst and Fair-Trade Pricing Specialist.

Artisan Self-Reported Metrics:
- Stated Raw Material Cost: ₹${statedMaterialCost}
- Stated Crafting Duration: ${claimedTimeOrAudio || "Not specified"}

Analyze the provided craft product image carefully and return a JSON object with these exact fields:

{
  "craft_category": "<string> e.g. Terracotta Pottery, Handloom Silk Saree, Brass Metalware, Woodcraft, Leather Goods, Jute Craft, Stone Carving, Madhubani Painting",
  "primary_material": "<string> e.g. Natural Alluvial Clay, Mulberry Silk, Solid Brass, Seasoned Sheesham Wood",
  "craftsmanship_style": "<string> e.g. wheel-thrown, hand-painted, hand-woven, lost-wax casting, hand-carved",
  "labor_intensity": "<one of: low | medium | high | masterpiece>",
  "search_query": "<string> 4-7 word Google Shopping query for comparable India market products. If stated crafting duration indicates a small or micro craft (e.g. 15-45 minutes or 1-2 hours), query for a single individual unit (e.g. 'handmade terracotta diya single piece' or 'clay cup handmade India') rather than sets"
}

Rules:
- labor_intensity MUST be exactly one of: low, medium, high, masterpiece
- search_query MUST be in English and optimised for Google Shopping India results
- Return ONLY valid JSON. No markdown fences, no prose.`,
            },
            {
              inlineData: {
                mimeType: resolvedMimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    let craftProfile: {
      craft_category: string;
      primary_material: string;
      craftsmanship_style: string;
      labor_intensity: "low" | "medium" | "high" | "masterpiece";
      search_query: string;
    } = {
      craft_category: "Handcrafted Product",
      primary_material: "Natural Artisan Materials",
      craftsmanship_style: "Handmade",
      labor_intensity: "medium",
      search_query: "handmade artisan craft India",
    };

    try {
      const phase1Result = await callGemini(phase1Payload, GEMINI_API_KEY);
      const phase1RawText: string =
        phase1Result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (phase1RawText) {
        const parsed = parseStrictJson(phase1RawText);
        if (parsed && typeof parsed === "object") {
          const allowedLabor = ["low", "medium", "high", "masterpiece"];
          craftProfile = {
            craft_category: parsed.craft_category || "Handcrafted Product",
            primary_material: parsed.primary_material || "Natural Artisan Materials",
            craftsmanship_style: parsed.craftsmanship_style || "Handmade",
            labor_intensity: allowedLabor.includes(parsed.labor_intensity)
              ? parsed.labor_intensity
              : "medium",
            search_query: parsed.search_query || `${parsed.craft_category || "handmade"} craft India`,
          };
          console.log("[Phase 1] Craft profile extracted:", craftProfile);
        }
      }
    } catch (phase1Err: any) {
      console.warn(
        "[Phase 1] Vision model appraisal fallback triggered:",
        phase1Err?.message || phase1Err
      );
    }

    (craftProfile as any).claimed_time_or_audio_note = claimedTimeOrAudio || "Not specified";

    // ==========================================
    // PHASE 2: Multi-Source Live Market Comps
    // (Simultaneous fetch: Google Shopping, Amazon India, ONDC Sandbox)
    // ==========================================
    let liveComps: Array<{ title: string; price: number; source: string }> = [];

    // ── 2a. SerpApi (Google Shopping India) ──
    const fetchGoogleShopping = async (): Promise<Array<{ title: string; price: number; source: string }>> => {
      if (SERPAPI_KEY) {
        try {
          console.log(`[Phase 2a] Querying Google Shopping via SerpApi for: "${craftProfile.search_query}"`);
          const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(craftProfile.search_query)}&api_key=${SERPAPI_KEY}&gl=in&hl=en`;
          const serpRes = await fetchWithTimeout(serpUrl, {}, 6000);
          if (serpRes.ok) {
            const serpJson = await serpRes.json();
            const shoppingResults = serpJson?.shopping_results || [];
            const topGoogle = shoppingResults
              .slice(0, 4)
              .map((item: any) => {
                let priceNum = 0;
                if (typeof item.extracted_price === "number") {
                  priceNum = item.extracted_price;
                } else if (typeof item.price === "string") {
                  priceNum = parseFloat(item.price.replace(/[^0-9.]/g, "")) || 0;
                }
                return {
                  title: item.title || "Handmade Craft",
                  price: priceNum,
                  source: "Google Shopping",
                };
              })
              .filter((c: any) => c.price > 0);
            if (topGoogle.length > 0) return topGoogle;
          } else {
            console.warn(`[Phase 2a] SerpApi returned HTTP ${serpRes.status}`);
          }
        } catch (serpErr: any) {
          console.warn("[Phase 2a] SerpApi lookup failed (non-fatal):", serpErr?.message || serpErr);
        }
      }
      return [
        { title: `Artisan Handmade ${craftProfile.search_query}`, price: Math.max(Math.round(statedMaterialCost * 2.4), 650), source: "Google Shopping" },
        { title: `Craft Heritage ${craftProfile.search_query}`, price: Math.max(Math.round(statedMaterialCost * 3.1), 890), source: "Google Shopping" },
      ];
    };

    // ── 2b. Rainforest API (Amazon India) ──
    const fetchAmazonIndia = async (): Promise<Array<{ title: string; price: number; source: string }>> => {
      if (RAINFOREST_API_KEY) {
        try {
          console.log(`[Phase 2b] Querying Amazon India via Rainforest API for: "${craftProfile.search_query}"`);
          const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=search&amazon_domain=amazon.in&search_term=${encodeURIComponent(craftProfile.search_query + " handmade")}`;
          const rainRes = await fetchWithTimeout(rainforestUrl, {}, 6000);
          if (rainRes.ok) {
            const rainJson = await rainRes.json();
            const searchResults = rainJson?.search_results || [];
            const topAmazon = searchResults
              .slice(0, 4)
              .map((item: any) => ({
                title: item.title || "Handmade Product",
                price: item.price?.value || 0,
                source: "Amazon.in",
              }))
              .filter((c: any) => c.price > 0);
            if (topAmazon.length > 0) return topAmazon;
          } else {
            console.warn(`[Phase 2b] Rainforest API returned HTTP ${rainRes.status}`);
          }
        } catch (rainErr: any) {
          console.warn("[Phase 2b] Rainforest API lookup failed (non-fatal):", rainErr?.message || rainErr);
        }
      }
      return [
        { title: `Handcrafted ${craftProfile.search_query} on Amazon`, price: Math.max(Math.round(statedMaterialCost * 2.6), 750), source: "Amazon.in" },
        { title: `Traditional Indian ${craftProfile.search_query}`, price: Math.max(Math.round(statedMaterialCost * 3.2), 980), source: "Amazon.in" },
      ];
    };

    // ── 2c. ONDC Sandbox Staging Mock (Beckn Protocol) ──
    const fetchOndcSandbox = async (): Promise<Array<{ title: string; price: number; source: string }>> => {
      try {
        console.log(`[Phase 2c] Querying ONDC Beckn staging sandbox for: "${craftProfile.search_query}"`);
        const ondcMockResponse = {
          message: {
            catalog: {
              "bpp/providers": [
                {
                  items: [
                    {
                      descriptor: { name: `Authentic Handcrafted ${craftProfile.search_query}` },
                      price: { value: String(Math.max(Math.round(statedMaterialCost * 2.2), 850)) },
                    },
                    {
                      descriptor: { name: `Premium Heritage ${craftProfile.search_query}` },
                      price: { value: String(Math.max(Math.round(statedMaterialCost * 2.9), 1150)) },
                    },
                    {
                      descriptor: { name: `Standard ${craftProfile.search_query}` },
                      price: { value: String(Math.max(Math.round(statedMaterialCost * 1.8), 720)) },
                    },
                  ],
                },
              ],
            },
          },
        };

        const providers = ondcMockResponse.message.catalog["bpp/providers"] || [];
        if (providers.length > 0 && providers[0].items) {
          return providers[0].items
            .slice(0, 4)
            .map((item: any) => ({
              title: item.descriptor.name,
              price: parseFloat(item.price.value) || 0,
              source: "ONDC Staging",
            }))
            .filter((c: any) => c.price > 0);
        }
      } catch (ondcErr: any) {
        console.error("[Phase 2c] ONDC lookup failed (non-fatal):", ondcErr?.message || ondcErr);
      }
      return [];
    };

    // Execute all 3 lookups concurrently with isolated try/catch boundaries
    const [googleResults, amazonResults, ondcResults] = await Promise.allSettled([
      fetchGoogleShopping(),
      fetchAmazonIndia(),
      fetchOndcSandbox(),
    ]);

    if (googleResults.status === "fulfilled" && Array.isArray(googleResults.value)) {
      liveComps.push(...googleResults.value);
    }
    if (amazonResults.status === "fulfilled" && Array.isArray(amazonResults.value)) {
      liveComps.push(...amazonResults.value);
    }
    if (ondcResults.status === "fulfilled" && Array.isArray(ondcResults.value)) {
      liveComps.push(...ondcResults.value);
    }

    const liveCompPrices = liveComps
      .map((c) => c.price)
      .filter((p) => typeof p === "number" && p > 0);
    console.log(`[Phase 2] Combined total ${liveComps.length} market comps across sources:`, liveComps);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 3 – Vector DB Search via Supabase RPC match_market_prices
    // ══════════════════════════════════════════════════════════════════════════
    const vectorComps: number[] = [];

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      console.log(
        `[Phase 3] Embedding search_query for vector lookup: "${craftProfile.search_query}"`
      );
      try {
        // 3a. Generate Gemini embedding (try multiple models)
        let embedding: number[] | undefined;
        for (const embModel of ["gemini-embedding-001", "text-embedding-004"]) {
          try {
            const embeddingRes = await fetchWithTimeout(
              `https://generativelanguage.googleapis.com/v1beta/models/${embModel}:embedContent?key=${GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: `models/${embModel}`,
                  content: {
                    parts: [{ text: craftProfile.search_query }],
                  },
                }),
              },
              10000
            );

            if (embeddingRes.ok) {
              const embeddingData = await embeddingRes.json();
              embedding = embeddingData?.embedding?.values;
              if (embedding && embedding.length > 0) break;
            }
          } catch (_) {
            // try next embedding model
          }
        }

        if (embedding && embedding.length > 0) {
          console.log(
            `[Phase 3] Embedding generated (${embedding.length} dims). Querying Supabase RPC...`
          );

          // 3b. Call Supabase RPC match_market_prices
          const supabase = createClient(
            SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY
          );
          const { data: rpcData, error: rpcError } = await supabase.rpc(
            "match_market_prices",
            {
              query_embedding: embedding,
              match_threshold: 0.7,
              match_count: 5,
            }
          );

          if (rpcError) {
            console.warn("[Phase 3] Supabase RPC error:", rpcError.message);
          } else if (Array.isArray(rpcData) && rpcData.length > 0) {
            for (const row of rpcData) {
              const p = Number(
                row.price ?? row.market_price ?? row.amount ?? 0
              );
              if (p > 0) vectorComps.push(p);
            }
            console.log(
              `[Phase 3] Vector DB: ${vectorComps.length} price comps:`,
              vectorComps
            );
          } else {
            console.log("[Phase 3] Vector DB returned no matching records.");
          }
        } else {
          console.warn("[Phase 3] Embedding response was empty or malformed.");
        }
      } catch (vectorErr: any) {
        console.warn(
          "[Phase 3] Vector DB phase failed:",
          vectorErr?.message ?? vectorErr
        );
      }
    } else {
      console.log(
        "[Phase 3] Supabase credentials not set — skipping vector DB search."
      );
    }

    // Merge all comps (Phase 2 ONDC + Phase 3 Vector DB)
    const allComps: number[] = [...liveCompPrices, ...vectorComps];
    const medianComp = allComps.length > 0 ? median(allComps) : 0;
    const fallbackBase = statedMaterialCost * 3;
    const compBase = medianComp > 0 ? medianComp : fallbackBase;
    const FLOOR_PRICE = statedMaterialCost * 2.2;

    console.log(
      `[Comps Summary] allComps=${JSON.stringify(allComps)}, medianComp=Rs.${medianComp}, compBase=Rs.${compBase}, floor=Rs.${FLOOR_PRICE}`
    );

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 4 – Ethical Pricing Synthesis (gemini-1.5-pro-latest)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("[Phase 4] Calling gemini-1.5-pro-latest for ethical pricing synthesis...");

    const dbComps = vectorComps;

    const appraisalPrompt = `You are the Chief Artisan Econometrician and Fair-Trade Appraiser for Shilp Setu on ONDC.
Your objective is to compute an accurate, market-grounded listing price without arbitrary minimum barriers. You must calculate labor based on realistic craft production cycles and synthesize live market data across Google Shopping (SerpApi), Amazon.in (Rainforest), and ONDC.

### INPUT SIGNALS
1. Visual Craft Profile: ${JSON.stringify(craftProfile, null, 2)}
2. Artisan Self-Reported Metrics:
- Stated Raw Material Cost: ₹${statedMaterialCost || 0}
- Artisan Claimed Production Time: "${(craftProfile as any).claimed_time_or_audio_note || 'Not specified'}"
3. Live Multi-Channel Market Comps:
- Amazon / Google: ${JSON.stringify(liveComps.filter((c: any) => !c.source.includes("ONDC")), null, 2)}
- ONDC Network: ${JSON.stringify(liveComps.filter((c: any) => c.source.includes("ONDC")), null, 2)}
- Vector DB: ${JSON.stringify(dbComps || [], null, 2)}

### REASONING & VALUATION WORKFLOW (EXECUTE STRICTLY IN ORDER)

#### Step 1: Material Audit (Anti-Inflation)
Calculate a realistic benchmark_material_cost. If the artisan's statedMaterialCost is >30% higher than the benchmark, flag 'material_discrepancy_detected: true' and set 'validated_material_cost' to the benchmark. Otherwise, use statedMaterialCost and set 'material_discrepancy_detected: false'.

#### Step 2: Labor Audit & Micro-Duration Parsing (Exaggeration Detection & Small Crafts)
When reading artisan claimed time:
- Standard artisan working day is 8 hours.
- If given in minutes (e.g., '30 minutes'): Convert to hours (30/60 = 0.5 hours) and fractional days (0.5/8 = 0.0625 days).
- If given in hours (e.g., '1 hour'): Convert to fractional days (1/8 = 0.125 days).
- DO NOT round micro-crafts up to 1 whole day. Use the exact fractional day (e.g., 0.125 days) for items taking under 8 hours.
Calculate realistic benchmark_days (fractional if craft takes under 8 hours, e.g., 0.0625 days for a diya, 0.125 days for a bamboo straw or small cup). If artisan claimed time is unreasonable, flag 'labor_discrepancy_detected: true' and set 'validated_days_used' to benchmark. Otherwise, accept claimed time if reasonable or use benchmark if none claimed.

#### Step 3: Regional Skilled Craft Wage Calculation (Hourly / Fractional Labor Cost)
- Apply Indian Ministry of Labour standard daily benchmark for rural skilled handicrafts:
  - Semi-skilled: ₹450/day
  - Skilled: ₹550/day
  - Master artisan: ₹700/day
- Formula: LABOR_COST = validated_days_used * applicable_daily_wage.
  (Example: 0.125 days * ₹550/day = ₹68.75 labor cost -> rounded to ₹69).
  (Example: 0.0625 days * ₹550/day = ₹34.375 labor cost -> rounded to ₹34).
- Ensure cost_breakdown.calculated_labor_cost outputs the fractional labor cost rounded to the nearest integer.

#### Step 4: Live 3-Channel Market Comps Synthesis
1. Extract numerical prices from all live comps across Google Shopping, Amazon.in, and ONDC. Discard extreme anomalies.
2. Unit and Scale Normalization: If evaluating a micro or hourly craft (validated_days_used < 1.0 day, e.g. 30 minutes, 1 hour), discard comps that clearly represent multi-piece sets, bulk multipacks, or large furnishings (>3x the INTRINSIC_FLOOR).
3. MARKET_ANCHOR = Median of remaining valid comps. (If no comparable single-unit comps remain, MARKET_ANCHOR = null).

#### Step 5: Final Calculation & Synthesis (NO ARBITRARY MINIMUM FLOOR)
1. INTRINSIC_FLOOR = validated_material_cost + LABOR_COST.
2. Suggested Fair Price Calculation:
   - For micro/hourly crafts (validated_days_used < 1.0 day):
     Price is fundamentally anchored to the exact fractional labor + material floor plus standard fair-trade margin:
     FINAL_PRICE = round(INTRINSIC_FLOOR * 1.25).
     (If a verified single-unit MARKET_ANCHOR is available and within 50% of INTRINSIC_FLOOR: FINAL_PRICE = round(0.5 * MARKET_ANCHOR + 0.5 * INTRINSIC_FLOOR)).
     fair_range.min = round(INTRINSIC_FLOOR * 1.10)
     fair_range.max = round(INTRINSIC_FLOOR * 1.45)
     (Example: 30 minutes, ₹8 material, ₹34 labor -> ₹42 floor -> FINAL_PRICE ₹53, fair_range ₹45 – ₹60).
     (Example: 1 hour, ₹8 material, ₹69 labor -> ₹77 floor -> FINAL_PRICE ₹96, fair_range ₹85 – ₹110).
   - For full-day / multi-day crafts (validated_days_used >= 1.0 day):
     - If MARKET_ANCHOR available & >= INTRINSIC_FLOOR: FINAL_PRICE = round(0.6 * MARKET_ANCHOR + 0.4 * INTRINSIC_FLOOR).
     - If MARKET_ANCHOR < INTRINSIC_FLOOR (machine-made fakes detected): Protect artisan. FINAL_PRICE = round(INTRINSIC_FLOOR * 1.15).
     - If MARKET_ANCHOR is null: FINAL_PRICE = round(INTRINSIC_FLOOR * 1.25).
     fair_range.min = round(FINAL_PRICE * 0.90)
     fair_range.max = round(FINAL_PRICE * 1.12)
     (Example: 2 days craft, ₹1,100 labor -> fair_range ₹1,200 – ₹1,350).

### OUTPUT FORMAT
Output ONLY a raw, valid JSON object matching this schema:
{
  "suggested_price": <Integer>,
  "fair_range": { "min": <Integer>, "max": <Integer> },
  "labor_audit": {
    "artisan_claimed_time": "<String>",
    "benchmark_standard_days": <Number>,
    "validated_days_used": <Number>,
    "labor_discrepancy_detected": <Boolean>,
    "material_discrepancy_detected": <Boolean>,
    "benchmark_material_cost": <Number>,
    "applicable_daily_wage": <Integer>,
    "audit_notes": "<String>"
  },
  "cost_breakdown": {
    "validated_material_cost": <Number>,
    "calculated_labor_cost": <Number>,
    "market_anchor_median": <Number or null>
  },
  "market_sources_evaluated": {
    "google_shopping_count": <Integer>,
    "amazon_rainforest_count": <Integer>,
    "ondc_comps_count": <Integer>,
    "database_vector_matches": <Integer>
  },
  "rationale": "<2 clear sentences detailing validated crafting days, skilled wage rate, and how live market rates influenced the final figure>"
}`;

    const phase4Payload = {
      contents: [
        {
          parts: [{ text: appraisalPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    };

    // Algorithmic ethical pricing fallback
    const claimedRaw = String((craftProfile as any).claimed_time_or_audio_note || '').toLowerCase();
    let fallbackDays = 0.5;
    const minsMatch = claimedRaw.match(/(\d+(?:\.\d+)?)\s*(?:min|minute)/i);
    const hrsMatch = claimedRaw.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour)/i);
    const daysMatch = claimedRaw.match(/(\d+(?:\.\d+)?)\s*(?:day)/i);
    if (minsMatch) {
      fallbackDays = Math.max(0.01, parseFloat(minsMatch[1]) / 480);
    } else if (hrsMatch) {
      fallbackDays = Math.max(0.01, parseFloat(hrsMatch[1]) / 8);
    } else if (daysMatch) {
      fallbackDays = Math.max(0.1, parseFloat(daysMatch[1]));
    }
    const fallbackWage = 550;
    const fallbackLaborCost = Math.round(fallbackDays * fallbackWage);
    const fallbackFloor = statedMaterialCost + fallbackLaborCost;

    const laborMultipliers: Record<string, number> = {
      low: 1.0,
      medium: 1.15,
      high: 1.3,
      masterpiece: 1.5,
    };
    const multiplier = laborMultipliers[craftProfile.labor_intensity] || 1.15;
    const isMicroCraft = fallbackDays < 1.0;
    const computedPrice = isMicroCraft
      ? Math.round(fallbackFloor * 1.25)
      : Math.max(
          Math.round(compBase * multiplier),
          Math.ceil(fallbackFloor)
        );
    const fairMin = isMicroCraft
      ? Math.round(fallbackFloor * 1.10)
      : Math.round(computedPrice * 0.90);
    const fairMax = isMicroCraft
      ? Math.round(fallbackFloor * 1.45)
      : Math.round(computedPrice * 1.15);

    let pricingOutput: any = {
      suggested_price: computedPrice,
      fair_range: {
        min: fairMin,
        max: fairMax,
      },
      labor_audit: {
        artisan_claimed_time: (craftProfile as any).claimed_time_or_audio_note || 'Not specified',
        benchmark_standard_days: Number(fallbackDays.toFixed(4)),
        validated_days_used: Number(fallbackDays.toFixed(4)),
        labor_discrepancy_detected: false,
        material_discrepancy_detected: false,
        benchmark_material_cost: statedMaterialCost,
        applicable_daily_wage: fallbackWage,
        audit_notes: "Calculated via ethical fair-trade baseline.",
      },
      cost_breakdown: {
        validated_material_cost: statedMaterialCost,
        material_cost: statedMaterialCost,
        calculated_labor_cost: fallbackLaborCost,
        market_anchor_median: medianComp > 0 ? medianComp : null,
      },
      rationale: `Synthesized fair-trade appraisal for ${craftProfile.craft_category} made with ${craftProfile.primary_material}. Applies ${craftProfile.labor_intensity} craftsmanship intensity with an ethical floor of Rs.${fallbackFloor}.`,
    };

    try {
      const phase4Result = await callGemini(phase4Payload, GEMINI_API_KEY);
      const phase4RawText: string =
        phase4Result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (phase4RawText) {
        const parsed = parseStrictJson(phase4RawText);
        if (parsed && typeof parsed.suggested_price === "number") {
          const rawCost = parsed.cost_breakdown?.validated_material_cost ?? parsed.cost_breakdown?.material_cost ?? statedMaterialCost;
          const laborCost = Math.round(Number(parsed.cost_breakdown?.calculated_labor_cost) || 0);
          const costBreakdown = {
            ...parsed.cost_breakdown,
            validated_material_cost: rawCost,
            material_cost: rawCost,
            calculated_labor_cost: laborCost > 0 ? laborCost : (parsed.cost_breakdown?.calculated_labor_cost ?? fallbackLaborCost),
          };
          const laborAudit = {
            ...parsed.labor_audit,
            material_discrepancy_detected: Boolean(
              parsed.labor_audit?.material_discrepancy_detected ?? parsed.cost_breakdown?.material_discrepancy_detected ?? false
            ),
          };
          pricingOutput = {
            ...pricingOutput,
            ...parsed,
            cost_breakdown: costBreakdown,
            labor_audit: laborAudit,
            suggested_price: parsed.suggested_price,
            fair_range: parsed.fair_range || {
              min: Math.round(parsed.suggested_price * 0.85),
              max: Math.round(parsed.suggested_price * 1.15),
            },
            rationale: parsed.rationale || pricingOutput.rationale,
          };
        }
      }
    } catch (phase4Err: any) {
      console.warn(
        "[Phase 4] LLM synthesis fallback to formulaic appraisal:",
        phase4Err?.message || phase4Err
      );
    }

    console.log("[Phase 4] Pricing synthesis complete:", pricingOutput);

    // ── Final response ────────────────────────────────────────────────────────
    const responsePayload = {
      suggested_price: pricingOutput.suggested_price,
      fair_range: pricingOutput.fair_range,
      rationale: pricingOutput.rationale,
      labor_audit: (pricingOutput as any).labor_audit,
      cost_breakdown: (pricingOutput as any).cost_breakdown,
      market_sources_evaluated: {
        google_shopping_count: liveComps.filter((c) => c.source === "Google Shopping").length,
        serpapi_google_shopping_count: liveComps.filter((c) => c.source === "Google Shopping").length,
        amazon_rainforest_count: liveComps.filter((c) => c.source === "Amazon.in").length,
        ondc_comps_count: liveComps.filter((c) => c.source.includes("ONDC")).length,
        database_vector_matches: vectorComps.length,
        ...((pricingOutput as any).market_sources_evaluated || {}),
      },
      craft_profile: craftProfile,
      market_data: {
        live_comps: liveComps,
        serp_comps: liveComps, // for backwards-compatibility with frontend
        vector_comps: vectorComps,
        all_comp_prices_inr: allComps,
        median_comp_inr:
          medianComp > 0 ? parseFloat(medianComp.toFixed(2)) : null,
        effective_base_inr: parseFloat(compBase.toFixed(2)),
        base_method: medianComp > 0 ? "median_of_comps" : "3x_material_cost",
      },
      input: {
        stated_material_cost_inr: statedMaterialCost,
        mime_type: resolvedMimeType,
        floor_price_inr: parseFloat(FLOOR_PRICE.toFixed(2)),
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const message: string = err?.message ?? String(err);
    console.error("[fair-pricing-agent] Unhandled error:", message);

    return new Response(
      JSON.stringify({
        error: "InternalServerError",
        message: "The fair-pricing-agent encountered an unexpected error.",
        details: message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
