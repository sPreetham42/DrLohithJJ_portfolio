// ================================================================
// DR. LOHITH J.J. ACADEMIC PORTFOLIO — PUBLIC DATA ADAPTER
// Dual-source, reversible data hydration engine:
// 1. Attempts fast retrieval from Cloudflare Worker Public API (D1 backed).
// 2. Automatically falls back to canonical static data if offline / timeout / error.
// ================================================================

import { publicApi } from './public-api.js';
import { fallbackData } from './fallback.js';
import { setTalksData } from '../talks.js';
import { setResearchExplorerData } from '../research-explorer.js';
import { updateTalksMarquee } from '../talks-marquee.js';

export function getDataSourceMode() {
  if (typeof window !== 'undefined' && window.PORTFOLIO_CONFIG?.dataSource) {
    return window.PORTFOLIO_CONFIG.dataSource; // 'api' | 'fallback'
  }
  return 'api';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sanitizeControlledHtml(htmlStr) {
  if (!htmlStr) return '';
  // Strip script tags, event handlers, and javascript: protocols while preserving safe formatting tags (strong, em, span, b, i)
  return String(htmlStr)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/on\w+\s*=\s*[^>\s]+/gi, '')
    .replace(/javascript:/gi, '');
}

export const publicDataAdapter = {
  async getProfile() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchProfile();
      if (data) return data;
    }
    return fallbackData.profile;
  },

  async getScholarStats() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchScholarStats();
      if (data) return data;
    }
    return fallbackData.scholarStats;
  },

  async getPublications() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchPublications();
      if (data) return data;
    }
    return fallbackData.publications;
  },

  async getTalks(year) {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchTalks(year);
      if (data) return data;
    }
    if (year) {
      return fallbackData.talks.filter(t => String(t.year) === String(year));
    }
    return fallbackData.talks;
  },

  async getExperience() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchExperience();
      if (data) return data;
    }
    return fallbackData.experience;
  },

  async getEducation() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchEducation();
      if (data) return data;
    }
    return fallbackData.education;
  },

  async getAwards() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchAwards();
      if (data) return data;
    }
    return fallbackData.awards;
  },

  async getSkills() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchSkills();
      if (data) return data;
    }
    return fallbackData.skills;
  },

  async getSocialLinks() {
    if (getDataSourceMode() === 'api') {
      const data = await publicApi.fetchSocialLinks();
      if (data) return data;
    }
    return fallbackData.socialLinks;
  }
};

// ================================================================
// DOM HYDRATION ENGINE
// Smoothly hydrates pre-rendered HTML without layout shifts or flash
// ================================================================
export async function initPublicDataAdapter() {
  try {
    const results = await Promise.allSettled([
      hydrateProfile(),
      hydrateScholarStats(),
      hydratePublications(),
      hydrateTalks(),
      hydrateExperience(),
      hydrateEducation(),
      hydrateAwards(),
      hydrateSkills(),
      hydrateSocialLinks()
    ]);

    if (window.refreshScrollReveal) {
      window.refreshScrollReveal();
    }
    return results;
  } catch (err) {
    console.warn('[Public Adapter] Hydration encounter:', err.message);
  }
}

