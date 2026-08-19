import { Env } from '../types';
import { ProfileRepository } from '../repositories/profile.repository';
import { ScholarStatsRepository } from '../repositories/scholar.repository';
import { PublicationRepository } from '../repositories/publication.repository';
import { TalkRepository } from '../repositories/talk.repository';
import { ExperienceRepository } from '../repositories/experience.repository';
import { EducationRepository } from '../repositories/education.repository';
import { AwardRepository } from '../repositories/award.repository';
import { SkillCategoryRepository } from '../repositories/skill.repository';
import { SocialLinkRepository } from '../repositories/social.repository';
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
} from '../dto/public.dto';
import { getPublicCacheHeaders } from '../middleware/cache';
import { NotFoundError } from '../errors';

export function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders
    }
  });
}

export async function handleHealth(request: Request, env: Env): Promise<Response> {
  return jsonResponse({
    status: 'ok',
    environment: env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString()
  });
}

export async function handleGetProfile(request: Request, env: Env): Promise<Response> {
  const repo = new ProfileRepository(env.DB);
  const profile = await repo.get();
  if (!profile) throw new NotFoundError('Profile', 'profile');

  const dto = toPublicProfileDto(profile);
  return jsonResponse(dto, 200, getPublicCacheHeaders('profile'));
}

export async function handleGetScholarStats(request: Request, env: Env): Promise<Response> {
  const repo = new ScholarStatsRepository(env.DB);
  const stats = await repo.get();
  if (!stats) throw new NotFoundError('ScholarStats', 'scholarStats');

  const dto = toPublicScholarStatsDto(stats);
  return jsonResponse(dto, 200, getPublicCacheHeaders('scholar-stats'));
}

export async function handleGetPublications(request: Request, env: Env): Promise<Response> {
  const repo = new PublicationRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicPublicationDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('publications'));
}

export async function handleGetTalks(request: Request, env: Env): Promise<Response> {
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

export async function handleGetExperience(request: Request, env: Env): Promise<Response> {
  const repo = new ExperienceRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicExperienceDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('experience'));
}

export async function handleGetEducation(request: Request, env: Env): Promise<Response> {
  const repo = new EducationRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicEducationDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('education'));
}

export async function handleGetAwards(request: Request, env: Env): Promise<Response> {
  const repo = new AwardRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicAwardDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('awards'));
}

export async function handleGetSkills(request: Request, env: Env): Promise<Response> {
  const repo = new SkillCategoryRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicSkillCategoryDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('skills'));
}

export async function handleGetSocialLinks(request: Request, env: Env): Promise<Response> {
  const repo = new SocialLinkRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicSocialLinkDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('social-links'));
}
