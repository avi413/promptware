/**
 * Design persistence + quota helpers.
 *
 * This is intentionally small and focused:
 * - Create a Design record for a shop
 * - Count designs generated in the current month for quota enforcement
 */

import prisma from "../../db.server.js";

/**
 * Create a persisted Design record.
 * @param {{shop: string, prompt: string, style?: string, colors?: string[], imageUrl: string, provider?: string}} input
 */
export async function createDesign({
  shop,
  prompt,
  style,
  colors,
  imageUrl,
  provider,
}) {
  return await prisma.design.create({
    data: {
      shop,
      prompt,
      style: style || null,
      colorsJson: colors?.length ? JSON.stringify(colors) : null,
      imageUrl,
      provider: provider || null,
    },
  });
}

/**
 * Count how many designs this shop has created in the current UTC month.
 * @param {string} shop
 */
export async function countDesignsThisMonth(shop) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return await prisma.design.count({
    where: {
      shop,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });
}

