// ================================================================
// DR. LOHITH J.J. PORTFOLIO — DATA MODEL & WORKER TYPES
// Core typed interfaces for D1 entities, Repositories, and Worker Env
// ================================================================

export interface Env {
  DB: D1Database;
  ASSETS_BUCKET?: R2Bucket;
  ENVIRONMENT: string;
  ADMIN_EMAILS?: string; // Comma-separated allowlist, e.g. "lohithjj@gmail.com"
  ACCESS_CERTS_URL?: string; // e.g. "https://<team>.cloudflareaccess.com/cdn-cgi/access/certs"
  ACCESS_AUDIENCE?: string; // e.g. Access Application AUD tag
  ACCESS_ISSUER?: string; // e.g. "https://<team>.cloudflareaccess.com"
  SCHOLAR_SYNC_SECRET?: string; // Bearer secret for automation endpoint
}

export interface ProfileRecord {
  id: string; // 'profile'
  name: string;
  credential: string | null;
  designation: string;
  years_experience: number;
  current_institution: string;
  hero_description_line1: string;
  hero_description_line2: string;
  email_primary: string;
  email_secondary: string | null;
  phone: string;
  address: string;
  photo_asset_id: string | null;
  additional_roles_json: string; // stringified string[]
  professional_memberships_json: string; // stringified string[]
  version: number;
  updated_at: string;
  metadata?: string | null;
}

export interface ScholarStatsRecord {
  id: string; // 'scholarStats'
  citations: number;
  h_index: number;
  i10_index: number;
  scie_papers_count: number;
  ieee_conferences_count: number;
  last_updated: string;
  source: string;
  version: number;
  updated_at: string;
  metadata?: string | null;
}

export interface PublicationRecord {
  id: string;
  code_number: string | null;
  title: string;
  authors: string;
  venue: string;
  publication_type: 'journal' | 'conference' | 'book';
  year: number;
  doi: string | null;
  external_url: string | null;
  pdf_asset_id: string | null;
  featured: number; // 0 or 1
  published: number; // 0 or 1
  display_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface TalkRecord {
  id: string;
  title: string;
  venue: string;
  date_string: string;
  year: number;
  featured: number; // 0 or 1
  published: number; // 0 or 1
  display_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface ExperienceRecord {
  id: string;
  role: string;
  organization: string;
  start_year: string;
  end_year: string;
  is_current: number; // 0 or 1
  published: number; // 0 or 1
  display_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface EducationRecord {
  id: string;
  degree: string;
  institution: string;
  year: string;
  thesis: string | null;
  published: number; // 0 or 1
  display_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface AwardRecord {
  id: string;
  title: string;
  organization: string;
  year: string;
  description: string | null;
  certificate_asset_id: string | null;
  published: number; // 0 or 1
  display_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface SkillCategoryRecord {
  id: string;
  category: string;
  skills_json: string; // stringified string[]
  published: number; // 0 or 1
  display_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface SocialLinkRecord {
  id: string;
  platform: string;
  url: string;
  icon: string;
  display_order: number;
  visible: number; // 0 or 1
  published: number; // 0 or 1
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface AssetRecord {
  id: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  byte_size: number;
  is_primary_photo: number; // 0 or 1
  created_at: string;
  metadata?: string | null;
}

export interface RevisionRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  action: 'create' | 'update' | 'delete' | 'import';
  payload_json: string;
  author: string;
  created_at: string;
}

export interface AuthenticatedUser {
  email: string;
  sub?: string;
  name?: string;
  rawJwt?: string;
}
