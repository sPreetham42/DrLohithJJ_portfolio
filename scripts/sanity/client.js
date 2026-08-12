// ================================================================
// SANITY PUBLIC API CLIENT
// Tokenless, Read-Only HTTP Client
// Reads published content directly from Sanity's production dataset.
// ================================================================

export const SANITY_CONFIG = {
  projectId: '12ok6v8i',
  dataset: 'production',
  apiVersion: '2023-01-01',
};

/**
 * Executes a GROQ query against Sanity's public read API.
 *
 * @param {string} query GROQ query string
 * @param {object} params Optional query variables
 * @returns {Promise<any>} Response result data
 */
export async function sanityFetch(query, params = {}) {
  if (
    !SANITY_CONFIG.projectId ||
    SANITY_CONFIG.projectId === 'YOUR_SANITY_PROJECT_ID'
  ) {
    throw new Error(
      'Sanity Project ID is not configured. Using static fallbacks.'
    );
  }

  const encodedQuery = encodeURIComponent(query);

  // Use Sanity's live API instead of the CDN.
  const baseUrl =
    `https://${SANITY_CONFIG.projectId}.api.sanity.io/v${SANITY_CONFIG.apiVersion}` +
    `/data/query/${SANITY_CONFIG.dataset}`;

  let url = `${baseUrl}?query=${encodedQuery}`;

  Object.keys(params).forEach((key) => {
    url += `&$${key}=${encodeURIComponent(
      JSON.stringify(params[key])
    )}`;
  });

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(
      `Sanity API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  return json.result;
}