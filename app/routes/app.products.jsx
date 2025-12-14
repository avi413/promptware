/**
 * Products page:
 * - Displays a basic list of products via Admin GraphQL.
 * - This is a lightweight scaffold for the milestone.
 */

import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query productsList($first: Int!) {
      products(first: $first) {
        nodes {
          id
          title
          status
          handle
          featuredImage {
            url
          }
        }
      }
    }`,
    { variables: { first: 20 } },
  );

  const json = await response.json();
  const products = json?.data?.products?.nodes || [];
  return { products };
};

export default function Products() {
  const { products } = useLoaderData();

  return (
    <s-page heading="Products">
      <s-section heading="Your products">
        {!products?.length ? (
          <s-paragraph variant="subdued">No products found.</s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            {products.map((p) => (
              <s-box
                key={p.id}
                padding="base"
                borderWidth="base"
                borderRadius="base"
              >
                <s-stack direction="inline" gap="base" align="center">
                  {p.featuredImage?.url ? (
                    <img
                      src={p.featuredImage.url}
                      alt=""
                      style={{ width: 48, height: 48, objectFit: "cover" }}
                    />
                  ) : (
                    <s-badge>NO IMAGE</s-badge>
                  )}
                  <s-stack direction="block" gap="none">
                    <s-heading>{p.title}</s-heading>
                    <s-text variant="subdued">{p.status}</s-text>
                    <s-text variant="subdued">
                      <code>{p.id}</code>
                    </s-text>
                  </s-stack>
                </s-stack>
              </s-box>
            ))}
          </s-stack>
        )}
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);

