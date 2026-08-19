import { ApiError, NotFoundError } from './errors.js';
import { authenticateAdmin } from './middleware/access.js';
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
} from './handlers/public.handler.js';
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
} from './handlers/admin.handler.js';
import { handleScholarSyncAutomation } from './handlers/automation.handler.js';

export async function routeRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  try {
    // 1. Health
    if (path === '/api/v1/health' && method === 'GET') {
      return await handleHealth(request, env);
    }

    // 2. Public Read Endpoints
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

    // 3. Automation Endpoint
    if (path === '/api/v1/automation/scholar' && method === 'POST') {
      return await handleScholarSyncAutomation(request, env);
    }

    // 4. Protected Admin Endpoints
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

      // Assets Presigned URL
      if (path === '/api/v1/admin/assets/presigned-url' && method === 'POST') {
        return await handleAdminPresignedUrl(request, env, user);
      }

      throw new NotFoundError('Admin Route', path);
    }

    throw new NotFoundError('API Route', path);
  } catch (err) {
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
