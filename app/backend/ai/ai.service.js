/**
 * AI image generation service.
 *
 * Goal: generate a print-ready design image URL from prompt + style + colors.
 * Provider is configurable via env:
 * - AI_PROVIDER=openai (default)
 * - AI_PROVIDER=gemini (stubbed, easy to wire later)
 *
 * Required env for OpenAI:
 * - OPENAI_API_KEY
 * Optional:
 * - OPENAI_IMAGE_MODEL (default: "gpt-image-1")
 */

/* eslint-env node */

const OPENAI_IMAGES_ENDPOINT = "https://api.openai.com/v1/images";

function buildPrompt({ prompt, style, colors }) {
  const styleText = style ? `Style: ${style}.` : "";
  const colorsText =
    Array.isArray(colors) && colors.length
      ? `Preferred colors: ${colors.join(", ")}.`
      : "";
  // Encourage transparent background when the model supports it.
  const transparencyText =
    "Create a single centered design suitable for print. Use a transparent background if possible.";

  return [prompt, styleText, colorsText, transparencyText]
    .filter(Boolean)
    .join("\n");
}

async function generateWithOpenAI({ prompt, style, colors }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY for AI image generation.");
  }

  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const finalPrompt = buildPrompt({ prompt, style, colors });

  // OpenAI Images API has evolved across models; we keep payload conservative.
  // We prefer returning a URL for easy preview and storage.
  const response = await fetch(`${OPENAI_IMAGES_ENDPOINT}/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt: finalPrompt,
      size: "1024x1024",
      // Some models support background options; safe to omit if unsupported.
      // background: "transparent",
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `OpenAI image generation failed (${response.status}): ${text || response.statusText}`,
    );
  }

  const json = await response.json();
  const url = json?.data?.[0]?.url;
  if (!url) {
    throw new Error("OpenAI image generation returned no URL.");
  }

  return { url, provider: "openai", model };
}

async function generateWithGemini() {
  // Stub: leave hook points for wiring Google Gemini Images later.
  // Intentionally throwing to make misconfiguration obvious.
  throw new Error(
    "AI_PROVIDER=gemini is not wired yet. Set AI_PROVIDER=openai and provide OPENAI_API_KEY.",
  );
}

/**
 * Generate an AI design image.
 * @param {{prompt: string, style?: string, colors?: string[]}} input
 * @returns {Promise<{url: string, provider: string, model?: string}>}
 */
export async function generateDesign({ prompt, style, colors }) {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt is required.");
  }

  if (provider === "openai") {
    return await generateWithOpenAI({ prompt, style, colors });
  }

  if (provider === "gemini") {
    return await generateWithGemini({ prompt, style, colors });
  }

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}

