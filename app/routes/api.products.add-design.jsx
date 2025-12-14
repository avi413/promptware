/**
 * POST /api/products/add-design
 *
 * Body:
 * - designId: string
 * - mode: "new" | "existing"
 * - title?: string (for new)
 * - productId?: string (for existing)
 *
 * Creates a new product or attaches the design image to an existing product,
 * then stores the designId <-> productId mapping.
 */

import { json } from "react-router";
import { authenticate } from "../shopify.server.js";
import prisma from "../db.server.js";
import {
  attachDesignToExistingProduct,
  createProductFromDesign,
} from "../backend/products/product.service.js";

export const action = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { admin, session } = await authenticate.admin(request);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const designId = body?.designId;
  const mode = body?.mode;

  if (!designId || typeof designId !== "string") {
    return json({ error: "designId is required." }, { status: 400 });
  }

  if (mode !== "new" && mode !== "existing") {
    return json({ error: "mode must be 'new' or 'existing'." }, { status: 400 });
  }

  const design = await prisma.design.findFirst({
    where: { id: designId, shop: session.shop },
  });
  if (!design) {
    return json({ error: "Design not found." }, { status: 404 });
  }

  try {
    if (mode === "new") {
      const title = typeof body?.title === "string" ? body.title : "AI Design Product";
      const created = await createProductFromDesign({
        admin,
        shop: session.shop,
        title,
        designId,
        imageUrl: design.imageUrl,
      });
      return json({ ok: true, mode, ...created });
    }

    const productId = body?.productId;
    if (!productId || typeof productId !== "string") {
      return json({ error: "productId is required for mode=existing." }, { status: 400 });
    }

    const attached = await attachDesignToExistingProduct({
      admin,
      shop: session.shop,
      productId,
      designId,
      imageUrl: design.imageUrl,
    });
    return json({ ok: true, mode, ...attached });
  } catch (err) {
    return json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
};

