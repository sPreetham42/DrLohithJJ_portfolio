// ================================================================
// SANITY DATA LOADER & DOM RENDERER
// Concurrently fetches dynamic content and populates existing UI containers.
// Preserves existing HTML structure, CSS classes, and animation observers.
// ================================================================

import { sanityFetch } from './client.js';
import * as Q from './queries.js';

export async function initSanityData() {
  // Use Promise.allSettled so a failure in one section does not crash other sections
  const results = await Promise.allSettled([
    loadProfile(),
    loadExperience(),
    loadEducation(),
    loadPublications(),
    loadTalks(),
    loadAwards(),
    loadSkills(),
    loadScholarStats(),
  ]);

  // Re-observe newly injected DOM elements for scroll-reveal animations
  if (window.refreshScrollReveal) {
    window.refreshScrollReveal();
  }
}

// ----------------------------------------------------------------
// 1. PROFILE & HERO
// ----------------------------------------------------------------
async function loadProfile() {
  try {
    const data = await sanityFetch(Q.PROFILE_QUERY);
    if (!data) return;

    if (data.name) {
      document.querySelectorAll('.hero-name-text').forEach(el => el.textContent = data.name);
    }
    if (data.credential) {
      document.querySelectorAll('.hero-credential').forEach(el => el.textContent = data.credential);
    }
    if (data.designation) {
      document.querySelectorAll('.hero-eyebrow').forEach(el => el.textContent = data.designation);
    }
    if (data.heroDescriptionLine1) {
      const line1 = document.querySelector('.hero-desc-1');
      if (line1) line1.innerHTML = data.heroDescriptionLine1;
    }
    if (data.heroDescriptionLine2) {
      const line2 = document.querySelector('.hero-desc-2');
      if (line2) line2.innerHTML = data.heroDescriptionLine2;
    }
    if (data.photoUrl) {
      const img = document.querySelector('.hero-photo-frame img');
      if (img) img.src = data.photoUrl;
    }
  } catch (err) {
    console.warn('[Sanity Profile] Using static fallback:', err.message);
  }
}

