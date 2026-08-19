import { Env } from './types';
import { handleCors } from './middleware/cors';
import { routeRequest } from './router';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { headers: corsHeaders, isPreflight } = handleCors(request);

    // 1. Handle CORS Preflight
    if (isPreflight) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // 2. Route Application Request
    const response = await routeRequest(request, env);

    // 3. Attach CORS Headers to Response
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
