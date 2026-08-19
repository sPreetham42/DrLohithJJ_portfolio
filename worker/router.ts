import { Env } from './types';
import { ApiError, NotFoundError } from './errors';
import { authenticateAdmin } from './middleware/auth';
import {
  handleHealth,
  handleGetProfile,
  handleGetScholarStats,
  handleGetPublications,
  handleGetTalks,
  handleGetExperience,
  handleGetEducation,
  handleGetAwards,
  handleGetSkills,
  handleGetSocialLinks,
  jsonResponse
} from './handlers/public.handler';
import {
  handleAdminGetProfile,
  handleAdminUpdateProfile,
  handleAdminGetScholarStats,
  handleAdminUpdateScholarStats,
  handleAdminGetPublications,
  handleAdminGetPublicationById,
  handleAdminCreatePublication,
  handleAdminUpdatePublication,
  handleAdminDeletePublication,
  handleAdminGetTalks,
  handleAdminGetTalkById,
  handleAdminCreateTalk,
  handleAdminUpdateTalk,
  handleAdminDeleteTalk,
  handleAdminGetExperience,
  handleAdminGetExperienceById,
  handleAdminCreateExperience,
  handleAdminUpdateExperience,
  handleAdminDeleteExperience,
  handleAdminGetEducation,
  handleAdminGetEducationById,
  handleAdminCreateEducation,
  handleAdminUpdateEducation,
  handleAdminDeleteEducation,
  handleAdminGetAwards,
  handleAdminGetAwardById,
  handleAdminCreateAward,
  handleAdminUpdateAward,
  handleAdminDeleteAward,
  handleAdminGetSkills,
  handleAdminGetSkillById,
  handleAdminCreateSkill,
  handleAdminUpdateSkill,
  handleAdminDeleteSkill,
  handleAdminGetSocialLinks,
  handleAdminGetSocialLinkById,
  handleAdminCreateSocialLink,
  handleAdminUpdateSocialLink,
  handleAdminDeleteSocialLink,
  handleAdminPresignedUrl
} from './handlers/admin.handler';
import { handleScholarSyncAutomation } from './handlers/automation.handler';
import {
  handleAuthGithubLogin,
  handleAuthGithubCallback,
  handleAuthMe,
  handleAuthLogout
} from './handlers/auth.handler';

