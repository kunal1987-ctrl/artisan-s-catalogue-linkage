import * as fal from "@fal-ai/serverless-client";

// Ensure your FAL_KEY / VITE_FAL_API_KEY is configured
const falApiKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_FAL_API_KEY;
if (falApiKey) {
  fal.config({
    credentials: falApiKey,
    suppressLocalCredentialsWarning: true,
  });
} else {
  fal.config({
    proxyUrl: "/api/fal/proxy", // Secure route if making calls from the client
  });
}

export const generateLifestyleBackground = async (originalImageBase64, prompt) => {
  try {
    const rawBase64 = (originalImageBase64 || '').replace(/^data:image\/[a-z]+;base64,/, '');
    const imageUrl = `data:image/jpeg;base64,${rawBase64}`;

    // Standard Fal.ai image-to-image / background replacement model
    const result = await fal.subscribe("fal-ai/bria/background/replace", {
      input: {
        image_url: imageUrl,
        prompt: prompt || "professional product photography, well-lit, minimal studio background",
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log("Fal.ai processing:", update.status);
      },
    }).catch(async (primaryErr) => {
      console.warn("Bria background replacement fallback to image-to-image:", primaryErr);
      return await fal.subscribe("fal-ai/image-to-image", {
        input: {
          image_url: imageUrl,
          prompt: prompt || "professional product photography, well-lit, minimal studio background",
          strength: 0.85,
        },
        logs: true,
      });
    });

    const outputUrl =
      result?.image?.url ||
      result?.data?.image?.url ||
      result?.data?.image_url ||
      result?.data?.url ||
      (typeof result?.image === 'string' ? result.image : null);

    if (!outputUrl) {
      throw new Error("Fal.ai returned no valid image URL");
    }

    return outputUrl; // Returns the clean, watermark-free image
  } catch (error) {
    console.error("Fal.ai Generation Error:", error);
    throw new Error("Failed to generate lifestyle background");
  }
};

export default {
  generateLifestyleBackground,
};
