/**
 * Shopify products service (Admin GraphQL API).
 *
 * - Create product with the generated design image
 * - Attach the image to an existing product as media
 * - Persist productId <-> designId mapping
 */

import prisma from "../../db.server.js";

/**
 * Attach a design to an existing product as media.
 * Uses `productCreateMedia`.
 */
export async function attachDesignToExistingProduct({
  admin,
  shop,
  productId,
  designId,
  imageUrl,
}) {
  const mediaResponse = await admin.graphql(
    `#graphql
    mutation attachDesignMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media {
          ... on MediaImage {
            id
            image {
              url
            }
          }
        }
        mediaUserErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        productId,
        media: [
          {
            originalSource: imageUrl,
            mediaContentType: "IMAGE",
            alt: "AI generated design",
          },
        ],
      },
    },
  );

  const json = await mediaResponse.json();
  const errs = json?.data?.productCreateMedia?.mediaUserErrors;
  if (errs?.length) {
    const err = new Error(errs.map((e) => e.message).join("; "));
    err.code = "SHOPIFY_MEDIA_ERROR";
    throw err;
  }

  await prisma.productDesign.create({
    data: { shop, designId, productId },
  });

  return { productId, media: json?.data?.productCreateMedia?.media || [] };
}

/**
 * Create a new product with the design image attached as media.
 */
export async function createProductFromDesign({
  admin,
  shop,
  title,
  designId,
  imageUrl,
}) {
  const response = await admin.graphql(
    `#graphql
    mutation createProductWithMedia($product: ProductCreateInput!) {
      productCreate(product: $product) {
        product {
          id
          title
          handle
          status
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        product: {
          title: title || "AI Design Product",
          media: [
            {
              originalSource: imageUrl,
              mediaContentType: "IMAGE",
              alt: "AI generated design",
            },
          ],
        },
      },
    },
  );

  const json = await response.json();
  const errs = json?.data?.productCreate?.userErrors;
  if (errs?.length) {
    const err = new Error(errs.map((e) => e.message).join("; "));
    err.code = "SHOPIFY_PRODUCT_ERROR";
    throw err;
  }

  const product = json?.data?.productCreate?.product;
  if (!product?.id) {
    throw new Error("Product creation failed: missing product id.");
  }

  await prisma.productDesign.create({
    data: { shop, designId, productId: product.id },
  });

  return { productId: product.id, product };
}

