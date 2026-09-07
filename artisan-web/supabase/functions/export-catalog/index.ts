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
// CORS Headers
// ─────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// ─────────────────────────────────────────────────────────────────
// MOCK CATALOG — used when the DB is empty or unreachable
// ─────────────────────────────────────────────────────────────────
const MOCK_PRODUCTS = [
  {
    id: "MOCK-001",
    title: "Handcrafted Terracotta Decorative Pot",
    title_hi: "हस्तनिर्मित टेराकोटा सजावटी बर्तन",
    description:
      "Exquisitely hand-thrown and kiln-fired natural clay pot featuring traditional folk motifs. Made with locally sourced eco-friendly alluvial clay.",
    suggested_retail_price_inr: 450,
    suggested_wholesale_price_inr: 280,
    estimated_price_inr: 450,
    bulk_price_inr: 280,
    gem_category: "Handicrafts - Terracotta Pottery and Planters",
    craft_category: "Terracotta & Pottery",
    craft_origin: "Rural Artisan Cluster, Khurja, Uttar Pradesh",
    unspsc_code: "60121002",
    hsn_code: "69120010",
    moq: 50,
    image_url: "",
    tags: ["Terracotta", "Eco-friendly", "Handmade", "Home Decor", "GeM Certified"],
  },
  {
    id: "MOCK-002",
    title: "Banarasi Handwoven Silk Saree",
    title_hi: "बनारसी हस्तनिर्मित रेशम साड़ी",
    description:
      "Meticulously handwoven on traditional wooden pit looms by master rural weavers. Features authentic Banarasi zari borders and natural plant-based dyes.",
    suggested_retail_price_inr: 3200,
    suggested_wholesale_price_inr: 2200,
    estimated_price_inr: 3200,
    bulk_price_inr: 2200,
    gem_category: "Handloom / Silk Sarees",
    craft_category: "Textiles & Sarees",
    craft_origin: "Rural Artisan Cluster, Varanasi, Uttar Pradesh",
    unspsc_code: "53102502",
    hsn_code: "54077200",
    moq: 20,
    image_url: "",
    tags: ["Handloom", "Banarasi Silk", "Heritage Craft", "GeM Certified", "Fair Trade"],
  },
];

// ─────────────────────────────────────────────────────────────────
// CSV Helpers
// ─────────────────────────────────────────────────────────────────

