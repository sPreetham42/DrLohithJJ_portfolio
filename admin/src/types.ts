// ================================================================
// DR. LOHITH J.J. ADMIN DASHBOARD — TYPE DEFINITIONS
// Typed interfaces matching the Worker Admin API contracts
// ================================================================

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ProfileAdminRecord {
  id: 'profile';
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
  additional_roles_json: string; // serialized string[]
  professional_memberships_json: string; // serialized string[]
  version: number;
  updated_at: string;
  metadata?: string | null;
}

export interface ScholarStatsAdminRecord {
  id: 'scholarStats';
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

export interface PublicationAdminRecord {
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

export interface TalkAdminRecord {
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

export interface ExperienceAdminRecord {
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

export interface EducationAdminRecord {
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

export interface AwardAdminRecord {
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

export interface SkillCategoryAdminRecord {
  id: string;
  category: string;
  skills_json: string; // serialized string[]
  published: number; // 0 or 1
  display_order: number;
  version: number;
  created_at: string;
  updated_at: string;
  metadata?: string | null;
}

export interface SocialLinkAdminRecord {
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

export interface RevisionHistoryItem {
  id: string;
  entity_type: string;
  entity_id: string;
  version: number;
  action: 'create' | 'update' | 'delete' | 'import';
  payload_json: string;
  author: string;
  created_at: string;
}

export type AdminTab =
  | 'profile'
  | 'scholar'
  | 'publications'
  | 'talks'
  | 'experience'
  | 'education'
  | 'awards'
  | 'skills'
  | 'social'
  | 'assets';

export interface AuthUser {
  githubId: number;
  login: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthMeResponse {
  authenticated: boolean;
  user?: AuthUser;
  error?: {
    code: string;
    message: string;
  };
}
