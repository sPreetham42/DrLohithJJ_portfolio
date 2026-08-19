import { ProfileRepository } from '../repositories/profile.repository.js';
import { ScholarStatsRepository } from '../repositories/scholar.repository.js';
import { PublicationRepository } from '../repositories/publication.repository.js';
import { TalkRepository } from '../repositories/talk.repository.js';
import { ExperienceRepository } from '../repositories/experience.repository.js';
import { EducationRepository } from '../repositories/education.repository.js';
import { AwardRepository } from '../repositories/award.repository.js';
import { SkillCategoryRepository } from '../repositories/skill.repository.js';
import { SocialLinkRepository } from '../repositories/social.repository.js';
import { RevisionRepository } from '../repositories/revision.repository.js';
import {
  ProfileSchema,
  ScholarStatsSchema,
  PublicationSchema,
  TalkSchema,
  ExperienceSchema,
  EducationSchema,
  AwardSchema,
  SkillCategorySchema,
  SocialLinkSchema
} from '../validation/schemas.js';
import { ValidationError, NotFoundError } from '../errors.js';
import { getNoCacheHeaders, invalidateCache } from '../middleware/cache.js';
import { jsonResponse } from './public.handler.js';

export async function logAdminRevision(
  db,
  entityType,
  entityId,
  version,
  action,
  payload,
  author
) {
  const revRepo = new RevisionRepository(db);
  const now = new Date().toISOString();
  await revRepo.create({
    id: `rev-${entityType}-${entityId}-${version}-${Date.now()}`,
    entity_type: entityType,
    entity_id: entityId,
    version,
    action,
    payload_json: JSON.stringify(payload),
    author,
    created_at: now
  });
}

// 1. Profile
export async function handleAdminGetProfile(request, env, user) {
  const repo = new ProfileRepository(env.DB);
  const profile = await repo.get();
  if (!profile) throw new NotFoundError('Profile', 'profile');
  return jsonResponse(profile, 200, getNoCacheHeaders());
}

