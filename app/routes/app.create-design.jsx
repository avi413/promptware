/**
 * Create Design page (Milestone 1):
 * - Prompt + style + colors
 * - Generate AI image (POST /api/design/generate)
 * - Preview
 * - Add to Product (modal-like section with new/existing product modes)
 */

import { useEffect, useMemo, useState } from "react";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

const STYLE_OPTIONS = [
  { label: "Minimal", value: "minimal" },
  { label: "Cartoon", value: "cartoon" },
  { label: "Typography", value: "typography" },
  { label: "Vintage", value: "vintage" },
  { label: "Abstract", value: "abstract" },
];

export default function CreateDesign() {
  const shopify = useAppBridge();

  const generateFetcher = useFetcher();
  const addToProductFetcher = useFetcher();

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("minimal");
  const [colors, setColors] = useState(["#000000"]);

  const [designId, setDesignId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const [productMode, setProductMode] = useState("new"); // new | existing
  const [newProductTitle, setNewProductTitle] = useState("AI Design Product");
  const [existingProductId, setExistingProductId] = useState("");

  const isGenerating =
    ["loading", "submitting"].includes(generateFetcher.state) &&
    generateFetcher.formMethod === "POST";

  const isAdding =
    ["loading", "submitting"].includes(addToProductFetcher.state) &&
    addToProductFetcher.formMethod === "POST";

  const generateError = generateFetcher.data?.error;
  const addError = addToProductFetcher.data?.error;

  useEffect(() => {
    const d = generateFetcher.data?.design;
    if (d?.id && d?.imageUrl) {
      setDesignId(d.id);
      setImageUrl(d.imageUrl);
      shopify.toast.show("Design generated");
    }
  }, [generateFetcher.data?.design, shopify]);

  useEffect(() => {
    if (addToProductFetcher.data?.ok && addToProductFetcher.data?.productId) {
      shopify.toast.show("Design added to product");
      // Offer quick navigation to the product editor.
      shopify.intents.invoke?.("edit:shopify/Product", {
        value: addToProductFetcher.data.productId,
      });
    }
  }, [addToProductFetcher.data, shopify]);

  const canGenerate = useMemo(() => prompt.trim().length >= 3, [prompt]);
  const canAddToProduct = Boolean(designId && imageUrl);

  const submitGenerate = () => {
    generateFetcher.submit(
      JSON.stringify({ prompt, style, colors }),
      {
        method: "POST",
        action: "/api/design/generate",
        encType: "application/json",
      },
    );
  };

  const submitAddToProduct = () => {
    const payload =
      productMode === "new"
        ? { designId, mode: "new", title: newProductTitle }
        : { designId, mode: "existing", productId: existingProductId };

    addToProductFetcher.submit(JSON.stringify(payload), {
      method: "POST",
      action: "/api/products/add-design",
      encType: "application/json",
    });
  };

  return (
    <s-page heading="Create Design">
      <s-section heading="Design inputs">
        <s-stack direction="block" gap="base">
          <s-text-field
            label="Design prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Minimal line-art coffee cup with steam"
          />

          <s-select
            label="Style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            {STYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </s-select>

          <s-stack direction="inline" gap="base" align="center">
            <s-text>Primary color</s-text>
            {/* Simple color picker (works inside the embedded iframe). */}
            <input
              type="color"
              value={colors[0]}
              onChange={(e) => setColors([e.target.value])}
              aria-label="Primary color"
              style={{ width: 44, height: 32, border: "none", padding: 0 }}
            />
            <s-text variant="subdued">{colors[0]}</s-text>
          </s-stack>

          <s-stack direction="inline" gap="base">
            <s-button
              onClick={submitGenerate}
              {...(isGenerating ? { loading: true } : {})}
              {...(!canGenerate ? { disabled: true } : {})}
            >
              Generate Design
            </s-button>
          </s-stack>

          {generateError && (
            <s-banner tone="critical">
              <s-paragraph>{generateError}</s-paragraph>
            </s-banner>
          )}
        </s-stack>
      </s-section>

      <s-section heading="Preview">
        {!imageUrl ? (
          <s-paragraph variant="subdued">
            Generate a design to see a preview here.
          </s-paragraph>
        ) : (
          <s-stack direction="block" gap="base">
            <s-box
              padding="base"
              borderWidth="base"
              borderRadius="base"
              background="subdued"
            >
              <img
                src={imageUrl}
                alt="Generated design preview"
                style={{
                  width: "100%",
                  maxWidth: 512,
                  height: "auto",
                  display: "block",
                }}
              />
            </s-box>
            <s-text variant="subdued">
              Design ID: <code>{designId}</code>
            </s-text>
          </s-stack>
        )}
      </s-section>

      <s-section heading="Add to Product">
        <s-stack direction="block" gap="base">
          <s-segmented-control>
            <button
              type="button"
              data-pressed={productMode === "new"}
              onClick={() => setProductMode("new")}
            >
              New product
            </button>
            <button
              type="button"
              data-pressed={productMode === "existing"}
              onClick={() => setProductMode("existing")}
            >
              Existing product
            </button>
          </s-segmented-control>

          {productMode === "new" ? (
            <s-text-field
              label="Product title"
              value={newProductTitle}
              onChange={(e) => setNewProductTitle(e.target.value)}
            />
          ) : (
            <s-text-field
              label="Existing product ID"
              helpText="Paste a Shopify Admin GraphQL product ID (e.g. gid://shopify/Product/123). Product picker can be added next."
              value={existingProductId}
              onChange={(e) => setExistingProductId(e.target.value)}
            />
          )}

          <s-button
            onClick={submitAddToProduct}
            {...(isAdding ? { loading: true } : {})}
            {...(!canAddToProduct ? { disabled: true } : {})}
          >
            Add to Product
          </s-button>

          {addError && (
            <s-banner tone="critical">
              <s-paragraph>{addError}</s-paragraph>
            </s-banner>
          )}
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => boundary.headers(headersArgs);

