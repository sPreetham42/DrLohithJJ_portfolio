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
import { AssetRepository } from '../repositories/asset.repository';
import { PatentRepository } from '../repositories/patent.repository';
import { ResearchScholarRepository } from '../repositories/research_scholar.repository';
import {
  toPublicProfileDto,
  toPublicScholarStatsDto,
  toPublicPublicationDto,
  toPublicTalkDto,
  toPublicExperienceDto,
  toPublicEducationDto,
  toPublicAwardDto,
  toPublicSkillCategoryDto,
  toPublicSocialLinkDto,
  toPublicPatentDto,
  toPublicResearchScholarDto
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

  let photoUrl: string | null = null;
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

export async function handleGetScholarStats(request: Request, env: Env): Promise<Response> {
  const repo = new ScholarStatsRepository(env.DB);
  let stats = await repo.get();
  if (!stats) {
    stats = {
      id: 'scholarStats',
      citations: 34,
      h_index: 3,
      i10_index: 1,
      scie_papers_count: 4,
      ieee_conferences_count: 6,
      last_updated: new Date().toISOString(),
      source: 'google_scholar',
      version: 1,
      updated_at: new Date().toISOString(),
      metadata: null
    };
  }

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
  let yearFilter: number | undefined = undefined;
  if (yearParam) {
    const parsed = parseInt(yearParam, 10);
    if (!isNaN(parsed)) yearFilter = parsed;
  }

  const repo = new TalkRepository(env.DB);
  const list = await repo.getAllPublic(yearFilter);

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

export async function handleGetPatents(request: Request, env: Env): Promise<Response> {
  const repo = new PatentRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicPatentDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('patents'));
}

export async function handleGetResearchScholars(request: Request, env: Env): Promise<Response> {
  const repo = new ResearchScholarRepository(env.DB);
  const list = await repo.getAllPublic();
  const dtos = list.map(toPublicResearchScholarDto);
  return jsonResponse(dtos, 200, getPublicCacheHeaders('research-scholars'));
}
