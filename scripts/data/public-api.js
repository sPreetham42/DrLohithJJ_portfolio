// ================================================================
// DR. LOHITH J.J. ACADEMIC PORTFOLIO — PUBLIC WORKER API CLIENT
// Lightweight, zero-dependency, resilient fetch client for GET /api/v1/public/*
// ================================================================

const isLocalDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]'
);

const DEFAULT_API_BASE = isLocalDev && window.location.port !== '8787'
  ? 'http://127.0.0.1:8787/api/v1/public'
  : '/api/v1/public';

const TIMEOUT_MS = 3000;

export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.PORTFOLIO_CONFIG?.apiBaseUrl) {
    return window.PORTFOLIO_CONFIG.apiBaseUrl;
  }
  return DEFAULT_API_BASE;
}

async function fetchWithTimeout(endpoint, validator) {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Public API] Endpoint ${endpoint} returned HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (validator && !validator(data)) {
      console.warn(`[Public API] Endpoint ${endpoint} returned malformed data schema`);
      return null;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[Public API] Endpoint ${endpoint} timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.warn(`[Public API] Fetch failed for ${endpoint}:`, err.message);
    }
    return null;
  }
}

// ----------------------------------------------------------------
// VALIDATORS (Lightweight runtime verification)
// ----------------------------------------------------------------
function isValidProfile(data) {
  return data && typeof data.name === 'string' && typeof data.designation === 'string';
}

function isValidScholarStats(data) {
  return data && typeof data.citations === 'number' && typeof data.hIndex === 'number';
}

function isValidArray(data) {
  return Array.isArray(data);
}

// ----------------------------------------------------------------
// PUBLIC API METHODS
// ----------------------------------------------------------------
export const publicApi = {
  fetchProfile: () => fetchWithTimeout('/profile', isValidProfile),
  fetchScholarStats: () => fetchWithTimeout('/scholar-stats', isValidScholarStats),
  fetchPublications: () => fetchWithTimeout('/publications', isValidArray),
  fetchTalks: (year) => fetchWithTimeout(year ? `/talks?year=${encodeURIComponent(year)}` : '/talks', isValidArray),
  fetchExperience: () => fetchWithTimeout('/experience', isValidArray),
  fetchEducation: () => fetchWithTimeout('/education', isValidArray),
  fetchAwards: () => fetchWithTimeout('/awards', isValidArray),
  fetchSkills: () => fetchWithTimeout('/skills', isValidArray),
  fetchSocialLinks: () => fetchWithTimeout('/social-links', isValidArray),
  fetchPatents: () => fetchWithTimeout('/patents', isValidArray),
  fetchResearchScholars: () => fetchWithTimeout('/research-scholars', isValidArray)
};
