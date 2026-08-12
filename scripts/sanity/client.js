// ================================================================
// SANITY PUBLIC CDN CLIENT (Tokenless, Read-Only HTTP Client)
// Performs anonymous GET queries against Sanity's global CDN API.
// ================================================================

// MANUAL CONFIGURATION REQUIRED: Replace with your actual Sanity Project ID
export const SANITY_CONFIG = {
  projectId: '12ok6v8i',
  dataset: 'production',
  apiVersion: '2023-01-01',
  useCdn: true,
};

/**
 * Executes a GROQ query against Sanity's public read API endpoint.
 * @param {string} query GROQ query string
 * @param {object} params Optional query variables
 * @returns {Promise<any>} Response result data
 */
export async function sanityFetch(query, params = {}) {
  // If Project ID is not configured yet, throw error to trigger graceful baseline fallbacks
  if (!SANITY_CONFIG.projectId || SANITY_CONFIG.projectId === 'YOUR_SANITY_PROJECT_ID') {
    throw new Error('Sanity Project ID is not configured. Using static fallbacks.');
  }

  const encodedQuery = encodeURIComponent(query);
  const baseUrl = `https://${SANITY_CONFIG.projectId}.apicdn.sanity.io/v${SANITY_CONFIG.apiVersion}/data/query/${SANITY_CONFIG.dataset}`;
  
  // Format params as GROQ query string params if present
  let url = `${baseUrl}?query=${encodedQuery}`;
  Object.keys(params).forEach(key => {
    url += `&$${key}=${encodeURIComponent(JSON.stringify(params[key]))}`;
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sanity API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  return json.result;
}
