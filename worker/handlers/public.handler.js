import { ProfileRepository } from '../repositories/profile.repository.js';
import { ScholarStatsRepository } from '../repositories/scholar.repository.js';
import { PublicationRepository } from '../repositories/publication.repository.js';
import { TalkRepository } from '../repositories/talk.repository.js';
import { ExperienceRepository } from '../repositories/experience.repository.js';
import { EducationRepository } from '../repositories/education.repository.js';
import { AwardRepository } from '../repositories/award.repository.js';
import { SkillCategoryRepository } from '../repositories/skill.repository.js';
import { SocialLinkRepository } from '../repositories/social.repository.js';
import { AssetRepository } from '../repositories/asset.repository.js';
import {
  toPublicProfileDto,
  toPublicScholarStatsDto,
  toPublicPublicationDto,
  toPublicTalkDto,
  toPublicExperienceDto,
  toPublicEducationDto,
  toPublicAwardDto,
  toPublicSkillCategoryDto,
  toPublicSocialLinkDto
} from '../dto/public.dto.js';
import { getPublicCacheHeaders } from '../middleware/cache.js';
import { NotFoundError } from '../errors.js';

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

export async function handleHealth(request, env) {
  return jsonResponse({
    status: 'ok',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  });
}

export async function handleGetProfile(request, env) {
  const repo = new ProfileRepository(env.DB);
  const profile = await repo.get();
  if (!profile) throw new NotFoundError('Profile', 'profile');

  let photoUrl = null;
  if (profile.photo_asset_id) {
    const assetRepo = new AssetRepository(env.DB);
    const asset = await assetRepo.getById(profile.photo_asset_id);
    if (asset) {
      photoUrl = asset.storage_key;
    }
  }

  const dto = toPublicProfileDto(profile, photoUrl);
  return jsonResponse(dto, 200, getPublicCacheHeaders('profile'));
}

export async function handleGetScholarStats(request, env) {
  const repo = new ScholarStatsRepository(env.DB);
  const stats = await repo.get();
  if (!stats) throw new NotFoundError('ScholarStats', 'scholarStats');

  const dto = toPublicScholarStatsDto(stats);
  return jsonResponse(dto, 200, getPublicCacheHeaders('scholar-stats'));
}

export async function handleGetPublications(request, env) {
  const repo = new PublicationRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicPublicationDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('publications'));
}

export async function handleGetTalks(request, env) {
  const url = new URL(request.url);
  const yearParam = url.searchParams.get('year');
  const yearFilter = yearParam ? parseInt(yearParam, 10) : null;

  const repo = new TalkRepository(env.DB);
  let list = await repo.getAllPublic();
  if (yearFilter && !isNaN(yearFilter)) {
    list = list.filter(t => t.year === yearFilter);
  }

  const dtos = list.map(toPublicTalkDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('talks'));
}

export async function handleGetExperience(request, env) {
  const repo = new ExperienceRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicExperienceDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('experience'));
}

export async function handleGetEducation(request, env) {
  const repo = new EducationRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicEducationDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('education'));
}

export async function handleGetAwards(request, env) {
  const repo = new AwardRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicAwardDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('awards'));
}

export async function handleGetSkills(request, env) {
  const repo = new SkillCategoryRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicSkillCategoryDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('skills'));
}

export async function handleGetSocialLinks(request, env) {
  const repo = new SocialLinkRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicSocialLinkDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('social-links'));
}