export async function handleAdminUpdateProfile(request, env, user) {
  const body = await request.json();
  const parse = ProfileSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new ProfileRepository(env.DB);
  const updated = await repo.update(
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
      photo_asset_id: parse.data.photoAsset || null,
      additional_roles_json: JSON.stringify(parse.data.additionalRoles),
      professional_memberships_json: JSON.stringify(parse.data.professionalMemberships),
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion
  );

  await logAdminRevision(env.DB, 'profile', 'profile', updated.version, 'update', updated, user.email);
  await invalidateCache('profile', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

// 2. Scholar Stats
export async function handleAdminGetScholarStats(request, env, user) {
  const repo = new ScholarStatsRepository(env.DB);
  const stats = await repo.get();
  if (!stats) throw new NotFoundError('ScholarStats', 'scholarStats');
  return jsonResponse(stats, 200, getNoCacheHeaders());
}

export async function handleAdminUpdateScholarStats(request, env, user) {
  const body = await request.json();
  const parse = ScholarStatsSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new ScholarStatsRepository(env.DB);
  const updated = await repo.update(
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
    expectedVersion
  );

  await logAdminRevision(env.DB, 'scholarStats', 'scholarStats', updated.version, 'update', updated, user.email);
  await invalidateCache('scholar-stats', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

// 3. Publications
export async function handleAdminGetPublications(request, env, user) {
  const repo = new PublicationRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetPublicationById(id, request, env, user) {
  const repo = new PublicationRepository(env.DB);
  const pub = await repo.getById(id);
  if (!pub) throw new NotFoundError('Publication', id);
  return jsonResponse(pub, 200, getNoCacheHeaders());
}

export async function handleAdminCreatePublication(request, env, user) {
  const body = await request.json();
  const parse = PublicationSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new PublicationRepository(env.DB);
  const created = await repo.create({
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
  });

  await logAdminRevision(env.DB, 'publication', created.id, 1, 'create', created, user.email);
  await invalidateCache('publications', env);

  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdatePublication(id, request, env, user) {
  const body = await request.json();
  const parse = PublicationSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new PublicationRepository(env.DB);
  const updated = await repo.update(
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
    expectedVersion
  );

  await logAdminRevision(env.DB, 'publication', id, updated.version, 'update', updated, user.email);
  await invalidateCache('publications', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeletePublication(id, request, env, user) {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new PublicationRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Publication', id);

  await repo.delete(id, expectedVersion);
  await logAdminRevision(env.DB, 'publication', id, expectedVersion + 1, 'delete', existing, user.email);
  await invalidateCache('publications', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// 4. Talks
export async function handleAdminGetTalks(request, env, user) {
  const repo = new TalkRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetTalkById(id, request, env, user) {
  const repo = new TalkRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Talk', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateTalk(request, env, user) {
  const body = await request.json();
  const parse = TalkSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new TalkRepository(env.DB);
  const created = await repo.create({
    id: parse.data.id,
    title: parse.data.title,
    venue: parse.data.venue,
    date_string: parse.data.dateString,
    year: parse.data.year,
    featured: parse.data.featured ? 1 : 0,
    published: parse.data.published !== false ? 1 : 0,
    display_order: parse.data.order,
    metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
  });

  await logAdminRevision(env.DB, 'talk', created.id, 1, 'create', created, user.email);
  await invalidateCache('talks', env);

  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateTalk(id, request, env, user) {
  const body = await request.json();
  const parse = TalkSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new TalkRepository(env.DB);
  const updated = await repo.update(
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
    expectedVersion
  );

  await logAdminRevision(env.DB, 'talk', id, updated.version, 'update', updated, user.email);
  await invalidateCache('talks', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteTalk(id, request, env, user) {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new TalkRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Talk', id);

  await repo.delete(id, expectedVersion);
  await logAdminRevision(env.DB, 'talk', id, expectedVersion + 1, 'delete', existing, user.email);
  await invalidateCache('talks', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// 5. Experience
export async function handleAdminGetExperience(request, env, user) {
  const repo = new ExperienceRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetExperienceById(id, request, env, user) {
  const repo = new ExperienceRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Experience', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateExperience(request, env, user) {
  const body = await request.json();
  const parse = ExperienceSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new ExperienceRepository(env.DB);
  const created = await repo.create({
    id: parse.data.id,
    role: parse.data.role,
    organization: parse.data.organization,
    start_year: parse.data.startYear,
    end_year: parse.data.endYear,
    is_current: parse.data.isCurrent ? 1 : 0,
    published: parse.data.published !== false ? 1 : 0,
    display_order: parse.data.order,
    metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
  });

  await logAdminRevision(env.DB, 'experience', created.id, 1, 'create', created, user.email);
  await invalidateCache('experience', env);

  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateExperience(id, request, env, user) {
  const body = await request.json();
  const parse = ExperienceSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new ExperienceRepository(env.DB);
  const updated = await repo.update(
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
    expectedVersion
  );

  await logAdminRevision(env.DB, 'experience', id, updated.version, 'update', updated, user.email);
  await invalidateCache('experience', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteExperience(id, request, env, user) {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new ExperienceRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Experience', id);

  await repo.delete(id, expectedVersion);
  await logAdminRevision(env.DB, 'experience', id, expectedVersion + 1, 'delete', existing, user.email);
  await invalidateCache('experience', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// 6. Education
export async function handleAdminGetEducation(request, env, user) {
  const repo = new EducationRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetEducationById(id, request, env, user) {
  const repo = new EducationRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Education', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateEducation(request, env, user) {
  const body = await request.json();
  const parse = EducationSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new EducationRepository(env.DB);
  const created = await repo.create({
    id: parse.data.id,
    degree: parse.data.degree,
    institution: parse.data.institution,
    year: parse.data.year,
    thesis: parse.data.thesis || null,
    published: parse.data.published !== false ? 1 : 0,
    display_order: parse.data.order,
    metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
  });

  await logAdminRevision(env.DB, 'education', created.id, 1, 'create', created, user.email);
  await invalidateCache('education', env);

  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateEducation(id, request, env, user) {
  const body = await request.json();
  const parse = EducationSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new EducationRepository(env.DB);
  const updated = await repo.update(
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
    expectedVersion
  );

  await logAdminRevision(env.DB, 'education', id, updated.version, 'update', updated, user.email);
  await invalidateCache('education', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteEducation(id, request, env, user) {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new EducationRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Education', id);

  await repo.delete(id, expectedVersion);
  await logAdminRevision(env.DB, 'education', id, expectedVersion + 1, 'delete', existing, user.email);
  await invalidateCache('education', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// 7. Awards
export async function handleAdminGetAwards(request, env, user) {
  const repo = new AwardRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetAwardById(id, request, env, user) {
  const repo = new AwardRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('Award', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateAward(request, env, user) {
  const body = await request.json();
  const parse = AwardSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new AwardRepository(env.DB);
  const created = await repo.create({
    id: parse.data.id,
    title: parse.data.title,
    organization: parse.data.organization,
    year: parse.data.year,
    description: parse.data.description || null,
    certificate_asset_id: parse.data.certificateAssetId || null,
    published: parse.data.published !== false ? 1 : 0,
    display_order: parse.data.order,
    metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
  });

  await logAdminRevision(env.DB, 'award', created.id, 1, 'create', created, user.email);
  await invalidateCache('awards', env);

  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateAward(id, request, env, user) {
  const body = await request.json();
  const parse = AwardSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new AwardRepository(env.DB);
  const updated = await repo.update(
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
    expectedVersion
  );

  await logAdminRevision(env.DB, 'award', id, updated.version, 'update', updated, user.email);
  await invalidateCache('awards', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteAward(id, request, env, user) {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new AwardRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('Award', id);

  await repo.delete(id, expectedVersion);
  await logAdminRevision(env.DB, 'award', id, expectedVersion + 1, 'delete', existing, user.email);
  await invalidateCache('awards', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// 8. Skill Categories
export async function handleAdminGetSkills(request, env, user) {
  const repo = new SkillCategoryRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetSkillById(id, request, env, user) {
  const repo = new SkillCategoryRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('SkillCategory', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateSkill(request, env, user) {
  const body = await request.json();
  const parse = SkillCategorySchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new SkillCategoryRepository(env.DB);
  const created = await repo.create({
    id: parse.data.id,
    category: parse.data.category,
    skills_json: JSON.stringify(parse.data.skills),
    published: parse.data.published !== false ? 1 : 0,
    display_order: parse.data.order,
    metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
  });

  await logAdminRevision(env.DB, 'skillCategory', created.id, 1, 'create', created, user.email);
  await invalidateCache('skills', env);

  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateSkill(id, request, env, user) {
  const body = await request.json();
  const parse = SkillCategorySchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new SkillCategoryRepository(env.DB);
  const updated = await repo.update(
    id,
    {
      category: parse.data.category,
      skills_json: JSON.stringify(parse.data.skills),
      published: parse.data.published !== false ? 1 : 0,
      display_order: parse.data.order,
      metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
    },
    expectedVersion
  );

  await logAdminRevision(env.DB, 'skillCategory', id, updated.version, 'update', updated, user.email);
  await invalidateCache('skills', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteSkill(id, request, env, user) {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new SkillCategoryRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('SkillCategory', id);

  await repo.delete(id, expectedVersion);
  await logAdminRevision(env.DB, 'skillCategory', id, expectedVersion + 1, 'delete', existing, user.email);
  await invalidateCache('skills', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// 9. Social Links
export async function handleAdminGetSocialLinks(request, env, user) {
  const repo = new SocialLinkRepository(env.DB);
  const list = await repo.getAllPublic();
  return jsonResponse(list, 200, getNoCacheHeaders());
}

export async function handleAdminGetSocialLinkById(id, request, env, user) {
  const repo = new SocialLinkRepository(env.DB);
  const item = await repo.getById(id);
  if (!item) throw new NotFoundError('SocialLink', id);
  return jsonResponse(item, 200, getNoCacheHeaders());
}

export async function handleAdminCreateSocialLink(request, env, user) {
  const body = await request.json();
  const parse = SocialLinkSchema.safeParse(body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const repo = new SocialLinkRepository(env.DB);
  const created = await repo.create({
    id: parse.data.id,
    platform: parse.data.platform,
    url: parse.data.url,
    icon: parse.data.icon,
    display_order: parse.data.order,
    visible: parse.data.visible !== false ? 1 : 0,
    published: parse.data.published !== false ? 1 : 0,
    metadata: parse.data.metadata ? JSON.stringify(parse.data.metadata) : null
  });

  await logAdminRevision(env.DB, 'socialLink', created.id, 1, 'create', created, user.email);
  await invalidateCache('social-links', env);

  return jsonResponse(created, 201, getNoCacheHeaders());
}

export async function handleAdminUpdateSocialLink(id, request, env, user) {
  const body = await request.json();
  const parse = SocialLinkSchema.safeParse(body.data || body);
  if (!parse.success) throw new ValidationError(parse.error.format());

  const expectedVersion = Number(body.version);
  if (isNaN(expectedVersion)) throw new ValidationError('Missing or invalid expected version number');

  const repo = new SocialLinkRepository(env.DB);
  const updated = await repo.update(
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
    expectedVersion
  );

  await logAdminRevision(env.DB, 'socialLink', id, updated.version, 'update', updated, user.email);
  await invalidateCache('social-links', env);

  return jsonResponse(updated, 200, getNoCacheHeaders());
}

export async function handleAdminDeleteSocialLink(id, request, env, user) {
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const expectedVersion = versionParam ? parseInt(versionParam, 10) : NaN;
  if (isNaN(expectedVersion)) throw new ValidationError('Missing required version query parameter for deletion');

  const repo = new SocialLinkRepository(env.DB);
  const existing = await repo.getById(id);
  if (!existing) throw new NotFoundError('SocialLink', id);

  await repo.delete(id, expectedVersion);
  await logAdminRevision(env.DB, 'socialLink', id, expectedVersion + 1, 'delete', existing, user.email);
  await invalidateCache('social-links', env);

  return jsonResponse({ success: true, deletedId: id }, 200, getNoCacheHeaders());
}

// 10. Asset Pre-signed URL boundary
export async function handleAdminPresignedUrl(request, env, user) {
  const body = await request.json();
  const filename = body.filename;
  const mimeType = body.mimeType || 'application/pdf';

  if (!filename || typeof filename !== 'string') {
    throw new ValidationError('Missing required filename in upload request');
  }

  const uploadKey = `media/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  return jsonResponse({
    uploadKey,
    mimeType,
    uploadUrl: `https://api.drlohithjj.com/r2-presigned-upload/${uploadKey}?token=mock-phase2-spec`,
    expiresInSeconds: 900
  }, 200, getNoCacheHeaders());
}
