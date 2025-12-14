/**
 * Billing + quota service (Shopify Billing API; no Stripe).
 *
 * This first milestone focuses on:
 * - blocking design generation when quota exceeded
 * - a simple plan record in DB to support UI + later full Billing API flows
 *
 * Later phases can wire Shopify managed pricing by creating subscriptions/charges.
 */

import prisma from "../../db.server.js";
import { countDesignsThisMonth } from "../design/design.service.js";

export const PLANS = {
  starter: { name: "Starter", quota: 30 },
  pro: { name: "Pro", quota: 300 },
  unlimited: { name: "Unlimited", quota: Number.POSITIVE_INFINITY },
};

/**
 * Get (or create) the shop plan record.
 * Defaults to starter/inactive until Billing API flow is implemented.
 * @param {string} shop
 */
export async function getOrCreateShopPlan(shop) {
  const existing = await prisma.shopPlan.findUnique({ where: { shop } });
  if (existing) return existing;

  return await prisma.shopPlan.create({
    data: {
      shop,
      plan: "starter",
      status: "inactive",
    },
  });
}

/**
 * Resolve the effective plan name for quota calculations.
 * For milestone 1, we allow generation even if billing status is inactive,
 * but enforce quotas based on selected plan.
 * @param {string} shop
 */
export async function getEffectivePlan(shop) {
  const record = await getOrCreateShopPlan(shop);
  const planKey = record.plan?.toLowerCase() || "starter";
  return PLANS[planKey] ? planKey : "starter";
}

/**
 * Throws if the shop is out of quota.
 * @param {string} shop
 */
export async function requireWithinQuota(shop) {
  const planKey = await getEffectivePlan(shop);
  const plan = PLANS[planKey];
  const used = await countDesignsThisMonth(shop);

  if (Number.isFinite(plan.quota) && used >= plan.quota) {
    const name = plan.name;
    const limit = plan.quota;
    const err = new Error(
      `Design quota exceeded for ${name} plan (${used}/${limit} this month).`,
    );
    err.code = "QUOTA_EXCEEDED";
    err.meta = { used, limit, plan: planKey };
    throw err;
  }

  return { used, limit: plan.quota, plan: planKey };
}

