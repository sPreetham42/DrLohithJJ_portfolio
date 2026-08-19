import { handleCors } from './middleware/cors.js';
import { routeRequest } from './router.js';

export default {
  async fetch(request, env, ctx) {
    const { headers: corsHeaders, isPreflight } = handleCors(request);

    if (isPreflight) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    const response = await routeRequest(request, env);

    const finalHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      finalHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders
    });
  }
};