/** Escape a single CSV field value (handles commas, quotes, newlines) */
function csvEscape(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  // If field contains comma, double-quote, or newline — wrap in quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Build a CSV string from headers array and rows array-of-objects */
function buildCsv(headers: string[], rows: Record<string, any>[]): string {
  const headerLine = headers.map(csvEscape).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => csvEscape(row[h])).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

// ─────────────────────────────────────────────────────────────────
// ONDC Beckn Protocol transformer
// ─────────────────────────────────────────────────────────────────
function toOndcCatalog(products: any[]): object {
  return {
    context: {
      domain: "nic2004:52110",
      country: "IND",
      city: "std:080",
      action: "on_search",
      core_version: "1.2.0",
      bpp_id: "artisan-network-provider.org",
      bpp_uri: "https://artisan-network-provider.org/beckn",
      transaction_id: crypto.randomUUID(),
      message_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    },
    message: {
      catalog: {
        "bpp/descriptor": {
          name: "Marginalized Rural Artisan Cluster Network",
          short_desc: "Connecting rural Indian artisans to D2C (ONDC) & institutional (GeM) markets.",
          images: [],
        },
        "bpp/providers": [
          {
            id: "PROVIDER_CLUSTER_01",
            descriptor: {
              name: "Gramin Shilpkar Sahakari Samiti",
              short_desc: "Rural Artisan Cooperative Society — certified fair trade & GeM registered",
            },
            items: products.map((p: any, idx: number) => ({
              id: String(p.id || `ITEM-${idx + 1}`),
              descriptor: {
                name: p.title || "Handcrafted Artisan Product",
                short_desc: (p.description || "").substring(0, 140),
                images: p.image_url ? [p.image_url] : [],
              },
              price: {
                currency: "INR",
                value: String(p.suggested_retail_price_inr || p.estimated_price_inr || p.price || 0),
                maximum_value: String(p.suggested_retail_price_inr || p.price || 0),
                minimum_value: String(p.suggested_wholesale_price_inr || p.bulk_price_inr || 0),
              },
              category_id: p.craft_category || "Handicrafts",
              tags: [
                { code: "hsn_code", list: [{ code: "value", value: p.hsn_code || "69120010" }] },
                { code: "b2b_moq", list: [{ code: "value", value: String(p.moq || p.min_order_quantity || 50) }] },
                { code: "bulk_price_inr", list: [{ code: "value", value: String(p.suggested_wholesale_price_inr || p.bulk_price_inr || 0) }] },
                { code: "gem_ready", list: [{ code: "value", value: "true" }] },
              ],
              fulfillment_id: "SHIP_01",
            })),
          },
        ],
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// GeM JSON Catalog transformer
// ─────────────────────────────────────────────────────────────────
function toGemCatalog(products: any[]): object {
  return {
    export_timestamp: new Date().toISOString(),
    platform: "Government e-Marketplace (GeM)",
    exporter: "Artisan Catalogue Hub — SIH 2025",
    schema_version: "2.0",
    total_items: products.length,
    items: products.map((p: any, idx: number) => ({
      gem_item_id: String(p.id || `GEM-ITEM-${idx + 1}`),
      product_name: p.title || "Handcrafted Artisan Product",
      product_name_hi: p.title_hi || "",
      category: p.gem_category || "Handicrafts - Traditional Art & Decor",
      sub_category: p.craft_category || "Handmade Goods",
      short_description: (p.description || "").substring(0, 200),
      hsn_code: p.hsn_code || "69120010",
      unspsc_code: p.unspsc_code || "60121002",
      unit_price_inr: p.suggested_retail_price_inr || p.estimated_price_inr || p.price || 0,
      bulk_price_inr: p.suggested_wholesale_price_inr || p.bulk_price_inr || p.bulk_price || 0,
      minimum_order_quantity: p.moq || p.min_order_quantity || 50,
      country_of_origin: "India",
      is_msme: true,
      is_startup: false,
      make_in_india: true,
      gem_status: "ACTIVE",
      tags: Array.isArray(p.tags) ? p.tags : [],
      pricing_reasoning: p.pricing_reasoning || "",
    })),
  };
}

// ─────────────────────────────────────────────────────────────────
// GeM CSV / Excel transformer
// ─────────────────────────────────────────────────────────────────
const GEM_CSV_HEADERS = [
  "Product ID",
  "Product Title",
  "GeM Category",
  "HSN Code",
  "UNSPSC Code",
  "Unit Price INR",
  "Bulk Price INR",
  "Min Bulk Order Qty (MOQ)",
  "Make In India Status",
  "MSE Vendor Benefit",
  "Craft Origin",
  "Image Link",
];

function toGemCsv(products: any[]): string {
  const rows = products.map((p: any, idx: number) => ({
    "Product ID": String(p.id || `GEM-ITEM-${idx + 1}`),
    "Product Title": p.title || "Handcrafted Artisan Product",
    "GeM Category": p.gem_category || "Handicrafts - Traditional Art & Decor",
    "HSN Code": p.hsn_code || "69120010",
    "UNSPSC Code": p.unspsc_code || "60121002",
    "Unit Price INR": p.suggested_retail_price_inr || p.estimated_price_inr || p.price || 0,
    "Bulk Price INR": p.suggested_wholesale_price_inr || p.bulk_price_inr || p.bulk_price || 0,
    "Min Bulk Order Qty (MOQ)": p.moq || p.min_order_quantity || 50,
    "Make In India Status": "Class 1 Local Supplier - 100% Indigenous",
    "MSE Vendor Benefit": "Applicable under Public Procurement Policy for MSEs",
    "Craft Origin": p.craft_origin || "Rural Artisan Cluster, India",
    "Image Link": p.image_url || "",
  }));

  return buildCsv(GEM_CSV_HEADERS, rows);
}

// ─────────────────────────────────────────────────────────────────
// Shared: load products from Supabase (or fall back to mock)
// ─────────────────────────────────────────────────────────────────
async function loadProducts(): Promise<any[]> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.warn("[export-catalog] Supabase query error:", error.message);
      } else if (data && data.length > 0) {
        console.log(`[export-catalog] Loaded ${data.length} products from DB.`);
        return data;
      } else {
        console.log("[export-catalog] No products found. Using mock catalog.");
      }
    } catch (dbErr: any) {
      console.warn("[export-catalog] DB connection failed:", dbErr?.message || dbErr);
    }
  } else {
    console.warn("[export-catalog] Supabase env vars not set. Using mock catalog.");
  }

  return MOCK_PRODUCTS;
}

// ─────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawFormat = (url.searchParams.get("format") || "ondc").toLowerCase();
    const format = rawFormat === "csv" ? "gem_csv" : rawFormat;

    const validFormats = ["ondc", "gem", "gem_csv"];
    if (!validFormats.includes(format)) {
      return new Response(
        JSON.stringify({ error: "Invalid format. Use ?format=ondc, ?format=gem, or ?format=csv" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Load products from DB (or mock fallback)
    const products = await loadProducts();

    // ── gem_csv: Return CSV for GeM vendor portal upload ────────
    if (format === "gem_csv") {
      const csv = toGemCsv(products);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="gem-procurement-batch.csv"',
          "X-Total-Items": String(products.length),
        },
        status: 200,
      });
    }

    // ── ondc / gem: Return JSON ──────────────────────────────────
    const catalog = format === "gem" ? toGemCatalog(products) : toOndcCatalog(products);

    return new Response(JSON.stringify(catalog, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Catalog-Format": format.toUpperCase(),
        "X-Total-Items": String(products.length),
      },
      status: 200,
    });
  } catch (error: any) {
    console.error("[export-catalog Fatal Error]", error?.message || error);
    return new Response(
      JSON.stringify({ error: "Catalog export failed. Please try again." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
