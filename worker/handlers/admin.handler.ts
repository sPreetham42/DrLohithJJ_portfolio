// ================================================================
// DR. LOHITH J.J. PORTFOLIO — ADMIN API ROUTE HANDLERS
// Atomically executes CRUD mutations and revision logging in D1 batch transactions.
// ================================================================

import { Env, AuthenticatedUser } from '../types';
import { ProfileRepository } from '../repositories/profile.repository';
import { ScholarStatsRepository } from '../repositories/scholar.repository';
import { PublicationRepository } from '../repositories/publication.repository';
import { TalkRepository } from '../repositories/talk.repository';
import { ExperienceRepository } from '../repositories/experience.repository';
import { EducationRepository } from '../repositories/education.repository';
import { AwardRepository } from '../repositories/award.repository';
import { SkillCategoryRepository } from '../repositories/skill.repository';
import { SocialLinkRepository } from '../repositories/social.repository';
import { AssetRepository } from '../repositories/asset.repository';
import { PatentRepository } from '../repositories/patent.repository';
import { ResearchScholarRepository } from '../repositories/research_scholar.repository';
import {
  ProfileSchema,
  ScholarStatsSchema,
  PublicationSchema,
  TalkSchema,
  ExperienceSchema,
  EducationSchema,
  AwardSchema,
  SkillCategorySchema,
  SocialLinkSchema,
  PatentSchema,
  ResearchScholarSchema
} from '../validation/schemas';
import { ValidationError, NotFoundError, ApiError } from '../errors';
import { getNoCacheHeaders, invalidateCache } from '../middleware/cache';
import { jsonResponse } from './public.handler';

// ----------------------------------------------------------------
// 1. Profile (Singleton)
// ----------------------------------------------------------------
export async function handleAdminGetProfile(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new ProfileRepository(env.DB);
  const profile = await repo.get();
  if (!profile) throw new NotFoundError('Profile', 'profile');
  return jsonResponse(profile, 200, getNoCacheHeaders());
}