// 1. Profile Hydration
async function hydrateProfile() {
  const data = await publicDataAdapter.getProfile();
  if (!data) return;

  if (data.name) {
    document.querySelectorAll('.hero-name-text').forEach(el => el.textContent = data.name);
  }
  if (data.credential) {
    document.querySelectorAll('.hero-credential').forEach(el => {
      // Support structured credential spans (.credential-mark, .credential-phd, .credential-inst)
      const markSpan = el.querySelector('.credential-mark, .credential-phd');
      const instSpan = el.querySelector('.credential-inst');
      if (markSpan && instSpan) {
        let markText = 'Ph.D.';
        let instText = 'National Institute of Technology, Tiruchirappalli';

        if (data.credential.includes('·')) {
          const parts = data.credential.split('·');
          markText = parts[0].trim();
          instText = parts[1].trim();
        } else if (data.credential.includes('—')) {
          const parts = data.credential.split('—');
          markText = parts[0].trim();
          instText = parts[1].trim();
        }

        if (instText.includes('NIT') && !instText.includes('National Institute')) {
          instText = 'National Institute of Technology, Tiruchirappalli';
        }

        markSpan.textContent = markText;
        instSpan.textContent = instText;
      } else {
        el.textContent = data.credential;
      }
    });
  }
  if (data.designation) {
    document.querySelectorAll('.hero-eyebrow').forEach(el => {
      const instSpan = el.querySelector('.hero-institution');
      const instText = data.currentInstitution || (instSpan ? instSpan.textContent.trim() : 'Nagarjuna College of Engineering & Technology, Bengaluru');
      el.innerHTML = `${sanitizeControlledHtml(data.designation)} <span class="hero-institution">${escapeHtml(instText)}</span>`;
    });
  }
  if (data.heroDescriptionLine1 && !data.heroDescriptionLine1.includes('Welcome to my portfolio')) {
    const line1 = document.querySelector('.hero-desc-1');
    if (line1) line1.innerHTML = sanitizeControlledHtml(data.heroDescriptionLine1);
  }
  if (data.heroDescriptionLine2 && !data.heroDescriptionLine2.includes('Researching Blockchain and Security')) {
    const line2 = document.querySelector('.hero-desc-2');
    if (line2) line2.innerHTML = sanitizeControlledHtml(data.heroDescriptionLine2);
  }
  if (data.photoUrl) {
    const img = document.querySelector('.hero-photo-frame img');
    if (img) img.src = data.photoUrl;
  }

  // Contact & Office Location Hydration
  if (data.emailPrimary) {
    document.querySelectorAll('.contact-email-primary').forEach(el => {
      el.textContent = data.emailPrimary;
      if (el.tagName === 'A') el.href = `mailto:${data.emailPrimary}`;
    });
  }

  if (data.emailSecondary) {
    document.querySelectorAll('.contact-email-secondary').forEach(el => {
      el.textContent = data.emailSecondary;
      if (el.tagName === 'A') el.href = `mailto:${data.emailSecondary}`;
    });
    document.querySelectorAll('.contact-item-secondary').forEach(el => {
      el.style.display = '';
    });
  } else if (data.emailSecondary === null || data.emailSecondary === '') {
    document.querySelectorAll('.contact-item-secondary').forEach(el => {
      el.style.display = 'none';
    });
  }

  if (data.phone) {
    document.querySelectorAll('.contact-phone').forEach(el => {
      el.textContent = data.phone;
      if (el.tagName === 'A') el.href = `tel:${data.phone.replace(/[^+\d]/g, '')}`;
    });
    document.querySelectorAll('.contact-item-phone').forEach(el => {
      el.style.display = '';
    });
  }

  if (data.address) {
    document.querySelectorAll('.contact-location-address').forEach(el => {
      el.textContent = data.address;
    });
  }

  if (data.yearsExperience) {
    document.querySelectorAll('.stat-experience').forEach(el => {
      el.textContent = `${data.yearsExperience}`;
      el.setAttribute('data-count', data.yearsExperience);
    });
  }
}

// 2. Scholar Stats Hydration
async function hydrateScholarStats() {
  const stats = await publicDataAdapter.getScholarStats();
  if (!stats) return;

  if (stats.citations && stats.citations > 0) {
    document.querySelectorAll('.stat-citations, #scholar-citations').forEach(el => {
      el.textContent = `${stats.citations}`;
      el.setAttribute('data-count', stats.citations);
    });
  }
  if (stats.hIndex && stats.hIndex > 0) {
    document.querySelectorAll('.stat-hindex, #scholar-hindex').forEach(el => {
      el.textContent = stats.hIndex;
      el.setAttribute('data-count', stats.hIndex);
    });
  }
  if (stats.i10Index && stats.i10Index > 0) {
    document.querySelectorAll('.stat-i10index, #scholar-i10index').forEach(el => {
      el.textContent = stats.i10Index;
      el.setAttribute('data-count', stats.i10Index);
    });
  }
  if (stats.sciePapersCount && stats.sciePapersCount > 0) {
    document.querySelectorAll('.stat-papers, #scholar-scie').forEach(el => {
      el.textContent = stats.sciePapersCount;
      el.setAttribute('data-count', stats.sciePapersCount);
    });
  }
  if (stats.ieeeConferencesCount && stats.ieeeConferencesCount > 0) {
    document.querySelectorAll('.stat-ieee, #scholar-ieee').forEach(el => {
      el.textContent = stats.ieeeConferencesCount;
      el.setAttribute('data-count', stats.ieeeConferencesCount);
    });
  }
}

