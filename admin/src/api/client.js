// JavaScript export matching client.ts for Node test runner

export class ApiClientError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE = '/api/v1';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (res.status === 204) return {};

  let data = null;
  try {
    data = await res.json();
  } catch (err) {}

  if (!res.ok) {
    const code = data?.error?.code || `HTTP_${res.status}`;
    const message = data?.error?.message || `Request failed with status ${res.status}`;
    const details = data?.error?.details || null;
    throw new ApiClientError(res.status, code, message, details);
  }

  return data;
}

export const adminApi = {
  getProfile: () => request('/admin/profile'),
  updateProfile: (data, version) => request('/admin/profile', { method: 'PUT', body: JSON.stringify({ version, data }) }),
  getScholarStats: () => request('/admin/scholar-stats'),
  updateScholarStats: (data, version) => request('/admin/scholar-stats', { method: 'PUT', body: JSON.stringify({ version, data }) }),
  getPublications: () => request('/admin/publications'),
  getPublicationById: (id) => request(`/admin/publications/${encodeURIComponent(id)}`),
  createPublication: (data) => request('/admin/publications', { method: 'POST', body: JSON.stringify(data) }),
  updatePublication: (id, data, version) => request(`/admin/publications/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ version, data }) }),
  deletePublication: (id, version) => request(`/admin/publications/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' }),
  getTalks: () => request('/admin/talks'),
  getTalkById: (id) => request(`/admin/talks/${encodeURIComponent(id)}`),
  createTalk: (data) => request('/admin/talks', { method: 'POST', body: JSON.stringify(data) }),
  updateTalk: (id, data, version) => request(`/admin/talks/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ version, data }) }),
  deleteTalk: (id, version) => request(`/admin/talks/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' }),
  getExperience: () => request('/admin/experience'),
  getExperienceById: (id) => request(`/admin/experience/${encodeURIComponent(id)}`),
  createExperience: (data) => request('/admin/experience', { method: 'POST', body: JSON.stringify(data) }),
  updateExperience: (id, data, version) => request(`/admin/experience/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ version, data }) }),
  deleteExperience: (id, version) => request(`/admin/experience/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' }),
  getEducation: () => request('/admin/education'),
  getEducationById: (id) => request(`/admin/education/${encodeURIComponent(id)}`),
  createEducation: (data) => request('/admin/education', { method: 'POST', body: JSON.stringify(data) }),
  updateEducation: (id, data, version) => request(`/admin/education/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ version, data }) }),
  deleteEducation: (id, version) => request(`/admin/education/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' }),
  getAwards: () => request('/admin/awards'),
  getAwardById: (id) => request(`/admin/awards/${encodeURIComponent(id)}`),
  createAward: (data) => request('/admin/awards', { method: 'POST', body: JSON.stringify(data) }),
  updateAward: (id, data, version) => request(`/admin/awards/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ version, data }) }),
  deleteAward: (id, version) => request(`/admin/awards/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' }),
  getSkills: () => request('/admin/skills'),
  getSkillById: (id) => request(`/admin/skills/${encodeURIComponent(id)}`),
  createSkill: (data) => request('/admin/skills', { method: 'POST', body: JSON.stringify(data) }),
  updateSkill: (id, data, version) => request(`/admin/skills/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ version, data }) }),
  deleteSkill: (id, version) => request(`/admin/skills/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' }),
  getSocialLinks: () => request('/admin/social-links'),
  getSocialLinkById: (id) => request(`/admin/social-links/${encodeURIComponent(id)}`),
  createSocialLink: (data) => request('/admin/social-links', { method: 'POST', body: JSON.stringify(data) }),
  updateSocialLink: (id, data, version) => request(`/admin/social-links/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ version, data }) }),
  deleteSocialLink: (id, version) => request(`/admin/social-links/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' }),
  getPresignedUrl: (filename, mimeType) => request('/admin/assets/presigned-url', { method: 'POST', body: JSON.stringify({ filename, mimeType }) })
};
