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
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error(
      `Could not parse JSON from Gemini output. Raw: ${cleaned.slice(0, 200)}`
    );
  }
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
    const body = await req.json();
    const {
      imageBase64,
      statedMaterialCost,
      mimeType = "image/jpeg",
    } = body as {
      imageBase64: string;
      statedMaterialCost: number;
      mimeType?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== "string" || imageBase64.length < 50) {
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

    if (typeof statedMaterialCost !== "number" || statedMaterialCost <= 0) {
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
    const resolvedMimeType = mimeType || "image/jpeg";

    console.log(
      `[fair-pricing-agent] Pipeline start. materialCost=Rs.${statedMaterialCost}, mimeType=${resolvedMimeType}`
    );

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 1 – Multimodal Craft Profile Extraction (gemini-1.5-pro + image)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("[Phase 1] Calling gemini-1.5-pro for multimodal craft analysis...");

    const phase1Payload = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert Indian Handicraft Analyst and Fair-Trade Pricing Specialist.

Analyze the provided craft product image carefully and return a JSON object with these exact fields:

{
  "craft_category": "<string> e.g. Terracotta Pottery, Handloom Silk Saree, Brass Metalware, Woodcraft, Leather Goods, Jute Craft, Stone Carving, Madhubani Painting",
  "primary_material": "<string> e.g. Natural Alluvial Clay, Mulberry Silk, Solid Brass, Seasoned Sheesham Wood",
  "craftsmanship_style": "<string> e.g. wheel-thrown, hand-painted, hand-woven, lost-wax casting, hand-carved",
  "labor_intensity": "<one of: low | medium | high | masterpiece>",
  "search_query": "<string> 4-7 word Google Shopping query for comparable India market products e.g. handmade terracotta flower pot India"
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
        maxOutputTokens: 512,
      },
    };

    const phase1Res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phase1Payload),
      },
      20000
    );

    if (!phase1Res.ok) {
      const errBody = await phase1Res.text();
      throw new Error(
        `[Phase 1] Gemini API error ${phase1Res.status}: ${errBody.slice(0, 300)}`
      );
    }

    const phase1Result = await phase1Res.json();
    const phase1RawText: string =
      phase1Result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!phase1RawText) {
      throw new Error("[Phase 1] Gemini returned an empty response. Cannot continue.");
    }

    const craftProfile = parseStrictJson(phase1RawText) as {
      craft_category: string;
      primary_material: string;
      craftsmanship_style: string;
      labor_intensity: "low" | "medium" | "high" | "masterpiece";
      search_query: string;
    };

    console.log("[Phase 1] Craft profile extracted:", craftProfile);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 2 – Live Market Comps via SerpApi Google Shopping (top 4)
    // ══════════════════════════════════════════════════════════════════════════
    const serpComps: number[] = [];
    const serpItems: Array<{ title: string; price: number; source: string }> = [];

    if (SERPAPI_KEY) {
      console.log(
        `[Phase 2] Fetching Google Shopping comps for: "${craftProfile.search_query}"`
      );
      try {
        const serpParams = new URLSearchParams({
          engine: "google_shopping",
          q: craftProfile.search_query,
          gl: "in",
          hl: "en",
          num: "10",
          api_key: SERPAPI_KEY,
        });

        const serpRes = await fetchWithTimeout(
          `https://serpapi.com/search?${serpParams.toString()}`,
          { method: "GET" },
          12000
        );

        if (serpRes.ok) {
          const serpData = await serpRes.json();
          const shoppingResults: any[] = serpData?.shopping_results ?? [];

          let count = 0;
          for (const item of shoppingResults) {
            if (count >= 4) break;
            const rawPrice: string = (
              item.price ??
              item.extracted_price ??
              ""
            ).toString();
            const numericPrice = parseFloat(
              rawPrice.replace(/[Rs.,\s]/g, "").replace(/[^0-9.]/g, "")
            );
            if (numericPrice > 0) {
              serpComps.push(numericPrice);
              serpItems.push({
                title: item.title ?? "Unknown",
                price: numericPrice,
                source: item.source ?? "Google Shopping",
              });
              count++;
            }
          }
          console.log(`[Phase 2] ${serpItems.length} SerpApi comps:`, serpItems);
        } else {
          const errText = await serpRes.text();
          console.warn(
            `[Phase 2] SerpApi ${serpRes.status}: ${errText.slice(0, 200)}`
          );
        }
      } catch (serpErr: any) {
        console.warn("[Phase 2] SerpApi failed:", serpErr?.message ?? serpErr);
      }
    } else {
      console.log("[Phase 2] SERPAPI_KEY not set — skipping live market comps.");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 3 – Vector DB Search via Supabase RPC match_market_prices
    // ══════════════════════════════════════════════════════════════════════════
    const vectorComps: number[] = [];

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      console.log(
        `[Phase 3] Embedding search_query for vector lookup: "${craftProfile.search_query}"`
      );
      try {
        // 3a. Generate Gemini text-embedding-004
        const embeddingRes = await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "models/text-embedding-004",
              content: {
                parts: [{ text: craftProfile.search_query }],
              },
            }),
          },
          10000
        );

        if (embeddingRes.ok) {
          const embeddingData = await embeddingRes.json();
          const embedding: number[] | undefined =
            embeddingData?.embedding?.values;

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
        } else {
          const errText = await embeddingRes.text();
          console.warn(
            `[Phase 3] Embedding API error ${embeddingRes.status}: ${errText.slice(0, 200)}`
          );
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

    // Merge all comps (Phase 2 + Phase 3)
    const allComps: number[] = [...serpComps, ...vectorComps];
    const medianComp = allComps.length > 0 ? median(allComps) : 0;
    const fallbackBase = statedMaterialCost * 3;
    const compBase = medianComp > 0 ? medianComp : fallbackBase;
    const FLOOR_PRICE = statedMaterialCost * 2.2;

    console.log(
      `[Comps Summary] allComps=${JSON.stringify(allComps)}, medianComp=Rs.${medianComp}, compBase=Rs.${compBase}, floor=Rs.${FLOOR_PRICE}`
    );

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 4 – Ethical Pricing Synthesis (gemini-1.5-pro)
    // ══════════════════════════════════════════════════════════════════════════
    console.log("[Phase 4] Calling gemini-1.5-pro for ethical pricing synthesis...");

    const phase4SystemContext = `You are an Ethical Artisan Pricing Specialist for Indian Handicrafts.
Apply fair-trade and ethical labor pricing rules strictly and return ONLY a JSON object.

PRICING RULES:
1. Base Price = median of market comparables if available, otherwise 3x the artisan material cost.
2. Labor Multipliers (applied additively to Base):
   - low labor_intensity: +0% (no change)
   - medium labor_intensity: +15%
   - high labor_intensity: +30%
   - masterpiece labor_intensity: +50%
3. Hard Floor: suggested_price MUST NEVER be lower than materialCost x 2.2 = Rs.${FLOOR_PRICE.toFixed(2)}.
4. fair_range: [suggested_price x 0.85, suggested_price x 1.15] rounded to nearest integer.
5. Rationale: 2-3 sentences explaining the pricing decision referencing craft-specific factors.

REQUIRED JSON OUTPUT (no markdown, no prose, no code fences):
{
  "suggested_price": <integer INR>,
  "fair_range": { "min": <integer INR>, "max": <integer INR> },
  "rationale": "<string>"
}`;

    const phase4UserPrompt = `Craft Profile:
- Category: ${craftProfile.craft_category}
- Primary Material: ${craftProfile.primary_material}
- Craftsmanship Style: ${craftProfile.craftsmanship_style}
- Labor Intensity: ${craftProfile.labor_intensity}
- Artisan Stated Material Cost: Rs.${statedMaterialCost}

Market Comparables:
- SerpApi Google Shopping (INR): ${
      serpComps.length > 0
        ? serpComps.map((p) => `Rs.${p}`).join(", ")
        : "No live comps available"
    }
- Vector DB Historical Comps (INR): ${
      vectorComps.length > 0
        ? vectorComps.map((p) => `Rs.${p}`).join(", ")
        : "No historical comps available"
    }
- Median of All Comps: ${
      medianComp > 0
        ? `Rs.${medianComp.toFixed(2)}`
        : "N/A — using 3x material cost as base"
    }
- Effective Base Price (before labor multiplier): Rs.${compBase.toFixed(2)}
- Hard Floor (materialCost x 2.2): Rs.${FLOOR_PRICE.toFixed(2)}

Apply rules and return the JSON object.`;

    const phase4Payload = {
      system_instruction: {
        parts: [{ text: phase4SystemContext }],
      },
      contents: [
        {
          parts: [{ text: phase4UserPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.05,
        maxOutputTokens: 512,
      },
    };

    const phase4Res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(phase4Payload),
      },
      20000
    );

    if (!phase4Res.ok) {
      const errBody = await phase4Res.text();
      throw new Error(
        `[Phase 4] Gemini API error ${phase4Res.status}: ${errBody.slice(0, 300)}`
      );
    }

    const phase4Result = await phase4Res.json();
    const phase4RawText: string =
      phase4Result?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!phase4RawText) {
      throw new Error("[Phase 4] Gemini returned empty synthesis response.");
    }

    const pricingOutput = parseStrictJson(phase4RawText) as {
      suggested_price: number;
      fair_range: { min: number; max: number };
      rationale: string;
    };

    // Belt-and-suspenders hard floor enforcement
    if (pricingOutput.suggested_price < FLOOR_PRICE) {
      console.warn(
        `[Phase 4] Floor enforcement: suggested Rs.${pricingOutput.suggested_price} < floor Rs.${FLOOR_PRICE.toFixed(2)}. Applying floor.`
      );
      pricingOutput.suggested_price = Math.ceil(FLOOR_PRICE);
      pricingOutput.fair_range = {
        min: Math.round(pricingOutput.suggested_price * 0.85),
        max: Math.round(pricingOutput.suggested_price * 1.15),
      };
    }

    console.log("[Phase 4] Pricing synthesis complete:", pricingOutput);

    // ── Final response ────────────────────────────────────────────────────────
    const responsePayload = {
      suggested_price: pricingOutput.suggested_price,
      fair_range: pricingOutput.fair_range,
      rationale: pricingOutput.rationale,
      craft_profile: craftProfile,
      market_data: {
        serp_comps: serpItems,
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