// 3. Publications Hydration
async function hydratePublications() {
  const items = await publicDataAdapter.getPublications();
  if (!items || items.length === 0) return;

  const journalsContainer = document.getElementById('journals-list');
  const conferencesContainer = document.getElementById('conferences-list');

  const journals = items.filter(p => p.publicationType === 'journal' || p.publicationType === 'book');
  const conferences = items.filter(p => p.publicationType === 'conference');

  if (journalsContainer && journals.length > 0) {
    journalsContainer.innerHTML = journals.map((p, idx) => renderPubCard(p, p.codeNumber || `J${idx + 1}`)).join('');
  }

  if (conferencesContainer && conferences.length > 0) {
    conferencesContainer.innerHTML = conferences.map((p, idx) => renderPubCard(p, p.codeNumber || `C${idx + 1}`)).join('');
  }

  if (typeof setResearchExplorerData === 'function') {
    setResearchExplorerData({ publications: items });
  }
}

function renderPubCard(p, codeNum) {
  const paperUrl = p.externalUrl || (p.doi ? (p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`) : null);
  const pdfLinkHtml = p.pdfAssetId ? `<a href="${escapeHtml(p.pdfAssetId)}" target="_blank" rel="noopener noreferrer" class="pub-doi" style="margin-left:0.75rem;">PDF 📄</a>` : '';
  const doiLinkHtml = p.doi ? `<a href="${escapeHtml(p.doi.startsWith('http') ? p.doi : 'https://doi.org/' + p.doi)}" target="_blank" rel="noopener noreferrer" class="pub-doi">DOI ↗</a>` : '';

  const titleHtml = paperUrl
    ? `<a href="${escapeHtml(paperUrl)}" target="_blank" rel="noopener noreferrer" class="pub-title-link"><div class="pub-title">${escapeHtml(p.title || '')} <span class="pub-link-icon">↗</span></div></a>`
    : `<div class="pub-title">${escapeHtml(p.title || '')}</div>`;

  return `
    <div class="pub-card${paperUrl ? ' pub-card--clickable' : ''}">
      <span class="pub-number">${escapeHtml(codeNum)}</span>
      ${titleHtml}
      <div class="pub-authors">${escapeHtml(p.authors || '')}</div>
      <div class="pub-venue">
        ${escapeHtml(p.venue || '')} ${p.year ? `(${p.year})` : ''}
        ${doiLinkHtml}
        ${pdfLinkHtml}
      </div>
    </div>
  `;
}

// 4. Talks Hydration
async function hydrateTalks() {
  const talks = await publicDataAdapter.getTalks();
  if (talks && talks.length > 0) {
    const talkCount = talks.length >= 60 ? talks.length : 60;
    document.querySelectorAll('.stat-talks').forEach(el => {
      el.textContent = `${talkCount}`;
      el.setAttribute('data-count', talkCount);
    });
    if (typeof setTalksData === 'function') {
      setTalksData(talks);
    }
    if (typeof setResearchExplorerData === 'function') {
      setResearchExplorerData({ talks });
    }
    if (typeof updateTalksMarquee === 'function') {
      updateTalksMarquee(talks);
    }
  }
}

// 5. Experience Hydration
async function hydrateExperience() {
  const container = document.getElementById('experience-timeline');
  if (!container) return;

  const items = await publicDataAdapter.getExperience();
  if (!items || items.length === 0) return;

  container.innerHTML = items.map(item => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-year">${escapeHtml(item.startYear || '')} — ${escapeHtml(item.endYear || (item.isCurrent ? 'Present' : ''))}</div>
      <div class="timeline-role">${escapeHtml(item.role || '')}</div>
      <div class="timeline-org">${escapeHtml(item.organization || '')}</div>
    </div>
  `).join('');
}

// 6. Education Hydration
async function hydrateEducation() {
  const container = document.getElementById('education-list');
  if (!container) return;

  const items = await publicDataAdapter.getEducation();
  if (!items || items.length === 0) return;

  container.innerHTML = items.map(item => `
    <div class="edu-card">
      <div class="edu-degree">${escapeHtml(item.degree || '')}</div>
      <div class="edu-institution">${escapeHtml(item.institution || '')}</div>
      <div class="edu-year">${escapeHtml(item.year || '')}</div>
      ${item.thesis ? `<div class="edu-thesis">${escapeHtml(item.thesis)}</div>` : ''}
    </div>
  `).join('');
}

// 7. Awards Hydration
async function hydrateAwards() {
  const container = document.getElementById('achievements-grid');
  if (!container) return;

  const items = await publicDataAdapter.getAwards();
  if (!items || items.length === 0) return;

  container.innerHTML = items.map(a => `
    <div class="achievement-card">
      <div class="achievement-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <div class="achievement-text">
        <h4>${escapeHtml(a.title || '')}</h4>
        <p>${escapeHtml(a.organization || '')} ${a.year ? `(${a.year})` : ''}</p>
        ${a.certificateUrl ? `<a href="${a.certificateUrl}" target="_blank" rel="noopener" class="pub-doi" style="display:inline-block;margin-top:4px;">View Certificate ↗</a>` : ''}
      </div>
    </div>
  `).join('');
}

// 8. Skills Hydration
async function hydrateSkills() {
  const container = document.getElementById('skills-layout') || document.getElementById('skills-grid');
  if (!container) return;

  const categories = await publicDataAdapter.getSkills();
  if (!categories || categories.length === 0) return;

  container.innerHTML = categories.map(c => `
    <div class="skill-category">
      <h3>${escapeHtml(c.category || '')}</h3>
      <div class="skill-tags">
        ${(c.skills || []).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// 9. Social Links Hydration
async function hydrateSocialLinks() {
  const links = await publicDataAdapter.getSocialLinks();
  if (!links || links.length === 0) return;

  const container = document.querySelector('.hero-social-links');
  if (!container) return;

  let visibleLinks = links.filter(l => l.published !== false && l.visible !== false);
  if (visibleLinks.length === 0) return;

  // Guarantee canonical Email (soc-8) and YouTube (soc-9) are present
  const hasEmail = visibleLinks.some(l => (l.platform && l.platform.toLowerCase().includes('email')) || (l.url && l.url.startsWith('mailto:')));
  if (!hasEmail) {
    visibleLinks.push({
      id: 'soc-8',
      platform: 'Email',
      url: 'mailto:lohithjj@gmail.com',
      icon: 'gmail.svg',
      order: 8
    });
  }

  const hasYouTube = visibleLinks.some(l => (l.platform && l.platform.toLowerCase().includes('youtube')) || (l.url && l.url.includes('youtube.com')));
  if (!hasYouTube) {
    visibleLinks.push({
      id: 'soc-9',
      platform: 'YouTube',
      url: 'https://www.youtube.com/@shreyajj',
      icon: 'youtube.svg',
      order: 9
    });
  }

  // Sort by display order
  visibleLinks.sort((a, b) => (a.order ?? a.display_order ?? 0) - (b.order ?? b.display_order ?? 0));

  container.innerHTML = visibleLinks.map(l => {
    let rawIcon = l.icon || '';
    if (l.platform && l.platform.toLowerCase().includes('email') && (!rawIcon || rawIcon.includes('gmail'))) rawIcon = 'gmail.svg';
    if (l.platform && l.platform.toLowerCase().includes('youtube') && (!rawIcon || rawIcon.includes('youtube'))) rawIcon = 'youtube.svg';
    const iconSrc = rawIcon ? (rawIcon.startsWith('assets/') ? rawIcon : `assets/${rawIcon}`) : 'assets/gmail.svg';

    const tooltip = escapeHtml(l.platform || '');
    const isEmail = l.url && l.url.startsWith('mailto:');
    const targetAttr = isEmail ? '' : ' target="_blank" rel="noopener noreferrer"';
    return `
      <a href="${escapeHtml(l.url || '#')}" class="hero-social-link"${targetAttr}
        aria-label="${tooltip}" title="${tooltip}" data-tooltip="${tooltip}">
        <img src="${escapeHtml(iconSrc)}" alt="${tooltip}" />
      </a>
    `;
  }).join('');
}

