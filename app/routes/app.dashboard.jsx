/**
 * Dashboard page: quick overview and entry points.
 */

import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function Dashboard() {
  return (
    <s-page heading="B2B AI Design Generator">
      <s-section heading="Get started">
        <s-paragraph>
          Generate AI-powered print designs and add them to products.
        </s-paragraph>
        <s-stack direction="inline" gap="base">
          <s-link href="/app/create-design">
            <s-button>Create a design</s-button>
          </s-link>
          <s-link href="/app/products">
            <s-button variant="secondary">View products</s-button>
          </s-link>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Tips">
        <s-unordered-list>
          <s-list-item>Use concise prompts for cleaner designs.</s-list-item>
          <s-list-item>Try typography for logos and slogans.</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);

