import { z } from 'zod';

export const MetadataSchema = z.record(z.string(), z.unknown()).nullable().optional();

export const ProfileSchema = z.object({
  id: z.literal('profile').optional().default('profile'),
  name: z.string().min(1),
  credential: z.string().nullable().optional(),
  designation: z.string().min(1),
  yearsExperience: z.number().int().nonnegative(),
  currentInstitution: z.string().min(1),
  heroDescriptionLine1: z.string().min(1),
  heroDescriptionLine2: z.string().min(1),
  emailPrimary: z.string().email().or(z.string().min(3)),
  emailSecondary: z.string().email().or(z.string().min(3)).nullable().optional(),
  phone: z.string().min(5),
  address: z.string().min(1),
  photoAsset: z.string().min(1),
  additionalRoles: z.array(z.string()),
  professionalMemberships: z.array(z.string()),
  metadata: MetadataSchema,
});

export const ScholarStatsSchema = z.object({
  id: z.literal('scholarStats').optional().default('scholarStats'),
  citations: z.number().int().nonnegative(),
  hIndex: z.number().int().nonnegative(),
  i10Index: z.number().int().nonnegative(),
  sciePapersCount: z.number().int().nonnegative(),
  ieeeConferencesCount: z.number().int().nonnegative(),
  lastUpdated: z.string().min(1),
  source: z.string().min(1),
  metadata: MetadataSchema,
});

export const PublicationSchema = z.object({
  id: z.string().min(1),
  codeNumber: z.string().nullable().optional(),
  title: z.string().min(1),
  authors: z.string().min(1),
  venue: z.string().min(1),
  publicationType: z.enum(['journal', 'conference', 'book']),
  year: z.number().int().positive(),
  doi: z.string().nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  pdfAssetId: z.string().nullable().optional(),
  featured: z.boolean(),
  published: z.boolean().optional().default(true),
  order: z.number().int().nonnegative(),
  metadata: MetadataSchema,
});

export const TalkSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  venue: z.string().min(1),
  dateString: z.string().min(1),
  year: z.number().int().positive(),
  featured: z.boolean(),
  published: z.boolean().optional().default(true),
  order: z.number().int().nonnegative(),
  metadata: MetadataSchema,
});

export const ExperienceSchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  organization: z.string().min(1),
  startYear: z.string().min(1),
  endYear: z.string().min(1),
  isCurrent: z.boolean(),
  published: z.boolean().optional().default(true),
  order: z.number().int().nonnegative(),
  metadata: MetadataSchema,
});

export const EducationSchema = z.object({
  id: z.string().min(1),
  degree: z.string().min(1),
  institution: z.string().min(1),
  year: z.string().min(1),
  thesis: z.string().nullable().optional(),
  published: z.boolean().optional().default(true),
  order: z.number().int().nonnegative(),
  metadata: MetadataSchema,
});

export const AwardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  organization: z.string().min(1),
  year: z.string().min(1),
  description: z.string().nullable().optional(),
  certificateAssetId: z.string().nullable().optional(),
  published: z.boolean().optional().default(true),
  order: z.number().int().nonnegative(),
  metadata: MetadataSchema,
});

export const SkillCategorySchema = z.object({
  id: z.string().min(1),
  category: z.string().min(1),
  skills: z.array(z.string().min(1)),
  published: z.boolean().optional().default(true),
  order: z.number().int().nonnegative(),
  metadata: MetadataSchema,
});

export const SocialLinkSchema = z.object({
  id: z.string().min(1),
  platform: z.string().min(1),
  url: z.string().url().or(z.string().min(1)),
  icon: z.string().min(1),
  order: z.number().int().nonnegative(),
  visible: z.boolean(),
  published: z.boolean().optional().default(true),
  metadata: MetadataSchema,
});

export const AssetSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  localPath: z.string().min(1),
  mimeType: z.string().min(1),
  byteSize: z.number().int().positive(),
  isPrimaryPhoto: z.boolean(),
  metadata: MetadataSchema,
});

export const CanonicalSnapshotSchema = z.object({
  version: z.string().min(1),
  generatedAt: z.string().min(1),
  profile: ProfileSchema,
  scholarStats: ScholarStatsSchema,
  experience: z.array(ExperienceSchema).min(1),
  education: z.array(EducationSchema).min(1),
  publications: z.array(PublicationSchema).min(1),
  talks: z.array(TalkSchema).min(1),
  awards: z.array(AwardSchema).min(1),
  skillCategories: z.array(SkillCategorySchema).min(1),
  socialLinks: z.array(SocialLinkSchema).min(1),
  assets: z.array(AssetSchema).min(1),
});

export type CanonicalSnapshot = z.infer<typeof CanonicalSnapshotSchema>;
