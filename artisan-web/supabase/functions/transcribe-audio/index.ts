import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      console.warn("GROQ_API_KEY not configured in Supabase secrets");
      return new Response(JSON.stringify({ text: "", warning: "GROQ_API_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";
    let audioBlob: Blob | null = null;
    let language = "hi";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      language = (formData.get("language") as string) || "hi";
      if (file && file instanceof Blob) {
        audioBlob = file;
      }
    } else {
      const body = await req.json();
      language = body.language || "hi";
      if (body.audioBase64) {
        const clean = body.audioBase64.replace(/^data:audio\/[a-zA-Z0-9+.-]+;base64,/, "");
        const binary = atob(clean);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        audioBlob = new Blob([bytes.buffer], { type: body.mimeType || "audio/webm" });
      }
    }

    if (!audioBlob || audioBlob.size < 100) {
      return new Response(JSON.stringify({ text: "", warning: "Audio too short" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqForm = new FormData();
    const ext = audioBlob.type?.includes("mp4") ? "m4a" : "webm";
    groqForm.append("file", audioBlob, `audio.${ext}`);
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", language === "en" ? "en" : "hi");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqApiKey}` },
      body: groqForm,
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.warn(`Groq Whisper returned ${groqRes.status}:`, err);
      return new Response(JSON.stringify({ text: "", error: `Groq error: ${groqRes.status}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await groqRes.json();
    return new Response(JSON.stringify({ text: (data.text || "").trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.warn("transcribe-audio error:", err?.message || err);
    return new Response(JSON.stringify({ text: "", error: err?.message || "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
