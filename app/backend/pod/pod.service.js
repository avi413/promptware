/**
 * POD (Print-on-Demand) service abstraction.
 *
 * Not mandatory for the first milestone — implemented as stubs with clear
 * extension points for Printful / Printify later.
 */

/**
 * Create (or update) a POD product from a Shopify product + design.
 * @returns {Promise<{status: 'not_implemented'}>}
 */
export async function upsertPodProduct() {
  return { status: "not_implemented" };
}

/**
 * Request a mockup render from the POD provider.
 * @returns {Promise<{status: 'not_implemented'}>}
 */
export async function requestMockups() {
  return { status: "not_implemented" };
}

