/**
 * Billing page:
 * - Shows current plan and monthly usage
 * - Scaffold for Shopify Billing API flows (Starter/Pro/Unlimited)
 */

import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server.js";
import { getEffectivePlan, PLANS } from "../backend/billing/billing.service.js";
import { countDesignsThisMonth } from "../backend/design/design.service.js";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  const planKey = await getEffectivePlan(session.shop);
  const plan = PLANS[planKey];
  const used = await countDesignsThisMonth(session.shop);

  return {
    planKey,
    planName: plan.name,
    used,
    limit: plan.quota,
  };
};

export default function Billing() {
  const { planName, planKey, used, limit } = useLoaderData();
  const limitText = Number.isFinite(limit) ? `${limit}` : "Unlimited (fair use)";

  return (
    <s-page heading="Billing">
      <s-section heading="Current plan">
        <s-stack direction="block" gap="base">
          <s-paragraph>
            <strong>{planName}</strong> (<code>{planKey}</code>)
          </s-paragraph>
          <s-paragraph>
            Monthly usage: <strong>{used}</strong> / <strong>{limitText}</strong>
          </s-paragraph>
          <s-banner tone="info">
            <s-paragraph>
              Shopify Billing API subscriptions will be wired next. For now, the
              app enforces plan quotas using the stored plan record.
            </s-paragraph>
          </s-banner>
        </s-stack>
      </s-section>

      <s-section heading="Plans">
        <s-unordered-list>
          <s-list-item>Starter – 30 designs/month</s-list-item>
          <s-list-item>Pro – 300 designs/month</s-list-item>
          <s-list-item>Unlimited – fair use</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);

