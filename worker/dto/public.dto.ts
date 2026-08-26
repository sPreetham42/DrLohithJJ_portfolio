import {
  ProfileRecord,
  ScholarStatsRecord,
  PublicationRecord,
  TalkRecord,
  ExperienceRecord,
  EducationRecord,
  AwardRecord,
  SkillCategoryRecord,
  SocialLinkRecord,
  PatentRecord,
  ResearchScholarRecord
} from '../types';

export function toPublicProfileDto(record: ProfileRecord, photoUrl: string | null = null) {
  const resolvedPhotoPath = photoUrl || record.photo_asset_id;
  return {
    name: record.name,
    credential: record.credential,
    designation: record.designation,
    yearsExperience: record.years_experience,
    currentInstitution: record.current_institution,
    heroDescriptionLine1: record.hero_description_line1,
    heroDescriptionLine2: record.hero_description_line2,
    emailPrimary: record.email_primary,
    emailSecondary: record.email_secondary,
    phone: record.phone,
    address: record.address,
    photoAssetId: record.photo_asset_id,
    photoAsset: resolvedPhotoPath,
    photoUrl: resolvedPhotoPath,
    additionalRoles: JSON.parse(record.additional_roles_json || '[]'),
    professionalMemberships: JSON.parse(record.professional_memberships_json || '[]')
  };
}

export function toPublicScholarStatsDto(record: ScholarStatsRecord) {
  return {
    citations: record.citations,
    hIndex: record.h_index,
    i10Index: record.i10_index,
    sciePapersCount: record.scie_papers_count,
    ieeeConferencesCount: record.ieee_conferences_count,
    lastUpdated: record.last_updated,
    source: record.source
  };
}

export function toPublicPublicationDto(record: PublicationRecord) {
  return {
    id: record.id,
    codeNumber: record.code_number,
    title: record.title,
    authors: record.authors,
    venue: record.venue,
    publicationType: record.publication_type,
    year: record.year,
    doi: record.doi,
    externalUrl: record.external_url,
    featured: Boolean(record.featured),
    order: record.display_order
  };
}

export function toPublicTalkDto(record: TalkRecord) {
  return {
    id: record.id,
    title: record.title,
    venue: record.venue,
    dateString: record.date_string,
    year: record.year,
    featured: Boolean(record.featured),
    order: record.display_order
  };
}

export function toPublicExperienceDto(record: ExperienceRecord) {
  return {
    id: record.id,
    role: record.role,
    organization: record.organization,
    startYear: record.start_year,
    endYear: record.end_year,
    isCurrent: Boolean(record.is_current),
    order: record.display_order
  };
}

export function toPublicEducationDto(record: EducationRecord) {
  return {
    id: record.id,
    degree: record.degree,
    institution: record.institution,
    year: record.year,
    thesis: record.thesis,
    order: record.display_order
  };
}

export function toPublicAwardDto(record: AwardRecord) {
  return {
    id: record.id,
    title: record.title,
    organization: record.organization,
    year: record.year,
    description: record.description,
    order: record.display_order
  };
}

export function toPublicSkillCategoryDto(record: SkillCategoryRecord) {
  return {
    id: record.id,
    category: record.category,
    skills: JSON.parse(record.skills_json || '[]'),
    order: record.display_order
  };
}

export function toPublicSocialLinkDto(record: SocialLinkRecord) {
  return {
    id: record.id,
    platform: record.platform,
    url: record.url,
    icon: record.icon,
    order: record.display_order,
    visible: Boolean(record.visible)
  };
}

export function toPublicPatentDto(record: PatentRecord) {
  return {
    id: record.id,
    title: record.title,
    domain: record.domain,
    publicationDate: record.publication_date,
    applicationNumber: record.application_number,
    status: record.status || 'published',
    order: record.display_order
  };
}

export function toPublicResearchScholarDto(record: ResearchScholarRecord) {
  return {
    id: record.id,
    name: record.name,
    scholarId: record.scholar_id,
    badge: record.badge,
    affiliation: record.affiliation,
    guidance: record.guidance,
    order: record.display_order
  };
}