// ----------------------------------------------------------------
// 2. EXPERIENCE TIMELINE
// ----------------------------------------------------------------
async function loadExperience() {
  const container = document.getElementById('experience-timeline');
  if (!container) return;

  try {
    const items = await sanityFetch(Q.EXPERIENCE_QUERY);
    if (!items || items.length === 0) return;

    container.innerHTML = items.map(item => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-year">${escapeHtml(item.startYear || '')} — ${escapeHtml(item.endYear || (item.isCurrent ? 'Present' : ''))}</div>
        <div class="timeline-role">${escapeHtml(item.role || '')}</div>
        <div class="timeline-org">${escapeHtml(item.organization || '')}</div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('[Sanity Experience] Using static fallback:', err.message);
  }
}

// ----------------------------------------------------------------
// 3. EDUCATION
// ----------------------------------------------------------------
async function loadEducation() {
  const container = document.getElementById('education-list');
  if (!container) return;

  try {
    const items = await sanityFetch(Q.EDUCATION_QUERY);
    if (!items || items.length === 0) return;

    container.innerHTML = items.map(item => `
      <div class="edu-card">
        <div class="edu-degree">${escapeHtml(item.degree || '')}</div>
        <div class="edu-institution">${escapeHtml(item.institution || '')}</div>
        <div class="edu-year">${escapeHtml(item.year || '')}</div>
        ${item.thesis ? `<div class="edu-thesis">${escapeHtml(item.thesis)}</div>` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.warn('[Sanity Education] Using static fallback:', err.message);
  }
}

// ----------------------------------------------------------------
// 4. PUBLICATIONS (SCIE Journals & IEEE Conferences)
// ----------------------------------------------------------------
async function loadPublications() {
  const journalsContainer = document.getElementById('journals-list');
  const conferencesContainer = document.getElementById('conferences-list');
  if (!journalsContainer && !conferencesContainer) return;

  try {
    const items = await sanityFetch(Q.PUBLICATIONS_QUERY);
    if (!items || items.length === 0) return;

    const journals = items.filter(p => p.publicationType === 'journal' || p.publicationType === 'book');
    const conferences = items.filter(p => p.publicationType === 'conference');

    if (journalsContainer && journals.length > 0) {
      journalsContainer.innerHTML = journals.map((p, idx) => renderPubCard(p, p.codeNumber || `J${idx + 1}`)).join('');
    }

    if (conferencesContainer && conferences.length > 0) {
      conferencesContainer.innerHTML = conferences.map((p, idx) => renderPubCard(p, p.codeNumber || `C${idx + 1}`)).join('');
    }
  } catch (err) {
    console.warn('[Sanity Publications] Using static fallback:', err.message);
  }
}

function renderPubCard(p, codeNum) {
  const pdfLinkHtml = p.pdfUrl ? `<a href="${p.pdfUrl}" target="_blank" rel="noopener" class="pub-doi" style="margin-left:0.75rem;">PDF 📄</a>` : '';
  const doiLinkHtml = p.doi ? `<a href="${p.doi.startsWith('http') ? p.doi : 'https://doi.org/' + p.doi}" target="_blank" rel="noopener" class="pub-doi">DOI ↗</a>` : '';
  
  return `
    <div class="pub-card">
      <span class="pub-number">${escapeHtml(codeNum)}</span>
      <div class="pub-title">${escapeHtml(p.title || '')}</div>
      <div class="pub-authors">${escapeHtml(p.authors || '')}</div>
      <div class="pub-venue">
        ${escapeHtml(p.venue || '')} ${p.year ? `(${p.year})` : ''}
        ${doiLinkHtml}
        ${pdfLinkHtml}
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------
// 5. INVITED TALKS & WORKSHOPS
// ----------------------------------------------------------------
async function loadTalks() {
  const featuredContainer = document.getElementById('talks-featured');
  const moreContainer = document.getElementById('talks-more');
  if (!featuredContainer) return;

  try {
    const items = await sanityFetch(Q.TALKS_QUERY);
    if (!items || items.length === 0) return;

    const featured = items.filter(t => t.featured !== false).slice(0, 8);
    const more = items.slice(8);

    featuredContainer.innerHTML = featured.map(renderTalkCard).join('');
    if (moreContainer && more.length > 0) {
      moreContainer.innerHTML = more.map(renderTalkCard).join('');
    }

    // Populate Year Filter dropdown dynamically
    const years = [...new Set(items.map(t => t.year).filter(Boolean))].sort((a, b) => b - a);
    const filterSelect = document.getElementById('talk-year-filter');
    if (filterSelect) {
      filterSelect.innerHTML = `<option value="all">All Years</option>` +
        years.map(y => `<option value="${y}">${y}</option>`).join('');
    }
  } catch (err) {
    console.warn('[Sanity Talks] Using static fallback:', err.message);
  }
}

function renderTalkCard(t) {
  return `
    <div class="talk-card" data-year="${t.year || ''}">
      <div class="talk-topic">"${escapeHtml(t.title || '')}"</div>
      <div class="talk-venue">${escapeHtml(t.venue || '')}</div>
      <div class="talk-date">${escapeHtml(t.dateString || '')}</div>
    </div>
  `;
}

// ----------------------------------------------------------------
// 6. ACHIEVEMENTS & AWARDS
// ----------------------------------------------------------------
async function loadAwards() {
  const container = document.getElementById('achievements-grid');
  if (!container) return;

  try {
    const items = await sanityFetch(Q.AWARDS_QUERY);
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
  } catch (err) {
    console.warn('[Sanity Awards] Using static fallback:', err.message);
  }
}

// ----------------------------------------------------------------
// 7. TECHNICAL SKILLS
// ----------------------------------------------------------------
async function loadSkills() {
  const container = document.getElementById('skills-layout');
  if (!container) return;

  try {
    const categories = await sanityFetch(Q.SKILLS_QUERY);
    if (!categories || categories.length === 0) return;

    container.innerHTML = categories.map(c => `
      <div class="skill-category">
        <h3>${escapeHtml(c.category || '')}</h3>
        <div class="skill-tags">
          ${(c.skills || []).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.warn('[Sanity Skills] Using static fallback:', err.message);
  }
}

// ----------------------------------------------------------------
// 8. SCHOLAR STATS
// ----------------------------------------------------------------
async function loadScholarStats() {
  try {
    const stats = await sanityFetch(Q.SCHOLAR_STATS_QUERY);
    if (!stats) return;

    if (stats.citations && stats.citations > 0) {
      document.querySelectorAll('.stat-citations').forEach(el => el.textContent = `${stats.citations}+`);
    }
    if (stats.hIndex && stats.hIndex > 0) {
      document.querySelectorAll('.stat-hindex').forEach(el => el.textContent = stats.hIndex);
    }
    if (stats.sciePapersCount && stats.sciePapersCount > 0) {
      document.querySelectorAll('.stat-papers').forEach(el => el.textContent = stats.sciePapersCount);
    }
  } catch (err) {
    console.warn('[Sanity Scholar Stats] Using local fallback:', err.message);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
