/**
 * POST /api/design/generate
 *
 * Validates Shopify session, enforces quota, calls AI service,
 * stores the generated design metadata in DB, and returns the image URL.
 */

import { authenticate } from "../shopify.server.js";
import { generateDesign } from "../backend/ai/ai.service.js";
import { createDesign } from "../backend/design/design.service.js";
import { requireWithinQuota } from "../backend/billing/billing.service.js";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = body?.prompt;
  const style = body?.style;
  const colors = body?.colors;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return Response.json({ error: "Prompt is required." }, { status: 400 });
  }

  if (colors && !Array.isArray(colors)) {
    return Response.json({ error: "Colors must be an array." }, { status: 400 });
  }

  try {
    const quota = await requireWithinQuota(session.shop);
    const generated = await generateDesign({
      prompt: prompt.trim(),
      style: typeof style === "string" ? style : undefined,
      colors: Array.isArray(colors) ? colors : undefined,
    });

    const design = await createDesign({
      shop: session.shop,
      prompt: prompt.trim(),
      style: typeof style === "string" ? style : undefined,
      colors: Array.isArray(colors) ? colors : undefined,
      imageUrl: generated.url,
      provider: generated.provider,
    });

    return Response.json({
      design: {
        id: design.id,
        imageUrl: design.imageUrl,
        prompt: design.prompt,
        style: design.style,
        createdAt: design.createdAt,
      },
      quota,
    });
  } catch (err) {
    const message = err?.message || "Unknown error";
    if (err?.code === "QUOTA_EXCEEDED") {
      return Response.json(
        { error: message, code: err.code, meta: err.meta },
        { status: 402 },
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
};