export async function routeRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  try {
    // ----------------------------------------------------------------
    // 1. Health Endpoint
    // ----------------------------------------------------------------
    if (path === '/api/v1/health' && method === 'GET') {
      return await handleHealth(request, env);
    }

    // ----------------------------------------------------------------
    // 2. Public Read Endpoints (/api/v1/public/*)
    // ----------------------------------------------------------------
    if (path === '/api/v1/public/profile' && method === 'GET') {
      return await handleGetProfile(request, env);
    }
    if (path === '/api/v1/public/scholar-stats' && method === 'GET') {
      return await handleGetScholarStats(request, env);
    }
    if (path === '/api/v1/public/publications' && method === 'GET') {
      return await handleGetPublications(request, env);
    }
    if (path === '/api/v1/public/talks' && method === 'GET') {
      return await handleGetTalks(request, env);
    }
    if (path === '/api/v1/public/experience' && method === 'GET') {
      return await handleGetExperience(request, env);
    }
    if (path === '/api/v1/public/education' && method === 'GET') {
      return await handleGetEducation(request, env);
    }
    if (path === '/api/v1/public/awards' && method === 'GET') {
      return await handleGetAwards(request, env);
    }
    if (path === '/api/v1/public/skills' && method === 'GET') {
      return await handleGetSkills(request, env);
    }
    if (path === '/api/v1/public/social-links' && method === 'GET') {
      return await handleGetSocialLinks(request, env);
    }

    // ----------------------------------------------------------------
    // 3. Automation Endpoint (/api/v1/automation/*)
    // ----------------------------------------------------------------
    if (path === '/api/v1/automation/scholar' && method === 'POST') {
      return await handleScholarSyncAutomation(request, env);
    }

    // ----------------------------------------------------------------
    // 3.5. Authentication Endpoints (/api/v1/auth/*)
    // ----------------------------------------------------------------
    if (path === '/api/v1/auth/github' && method === 'GET') {
      return await handleAuthGithubLogin(request, env);
    }
    if (path === '/api/v1/auth/callback' && method === 'GET') {
      return await handleAuthGithubCallback(request, env);
    }
    if (path === '/api/v1/auth/me' && method === 'GET') {
      return await handleAuthMe(request, env);
    }
    if (path === '/api/v1/auth/logout' && method === 'POST') {
      return await handleAuthLogout(request, env);
    }

    // ----------------------------------------------------------------
    // 4. Protected Admin Endpoints (/api/v1/admin/*)
    // ----------------------------------------------------------------
    if (path.startsWith('/api/v1/admin/')) {
      const user = await authenticateAdmin(request, env);

      // Profile (Singleton)
      if (path === '/api/v1/admin/profile') {
        if (method === 'GET') return await handleAdminGetProfile(request, env, user);
        if (method === 'PUT') return await handleAdminUpdateProfile(request, env, user);
      }

      // Scholar Stats (Singleton)
      if (path === '/api/v1/admin/scholar-stats') {
        if (method === 'GET') return await handleAdminGetScholarStats(request, env, user);
        if (method === 'PUT') return await handleAdminUpdateScholarStats(request, env, user);
      }

      // Publications
      if (path === '/api/v1/admin/publications') {
        if (method === 'GET') return await handleAdminGetPublications(request, env, user);
        if (method === 'POST') return await handleAdminCreatePublication(request, env, user);
      }
      const pubMatch = path.match(/^\/api\/v1\/admin\/publications\/([^/]+)$/);
      if (pubMatch) {
        const id = decodeURIComponent(pubMatch[1]);
        if (method === 'GET') return await handleAdminGetPublicationById(id, request, env, user);
        if (method === 'PUT') return await handleAdminUpdatePublication(id, request, env, user);
        if (method === 'DELETE') return await handleAdminDeletePublication(id, request, env, user);
      }

      // Talks
      if (path === '/api/v1/admin/talks') {
        if (method === 'GET') return await handleAdminGetTalks(request, env, user);
        if (method === 'POST') return await handleAdminCreateTalk(request, env, user);
      }
      const talkMatch = path.match(/^\/api\/v1\/admin\/talks\/([^/]+)$/);
      if (talkMatch) {
        const id = decodeURIComponent(talkMatch[1]);
        if (method === 'GET') return await handleAdminGetTalkById(id, request, env, user);
        if (method === 'PUT') return await handleAdminUpdateTalk(id, request, env, user);
        if (method === 'DELETE') return await handleAdminDeleteTalk(id, request, env, user);
      }

      // Experience
      if (path === '/api/v1/admin/experience') {
        if (method === 'GET') return await handleAdminGetExperience(request, env, user);
        if (method === 'POST') return await handleAdminCreateExperience(request, env, user);
      }
      const expMatch = path.match(/^\/api\/v1\/admin\/experience\/([^/]+)$/);
      if (expMatch) {
        const id = decodeURIComponent(expMatch[1]);
        if (method === 'GET') return await handleAdminGetExperienceById(id, request, env, user);
        if (method === 'PUT') return await handleAdminUpdateExperience(id, request, env, user);
        if (method === 'DELETE') return await handleAdminDeleteExperience(id, request, env, user);
      }

      // Education
      if (path === '/api/v1/admin/education') {
        if (method === 'GET') return await handleAdminGetEducation(request, env, user);
        if (method === 'POST') return await handleAdminCreateEducation(request, env, user);
      }
      const eduMatch = path.match(/^\/api\/v1\/admin\/education\/([^/]+)$/);
      if (eduMatch) {
        const id = decodeURIComponent(eduMatch[1]);
        if (method === 'GET') return await handleAdminGetEducationById(id, request, env, user);
        if (method === 'PUT') return await handleAdminUpdateEducation(id, request, env, user);
        if (method === 'DELETE') return await handleAdminDeleteEducation(id, request, env, user);
      }

      // Awards
      if (path === '/api/v1/admin/awards') {
        if (method === 'GET') return await handleAdminGetAwards(request, env, user);
        if (method === 'POST') return await handleAdminCreateAward(request, env, user);
      }
      const awMatch = path.match(/^\/api\/v1\/admin\/awards\/([^/]+)$/);
      if (awMatch) {
        const id = decodeURIComponent(awMatch[1]);
        if (method === 'GET') return await handleAdminGetAwardById(id, request, env, user);
        if (method === 'PUT') return await handleAdminUpdateAward(id, request, env, user);
        if (method === 'DELETE') return await handleAdminDeleteAward(id, request, env, user);
      }

      // Skill Categories
      if (path === '/api/v1/admin/skills') {
        if (method === 'GET') return await handleAdminGetSkills(request, env, user);
        if (method === 'POST') return await handleAdminCreateSkill(request, env, user);
      }
      const skMatch = path.match(/^\/api\/v1\/admin\/skills\/([^/]+)$/);
      if (skMatch) {
        const id = decodeURIComponent(skMatch[1]);
        if (method === 'GET') return await handleAdminGetSkillById(id, request, env, user);
        if (method === 'PUT') return await handleAdminUpdateSkill(id, request, env, user);
        if (method === 'DELETE') return await handleAdminDeleteSkill(id, request, env, user);
      }

      // Social Links
      if (path === '/api/v1/admin/social-links') {
        if (method === 'GET') return await handleAdminGetSocialLinks(request, env, user);
        if (method === 'POST') return await handleAdminCreateSocialLink(request, env, user);
      }
      const slMatch = path.match(/^\/api\/v1\/admin\/social-links\/([^/]+)$/);
      if (slMatch) {
        const id = decodeURIComponent(slMatch[1]);
        if (method === 'GET') return await handleAdminGetSocialLinkById(id, request, env, user);
        if (method === 'PUT') return await handleAdminUpdateSocialLink(id, request, env, user);
        if (method === 'DELETE') return await handleAdminDeleteSocialLink(id, request, env, user);
      }

      // Assets Presigned URL (Phase 3 contract)
      if (path === '/api/v1/admin/assets/presigned-url' && method === 'POST') {
        return await handleAdminPresignedUrl(request, env, user);
      }

      throw new NotFoundError('Admin Route', path);
    }

    // ----------------------------------------------------------------
    // 5. Static Assets & Dashboard SPA Serving (via env.ASSETS)
    // ----------------------------------------------------------------
    if (env.ASSETS && method === 'GET') {
      // 5a. Admin Dashboard SPA Routing (/dashboard/*)
      if (path === '/dashboard' || path === '/dashboard/' || path.startsWith('/dashboard/')) {
        // If it's a static file request with an extension (e.g. /dashboard/assets/index-*.js)
        if (path.includes('.') && !path.endsWith('.html')) {
          return await env.ASSETS.fetch(request);
        }
        // SPA Fallback: serve /dashboard/index.html for all client-side routes under /dashboard/*
        const spaUrl = new URL('/dashboard/index.html', request.url);
        return await env.ASSETS.fetch(new Request(spaUrl.toString(), request));
      }

      // 5b. Public Portfolio Static Assets (/, /styles/*, /scripts/*, /assets/*, /data/*)
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) {
        return assetRes;
      }
      if (path === '/' || path === '') {
        const rootUrl = new URL('/index.html', request.url);
        return await env.ASSETS.fetch(new Request(rootUrl.toString(), request));
      }
      // Explicit 404 for unknown public paths - DO NOT fallback to Admin SPA!
      throw new NotFoundError('Page', path);
    }

    throw new NotFoundError('API Route', path);
  } catch (err: any) {
    if (err instanceof ApiError) {
      return jsonResponse(
        {
          error: {
            code: err.code,
            message: err.message,
            details: err.details || null
          }
        },
        err.status
      );
    }

    console.error('[UNHANDLED ERROR]', err);
    return jsonResponse(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred.'
        }
      },
      500
    );
  }
}
