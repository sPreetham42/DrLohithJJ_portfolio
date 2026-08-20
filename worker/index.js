import { handleCors } from './middleware/cors.js';
import { routeRequest } from './router.js';

const BASELINE_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN'
};

export default {
  async fetch(request, env, ctx) {
    const { headers: corsHeaders, isPreflight } = handleCors(request);

    if (isPreflight) {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          ...BASELINE_SECURITY_HEADERS
        }
      });
    }

    const response = await routeRequest(request, env);

    const finalHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      finalHeaders.set(key, value);
    }
    for (const [key, value] of Object.entries(BASELINE_SECURITY_HEADERS)) {
      if (!finalHeaders.has(key)) {
        finalHeaders.set(key, value);
      }
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders
    });
  }
};