export async function handleAdminUpdateProfile(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = ProfileSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  let photoAssetId: string | null = parse.data.photoAsset || null;
  if (photoAssetId) {
    const assetRepo = new AssetRepository(env.DB);
    const assetById = await assetRepo.getById(photoAssetId);
    if (!assetById) {
      const assetByStorageKey = await env.DB
        .prepare('SELECT id FROM assets WHERE storage_key = ?')
        .bind(photoAssetId)
        .first<{ id: string }>();
      if (assetByStorageKey) {
        photoAssetId = assetByStorageKey.id;
      } else {
        throw new ValidationError(`Referenced photo asset '${photoAssetId}' does not exist.`);
      }
    }
  }

  const repo = new ProfileRepository(env.DB);
  const updated = await repo.updateWithRevision(
    {
      name: parse.data.name,
      credential: parse.data.credential || null,
      designation: parse.data.designation,
      years_experience: parse.data.yearsExperience,
      current_institution: parse.data.currentInstitution,
      hero_description_line1: parse.data.heroDescriptionLine1,
      hero_description_line2: parse.data.heroDescriptionLine2,
      email_primary: parse.data.emailPrimary,
      email_secondary: parse.data.emailSecondary || null,
      phone: parse.data.phone,
      address: parse.data.address,
      photo_asset_id: photoAssetId,
      additional_roles_json: JSON.stringify(parse.data.additionalRoles),
      professional_memberships_json: JSON.stringify(parse.data.professionalMemberships),
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('profile', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 2. Scholar Stats (Singleton)
// ----------------------------------------------------------------
export async function handleAdminGetScholarStats(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new ScholarStatsRepository(env.DB);
  const stats = await repo.get();
  if (!stats) throw new NotFoundError('ScholarStats', 'scholarStats');
  return jsonResponse(stats, 200, getNoCacheHeaders());
}

export async function handleAdminUpdateScholarStats(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = ScholarStatsSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new ScholarStatsRepository(env.DB);
  const updated = await repo.updateWithRevision(
    {
      citations: parse.data.citations,
      h_index: parse.data.hIndex,
      i10_index: parse.data.i10Index,
      scie_papers_count: parse.data.sciePapersCount,
      ieee_conferences_count: parse.data.ieeeConferencesCount,
      last_updated: parse.data.lastUpdated,
      source: parse.data.source || 'google_scholar',
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('scholar-stats', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 3. Publications
// ----------------------------------------------------------------
export async function handleAdminGetPublications(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new PublicationRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetPublicationById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new PublicationRepository(env.DB);
  const pub = await repo.getById(id);
  if (!pub) throw new NotFoundError('Publication', id);
  return jsonResponse(pub, 200, getNoCacheHeaders());
}

export async function handleAdminCreatePublication(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = PublicationSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new PublicationRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      code_number: parse.data.codeNumber || null,
      title: parse.data.title,
      authors: parse.data.authors,
      venue: parse.data.venue,
      publication_type: parse.data.publicationType,
      year: parse.data.year,
      doi: parse.data.doi || null,
      external_url: parse.data.externalUrl || null,
      pdf_asset_id: parse.data.pdfAssetId || null,
      featured: parse.data.featured ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('publications', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdatePublication(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = PublicationSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new PublicationRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      code_number: parse.data.codeNumber || null,
      title: parse.data.title,
      authors: parse.data.authors,
      venue: parse.data.venue,
      publication_type: parse.data.publicationType,
      year: parse.data.year,
      doi: parse.data.doi || null,
      external_url: parse.data.externalUrl || null,
      pdf_asset_id: parse.data.pdfAssetId || null,
      featured: parse.data.featured ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('publications', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeletePublication(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new PublicationRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Publication', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('publications', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 4. Talks
// ----------------------------------------------------------------
export async function handleAdminGetTalks(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new TalkRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetTalkById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new TalkRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Talk', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateTalk(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = TalkSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new TalkRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      title: parse.data.title,
      venue: parse.data.venue,
      date_string: parse.data.dateString,
      year: parse.data.year,
      featured: parse.data.featured ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('talks', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateTalk(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = TalkSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new TalkRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      title: parse.data.title,
      venue: parse.data.venue,
      date_string: parse.data.dateString,
      year: parse.data.year,
      featured: parse.data.featured ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('talks', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteTalk(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new TalkRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Talk', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('talks', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 5. Experience
// ----------------------------------------------------------------
export async function handleAdminGetExperience(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new ExperienceRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetExperienceById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new ExperienceRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Experience', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateExperience(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = ExperienceSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new ExperienceRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      role: parse.data.role,
      organization: parse.data.organization,
      start_year: parse.data.startYear,
      end_year: parse.data.endYear,
      is_current: parse.data.isCurrent ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('experience', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateExperience(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = ExperienceSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new ExperienceRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      role: parse.data.role,
      organization: parse.data.organization,
      start_year: parse.data.startYear,
      end_year: parse.data.endYear,
      is_current: parse.data.isCurrent ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('experience', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteExperience(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new ExperienceRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Experience', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('experience', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 6. Education
// ----------------------------------------------------------------
export async function handleAdminGetEducation(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new EducationRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetEducationById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new EducationRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Education', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateEducation(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = EducationSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new EducationRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      degree: parse.data.degree,
      institution: parse.data.institution,
      year: parse.data.year,
      thesis: parse.data.thesis || null,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('education', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateEducation(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = EducationSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new EducationRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      degree: parse.data.degree,
      institution: parse.data.institution,
      year: parse.data.year,
      thesis: parse.data.thesis || null,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('education', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteEducation(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new EducationRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Education', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('education', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 7. Awards
// ----------------------------------------------------------------
export async function handleAdminGetAwards(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new AwardRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetAwardById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new AwardRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Award', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateAward(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = AwardSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new AwardRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      title: parse.data.title,
      organization: parse.data.organization,
      year: parse.data.year,
      description: parse.data.description || null,
      certificate_asset_id: parse.data.certificateAssetId || null,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('awards', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateAward(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = AwardSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new AwardRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      title: parse.data.title,
      organization: parse.data.organization,
      year: parse.data.year,
      description: parse.data.description || null,
      certificate_asset_id: parse.data.certificateAssetId || null,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('awards', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteAward(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new AwardRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Award', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('awards', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 8. Skill Categories
// ----------------------------------------------------------------
export async function handleAdminGetSkills(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new SkillCategoryRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetSkillById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new SkillCategoryRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('SkillCategory', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateSkill(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = SkillCategorySchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new SkillCategoryRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      category: parse.data.category,
      skills_json: JSON.stringify(parse.data.skills),
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('skills', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateSkill(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = SkillCategorySchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new SkillCategoryRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      category: parse.data.category,
      skills_json: JSON.stringify(parse.data.skills),
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('skills', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteSkill(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new SkillCategoryRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('SkillCategory', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('skills', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 9. Social Links
// ----------------------------------------------------------------
export async function handleAdminGetSocialLinks(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new SocialLinkRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetSocialLinkById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new SocialLinkRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('SocialLink', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateSocialLink(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = SocialLinkSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new SocialLinkRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      platform: parse.data.platform,
      url: parse.data.url,
      icon: parse.data.icon,
      display_order: parse.data.order,
      visible: parse.data.visible !== false ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('social-links', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateSocialLink(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = SocialLinkSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new SocialLinkRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      platform: parse.data.platform,
      url: parse.data.url,
      icon: parse.data.icon,
      display_order: parse.data.order,
      visible: parse.data.visible !== false ? 1 : 0,
      published: parse.data.published !== false ? 1 : 0,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('social-links', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteSocialLink(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new SocialLinkRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('SocialLink', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('social-links', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 10. Patents
// ----------------------------------------------------------------
export async function handleAdminGetPatents(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new PatentRepository(env.DB);
  const list = await repo.getAllAdmin();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetPatentById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new PatentRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Patent', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreatePatent(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = PatentSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new PatentRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      title: parse.data.title,
      domain: parse.data.domain,
      publication_date: parse.data.publicationDate,
      application_number: parse.data.applicationNumber,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('patents', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdatePatent(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = PatentSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new PatentRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      title: parse.data.title,
      domain: parse.data.domain,
      publication_date: parse.data.publicationDate,
      application_number: parse.data.applicationNumber,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('patents', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeletePatent(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new PatentRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Patent', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('patents', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 11. Research Scholars
// ----------------------------------------------------------------
export async function handleAdminGetResearchScholars(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new ResearchScholarRepository(env.DB);
  const list = await repo.getAllAdmin();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetResearchScholarById(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const repo = new ResearchScholarRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('ResearchScholar', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateResearchScholar(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = ResearchScholarSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new ResearchScholarRepository(env.DB);
  const created = await repo.createWithRevision(
    {
      id: parse.data.id,
      name: parse.data.name,
      scholar_id: parse.data.scholarId || null,
      badge: parse.data.badge || 'Co-guided',
      affiliation: parse.data.affiliation,
      guidance: parse.data.guidance || null,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    user.email
  );

  await invalidateCache('research-scholars', env);
  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateResearchScholar(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const parse = ResearchScholarSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new ResearchScholarRepository(env.DB);
  const updated = await repo.updateWithRevision(
    id,
    {
      name: parse.data.name,
      scholar_id: parse.data.scholarId || null,
      badge: parse.data.badge || 'Co-guided',
      affiliation: parse.data.affiliation,
      guidance: parse.data.guidance || null,
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion,
    user.email
  );

  await invalidateCache('research-scholars', env);
  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteResearchScholar(id: string, request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new ResearchScholarRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('ResearchScholar', id);

  await repo.deleteWithRevision(id, expectedVersion, user.email);
  await invalidateCache('research-scholars', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// ----------------------------------------------------------------
// 12. Asset Pre-signed URL Boundary (Status & Real Binding Check)
// ----------------------------------------------------------------
export async function handleAdminPresignedUrl(request: Request, env: Env, user: AuthenticatedUser): Promise<Response> {
  const body = (await request.json()) as any;
  const filename = body.filename;
  const mimeType = body.mimeType || 'application/pdf';

  if (!filename || typeof filename !== 'string') {
    throw new ValidationError('Missing required filename in upload request');
  }

  // If R2 Bucket is not configured on Cloudflare Worker bindings
  if (!env.ASSETS_BUCKET) {
    return jsonResponse(
      {
        status: 'deferred',
        message: 'Cloudflare R2 Object Storage binding (ASSETS_BUCKET) is currently unconfigured in wrangler.toml.',
        uploadKey: null,
        uploadUrl: null
      },
      501,
      getNoCacheHeaders()
    );
  }

  const uploadKey = `media/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  return jsonResponse(
    {
      status: 'active',
      uploadKey,
      mimeType,
      uploadUrl: `/api/v1/admin/assets/upload/${uploadKey}`,
      expiresInSeconds: 900
    },
    200,
    getNoCacheHeaders()
  );
}
