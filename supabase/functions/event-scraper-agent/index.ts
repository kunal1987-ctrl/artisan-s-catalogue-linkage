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
// CORS HEADERS
// ─────────────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, *",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────────────────────────────
interface SearchSnippet {
  query: string;
  title: string;
  snippet: string;
  link: string;
  date?: string;
}

interface ParsedEvent {
  title: string;
  organizer: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  registration_url?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: fetch with AbortController timeout
// ─────────────────────────────────────────────────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 15000
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
// HELPER: Strip markdown fences and parse strict JSON from Gemini output
// ─────────────────────────────────────────────────────────────────────────────
function parseStrictJson(rawText: string): any {
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonArrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonArrayMatch) {
      try {
        return JSON.parse(jsonArrayMatch[0]);
      } catch {
        // Fall through
      }
    }
    const jsonObjectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        return JSON.parse(jsonObjectMatch[0]);
      } catch {
        // Fall through
      }
    }
    throw new Error(
      `Could not parse JSON from Gemini output. Raw snippet: ${cleaned.slice(0, 300)}`
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Call Gemini generateContent with automatic model fallback
// ─────────────────────────────────────────────────────────────────────────────
async function callGemini(payload: any, apiKey: string): Promise<any> {
  const candidateModels = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
  ];

  let lastErr = "";
  for (const model of candidateModels) {
    try {
      console.log(`[Gemini] Attempting model extraction via: ${model}...`);
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        20000
      );

      if (res.ok) {
        console.log(`[Gemini] Successfully received response from ${model}`);
        return await res.json();
      }

      lastErr = await res.text();
      console.warn(
        `[Gemini] Model ${model} returned HTTP ${res.status}: ${lastErr.slice(0, 160)}`
      );
    } catch (err: any) {
      lastErr = err?.message ?? String(err);
      console.warn(`[Gemini] Model ${model} call failed: ${lastErr}`);
    }
  }

  throw new Error(`All candidate Gemini models failed. Last error: ${lastErr}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Date format validation (YYYY-MM-DD)
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeDate(dateStr: any): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : dateStr.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log(`\n======================================================`);
  console.log(`[Event Scraper Agent] Invoked at ${new Date().toISOString()}`);
  console.log(`======================================================`);

  try {
    // ── 0. Environment configuration ─────────────────────────────────────────
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY") ?? "";
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!SERPAPI_KEY) {
      return new Response(
        JSON.stringify({
          error: "ConfigurationError",
          message: "SERPAPI_KEY is not configured in environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "ConfigurationError",
          message: "GEMINI_API_KEY is not configured in environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: "ConfigurationError",
          message:
            "SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are not configured.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── 1. Optional Payload Parsing (supports custom queries & Windows curl) ──
    let customQueries: string[] | null = null;
    try {
      const rawBody = (await req.text()).trim();
      if (rawBody.length > 0) {
        let cleanBody = rawBody;
        if (
          (cleanBody.startsWith("'") && cleanBody.endsWith("'")) ||
          (cleanBody.startsWith('"') && cleanBody.endsWith('"') && cleanBody.includes('\\"'))
        ) {
          cleanBody = cleanBody.slice(1, -1).trim();
        }
        const parsed = JSON.parse(cleanBody);
        if (Array.isArray(parsed.queries) && parsed.queries.length > 0) {
          customQueries = parsed.queries;
        }
      }
    } catch {
      // Non-JSON or empty body is completely fine, default queries will be used
    }

    const defaultSearchQueries = [
      "upcoming TRIFED Shilp Mahotsav India 2026 dates",
      "Saras Ajeevika Mela upcoming dates location",
      "Hunar Haat upcoming exhibition dates 2026",
      "Surajkund International Crafts Mela schedule",
      "Khadi Mahotsav exhibition dates 2026",
      "ONDC artisan onboarding drive events",
      "upcoming handicraft handloom exhibitions in Madhya Pradesh",
    ];

    const targetQueries = customQueries || defaultSearchQueries;

    console.log(`[Step 1] Initializing SerpApi Search for ${targetQueries.length} queries:`);
    targetQueries.forEach((q, idx) => console.log(`  ${idx + 1}. "${q}"`));

    // ── 2. Step 1: Web Search (SerpApi) ──────────────────────────────────────
    const allSnippets: SearchSnippet[] = [];

    for (const query of targetQueries) {
      try {
        const serpUrl = new URL("https://serpapi.com/search.json");
        serpUrl.searchParams.set("engine", "google");
        serpUrl.searchParams.set("q", query);
        serpUrl.searchParams.set("api_key", SERPAPI_KEY);
        serpUrl.searchParams.set("gl", "in"); // Geolocation: India
        serpUrl.searchParams.set("hl", "en"); // Language: English
        serpUrl.searchParams.set("num", "8"); // Top 8 organic results

        console.log(`[SerpApi] Fetching Google organic results for: "${query}"...`);
        const serpRes = await fetchWithTimeout(serpUrl.toString(), {}, 12000);

        if (!serpRes.ok) {
          const errText = await serpRes.text();
          console.warn(`[SerpApi] Search failed for "${query}" with status ${serpRes.status}: ${errText.slice(0, 150)}`);
          continue;
        }

        const serpData = await serpRes.json();
        const organic = serpData?.organic_results || [];
        console.log(`[SerpApi] Retrieved ${organic.length} organic results for "${query}"`);

        for (const item of organic) {
          if (item.snippet || item.title) {
            allSnippets.push({
              query,
              title: item.title || "",
              snippet: item.snippet || "",
              link: item.link || "",
              date: item.date || undefined,
            });
          }
        }
      } catch (err: any) {
        console.warn(`[SerpApi] Exception while querying "${query}":`, err?.message || err);
      }
    }

    if (allSnippets.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No search results returned by SerpApi for the given queries.",
          queries: targetQueries,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`\n[Step 2] Sending ${allSnippets.length} snippets to Gemini 1.5 Flash for extraction...`);

    // ── 3. Step 2: AI Extraction (Gemini 1.5 Flash) ──────────────────────────
    const geminiSystemPrompt =
      "You are an event parser. Read these search snippets and identify upcoming Indian artisan exhibitions, melas, or government trade fairs. Extract the data into a strict JSON array of objects with: `title`, `organizer`, `location`, `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD).\n\n" +
      "Additional Extraction Rules:\n" +
      "1. Format each event with these exact keys: `title`, `organizer`, `location`, `start_date`, `end_date`, `registration_url`.\n" +
      "2. For dates, parse standard dates into YYYY-MM-DD. If an exact day is not mentioned but a month/year is, use the first/last day of that month. If dates cannot be determined, use null.\n" +
      "3. For `organizer`, use names like 'TRIFED', 'Ministry of Rural Development', 'Ministry of Textiles', 'DC Handicrafts', or the relevant government/cultural entity mentioned.\n" +
      "4. For `registration_url`, you MUST extract the exact deep link for 'artisan stall booking', 'vendor registration', or 'exhibitor application'. Do NOT return the general homepage if a booking page exists. If no direct booking link is found, return a Google Search URL formatted as: `https://www.google.com/search?q=[Event+Name]+artisan+stall+booking+registration`.\n" +
      "5. Exclude duplicate entries or non-event articles. Return ONLY a valid JSON array of objects.";

    const geminiPayload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${geminiSystemPrompt}\n\nSearch Snippets to analyze:\n${JSON.stringify(allSnippets, null, 2)}\n\nStrict JSON array:`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    };

    const geminiRawResponse = await callGemini(geminiPayload, GEMINI_API_KEY);
    const candidateText =
      geminiRawResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      throw new Error("Gemini returned empty or invalid content response.");
    }

    console.log(`[Gemini] Raw extraction received (${candidateText.length} characters). Parsing JSON...`);
    const parsedRaw = parseStrictJson(candidateText);
    const eventList: ParsedEvent[] = Array.isArray(parsedRaw)
      ? parsedRaw
      : parsedRaw.events || [parsedRaw];

    console.log(`[Gemini] Successfully parsed ${eventList.length} candidate events.`);

    // ── 4. Step 3: Database Upsert (Supabase JS Client) ───────────────────────
    console.log(`\n[Step 3] Initializing Supabase client with service role key...`);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const sanitizedEvents = eventList
      .filter((evt) => evt && typeof evt.title === "string" && evt.title.trim().length > 0)
      .map((evt) => {
        const titleStr = evt.title.trim();
        let regUrl = evt.registration_url?.trim() || null;
        if (!regUrl) {
          const encodedTitle = encodeURIComponent(titleStr).replace(/%20/g, "+");
          regUrl = `https://www.google.com/search?q=${encodedTitle}+artisan+stall+booking+registration`;
        }
        return {
          title: titleStr,
          organizer: evt.organizer?.trim() || "Ministry of Rural Development / TRIFED",
          location: evt.location?.trim() || "India",
          start_date: sanitizeDate(evt.start_date),
          end_date: sanitizeDate(evt.end_date),
          registration_url: regUrl,
          is_active: true,
          updated_at: new Date().toISOString(),
        };
      });

    console.log(`[Database] Preparing to upsert ${sanitizedEvents.length} sanitized events into 'artisan_events':`);
    sanitizedEvents.forEach((e, i) => {
      console.log(`  ${i + 1}. [${e.title}] | Org: ${e.organizer} | Loc: ${e.location} | Dates: ${e.start_date || 'TBD'} to ${e.end_date || 'TBD'}`);
    });

    let upsertedCount = 0;
    const finalStoredRecords: any[] = [];
    const errorsEncountered: string[] = [];

    // Attempt upsert with conflict key 'title,start_date'
    const { data: bulkData, error: bulkError } = await supabase
      .from("artisan_events")
      .upsert(sanitizedEvents, {
        onConflict: "title,start_date",
        ignoreDuplicates: false,
      })
      .select();

    if (!bulkError && bulkData) {
      upsertedCount = bulkData.length;
      finalStoredRecords.push(...bulkData);
      console.log(`[Database] Bulk upsert succeeded! Stored ${upsertedCount} events.`);
    } else {
      console.warn(`[Database] Bulk upsert had notice/error (${bulkError?.message}). Falling back to per-row upsert...`);
      // Resilient fallback for individual records
      for (const eventItem of sanitizedEvents) {
        try {
          const { data: rowData, error: rowErr } = await supabase
            .from("artisan_events")
            .upsert(eventItem, { onConflict: "title,start_date" })
            .select();

          if (!rowErr && rowData && rowData.length > 0) {
            upsertedCount++;
            finalStoredRecords.push(rowData[0]);
          } else if (rowErr) {
            // If unique constraint is not on title,start_date, attempt normal insert
            const { data: insData, error: insErr } = await supabase
              .from("artisan_events")
              .insert(eventItem)
              .select();

            if (!insErr && insData && insData.length > 0) {
              upsertedCount++;
              finalStoredRecords.push(insData[0]);
            } else {
              errorsEncountered.push(insErr?.message || rowErr.message);
            }
          }
        } catch (perRowErr: any) {
          errorsEncountered.push(perRowErr?.message || String(perRowErr));
        }
      }
    }

    console.log(`======================================================`);
    console.log(`[Event Scraper Agent] Complete! Upserted: ${upsertedCount} / ${sanitizedEvents.length}`);
    console.log(`======================================================\n`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully scraped, extracted, and stored ${upsertedCount} artisan events.`,
        summary: {
          queries_searched: targetQueries.length,
          search_snippets_found: allSnippets.length,
          events_extracted_by_gemini: sanitizedEvents.length,
          events_stored_in_db: upsertedCount,
        },
        events: finalStoredRecords.length > 0 ? finalStoredRecords : sanitizedEvents,
        warnings: errorsEncountered.length > 0 ? errorsEncountered : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error(`[Event Scraper Agent] Fatal error:`, err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "InternalServerError",
        message: err?.message || String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
