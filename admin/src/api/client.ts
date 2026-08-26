// ================================================================
// CENTRALIZED TYPED API CLIENT FOR CLOUDFLARE WORKER ADMIN API
// ================================================================

import {
  ProfileAdminRecord,
  ScholarStatsAdminRecord,
  PublicationAdminRecord,
  TalkAdminRecord,
  ExperienceAdminRecord,
  EducationAdminRecord,
  AwardAdminRecord,
  SkillCategoryAdminRecord,
  SocialLinkAdminRecord,
  PatentAdminRecord,
  ResearchScholarAdminRecord,
  RevisionHistoryItem,
  AuthMeResponse
} from '../types';

export class ApiClientError extends Error {
  public status: number;
  public code: string;
  public details: any;

  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type AuthExpiryListener = () => void;
const authExpiryListeners: Set<AuthExpiryListener> = new Set();

export function onAuthExpired(listener: AuthExpiryListener): () => void {
  authExpiryListeners.add(listener);
  return () => authExpiryListeners.delete(listener);
}

function notifyAuthExpired() {
  authExpiryListeners.forEach(listener => {
    try {
      listener();
    } catch (err) {
      console.error('[AUTH_EXPIRY_LISTENER]', err);
    }
  });
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api/v1';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  const method = (options.method || 'GET').toUpperCase();

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Set CSRF protection header for state-changing admin requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    headers.set('X-Admin-Request', '1');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Sends __Host-admin_session HttpOnly cookie
  });

  if (res.status === 204) {
    return {} as T;
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch (err) {
    // Non-JSON response
  }

  if (!res.ok) {
    if (res.status === 401 && path !== '/auth/me') {
      notifyAuthExpired();
    }
    const code = data?.error?.code || `HTTP_${res.status}`;
    const message = data?.error?.message || `Request failed with status ${res.status}`;
    const details = data?.error?.details || null;
    throw new ApiClientError(res.status, code, message, details);
  }

  return data as T;
}

export const adminApi = {
  // 1. Profile (Singleton)
  getProfile: () => request<ProfileAdminRecord>('/admin/profile'),
  updateProfile: (data: any, version: number) =>
    request<ProfileAdminRecord>('/admin/profile', {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),

  // 2. Scholar Stats (Singleton)
  getScholarStats: () => request<ScholarStatsAdminRecord>('/admin/scholar-stats'),
  updateScholarStats: (data: any, version: number) =>
    request<ScholarStatsAdminRecord>('/admin/scholar-stats', {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),

  // 3. Publications
  getPublications: () => request<PublicationAdminRecord[]>('/admin/publications'),
  getPublicationById: (id: string) => request<PublicationAdminRecord>(`/admin/publications/${encodeURIComponent(id)}`),
  createPublication: (data: any) =>
    request<PublicationAdminRecord>('/admin/publications', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePublication: (id: string, data: any, version: number) =>
    request<PublicationAdminRecord>(`/admin/publications/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deletePublication: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/publications/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // 4. Talks
  getTalks: () => request<TalkAdminRecord[]>('/admin/talks'),
  getTalkById: (id: string) => request<TalkAdminRecord>(`/admin/talks/${encodeURIComponent(id)}`),
  createTalk: (data: any) =>
    request<TalkAdminRecord>('/admin/talks', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTalk: (id: string, data: any, version: number) =>
    request<TalkAdminRecord>(`/admin/talks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deleteTalk: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/talks/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // 5. Experience
  getExperience: () => request<ExperienceAdminRecord[]>('/admin/experience'),
  getExperienceById: (id: string) => request<ExperienceAdminRecord>(`/admin/experience/${encodeURIComponent(id)}`),
  createExperience: (data: any) =>
    request<ExperienceAdminRecord>('/admin/experience', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateExperience: (id: string, data: any, version: number) =>
    request<ExperienceAdminRecord>(`/admin/experience/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deleteExperience: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/experience/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // 6. Education
  getEducation: () => request<EducationAdminRecord[]>('/admin/education'),
  getEducationById: (id: string) => request<EducationAdminRecord>(`/admin/education/${encodeURIComponent(id)}`),
  createEducation: (data: any) =>
    request<EducationAdminRecord>('/admin/education', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateEducation: (id: string, data: any, version: number) =>
    request<EducationAdminRecord>(`/admin/education/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deleteEducation: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/education/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // 7. Awards
  getAwards: () => request<AwardAdminRecord[]>('/admin/awards'),
  getAwardById: (id: string) => request<AwardAdminRecord>(`/admin/awards/${encodeURIComponent(id)}`),
  createAward: (data: any) =>
    request<AwardAdminRecord>('/admin/awards', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAward: (id: string, data: any, version: number) =>
    request<AwardAdminRecord>(`/admin/awards/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deleteAward: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/awards/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // 8. Skill Categories
  getSkills: () => request<SkillCategoryAdminRecord[]>('/admin/skills'),
  getSkillById: (id: string) => request<SkillCategoryAdminRecord>(`/admin/skills/${encodeURIComponent(id)}`),
  createSkill: (data: any) =>
    request<SkillCategoryAdminRecord>('/admin/skills', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateSkill: (id: string, data: any, version: number) =>
    request<SkillCategoryAdminRecord>(`/admin/skills/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deleteSkill: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/skills/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // 9. Social Links
  getSocialLinks: () => request<SocialLinkAdminRecord[]>('/admin/social-links'),
  getSocialLinkById: (id: string) => request<SocialLinkAdminRecord>(`/admin/social-links/${encodeURIComponent(id)}`),
  createSocialLink: (data: any) =>
    request<SocialLinkAdminRecord>('/admin/social-links', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateSocialLink: (id: string, data: any, version: number) =>
    request<SocialLinkAdminRecord>(`/admin/social-links/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deleteSocialLink: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/social-links/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // Patents
  getPatents: () => request<PatentAdminRecord[]>('/admin/patents'),
  getPatentById: (id: string) => request<PatentAdminRecord>(`/admin/patents/${encodeURIComponent(id)}`),
  createPatent: (data: any) =>
    request<PatentAdminRecord>('/admin/patents', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePatent: (id: string, data: any, version: number) =>
    request<PatentAdminRecord>(`/admin/patents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deletePatent: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/patents/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // Research Scholars
  getResearchScholars: () => request<ResearchScholarAdminRecord[]>('/admin/research-scholars'),
  getResearchScholarById: (id: string) => request<ResearchScholarAdminRecord>(`/admin/research-scholars/${encodeURIComponent(id)}`),
  createResearchScholar: (data: any) =>
    request<ResearchScholarAdminRecord>('/admin/research-scholars', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateResearchScholar: (id: string, data: any, version: number) =>
    request<ResearchScholarAdminRecord>(`/admin/research-scholars/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ version, data })
    }),
  deleteResearchScholar: (id: string, version: number) =>
    request<{ success: boolean; deletedId: string }>(
      `/admin/research-scholars/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' }
    ),

  // 10. Assets Presign & Direct R2 Upload Flow
  getPresignedUrl: (filename: string, mimeType: string) =>
    request<{ uploadKey: string; mimeType: string; uploadUrl: string; expiresInSeconds: number }>(
      '/admin/assets/presigned-url',
      {
        method: 'POST',
        body: JSON.stringify({ filename, mimeType })
      }
    )
};

export const authApi = {
  getMe: () => request<AuthMeResponse>('/auth/me'),
  logout: () => request<{ success: boolean; message: string }>('/auth/logout', { method: 'POST' })
};
