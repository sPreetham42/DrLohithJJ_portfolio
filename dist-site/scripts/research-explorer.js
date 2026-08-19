// ================================================================
// INTERACTIVE RESEARCH EXPLORER CONTROLLER
// Normalization layer, multi-domain filtering, live statistics,
// and synchronized URL state management.
// ================================================================

import { DEFAULT_TALKS } from './talks.js';
import { getPaperUrl } from './sanity/loader.js';

export const RESEARCH_AREAS = [
  {
    id: 'all',
    title: 'All Research Areas',
    shortTitle: 'All Areas',
    badge: 'Comprehensive',
    icon: '🌐',
    description: 'Explore Dr. Lohith’s complete scholarly portfolio spanning blockchain security, artificial intelligence, IoT communications, and cryptographic systems.',
    keywords: []
  },
  {
    id: 'blockchain',
    title: 'Blockchain Technology',
    shortTitle: 'Blockchain',
    badge: 'Primary Domain',
    icon: '🔗',
    description: 'Architectural frameworks for decentralized ledgers, Ethereum ecosystem, consensus protocols, and enterprise distributed applications.',
    keywords: [
      'blockchain', 'distributed ledger', 'dlt', 'ethereum', 'cryptocurrency',
      'smart contract', 'consensus', 'defi', 'web3', 'bsct', 'crops',
      'agricultural supply chain', 'supply chain'
    ]
  },
  {
    id: 'smart-contracts',
    title: 'Smart Contract Security',
    shortTitle: 'Smart Contracts',
    badge: 'Doctoral Focus',
    icon: '🛡️',
    description: 'Doctoral research from NIT Tiruchirappalli: automated vulnerability detection, Oyente static analysis extensions, TP-Detect bytecode imaging, and digital forensic frameworks.',
    keywords: [
      'smart contract', 'smart contracts', 'vulnerability', 'vulnerabilities',
      'oyente', 'tp-detect', 'trigram-pixel', 'forensic', 'security analysis',
      'solidity', 'deploying smart contracts', 'writing smart contracts'
    ]
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity & Digital Forensics',
    shortTitle: 'Cybersecurity',
    badge: 'Applied Security',
    icon: '🔒',
    description: 'Multi-party computation for healthcare data sharing, digital ethics, lightweight cryptography, and threat mitigation frameworks.',
    keywords: [
      'cybersecurity', 'cyber security', 'security', 'secure', 'forensic', 'forensics',
      'cryptology', 'cryptography', 'digital ethics', 'multi-party computation',
      'attacks', 'isea', 'medical record', 'vulnerability', 'vulnerabilities'
    ]
  },
  {
    id: 'iot',
    title: 'IoT & Wireless Sensor Networks',
    shortTitle: 'IoT & WSN',
    badge: 'Connected Systems',
    icon: '📡',
    description: 'Quad-LEACH routing protocols, RF energy transmission via centralized accumulator nodes, and lightweight IoT security.',
    keywords: [
      'iot', 'internet of things', 'wsn', 'wireless sensor', 'sensor network',
      'sensor networks', 'quad-leach', 'energy accumulator', 'rf energy', 'connected'
    ]
  },
  {
    id: 'ai-ml',
    title: 'AI & Machine Learning in Security',
    shortTitle: 'AI & ML',
    badge: 'Intelligent Systems',
    icon: '🧠',
    description: 'Ensemble machine learning classifiers, trigram-pixel representation models, and predictive intelligence for automated security analysis and biomedical complications.',
    keywords: [
      'machine learning', 'deep learning', 'ai', 'artificial intelligence',
      'ensemble', 'predicting', 'prediction', 'predictive', 'tp-detect',
      'classifiers', 'diabetic retinopathy', 'data science', 'ewash'
    ]
  },
  {
    id: 'networks',
    title: 'Computer Networks & Communications',
    shortTitle: 'Networks',
    badge: 'Core Foundations',
    icon: '🌐',
    description: 'Authored university textbook on Data Communications & Networking (Bangalore University), network protocol simulation, and outcome-based pedagogical frameworks.',
    keywords: [
      'computer network', 'computer networks', 'networking', 'network', 'data communications',
      'cisco packet tracer', 'routing', 'protocol', 'protocols', 'distributed',
      'outcome based education', 'pedagogy', 'wsn', 'wireless sensor'
    ]
  }
];

export const DEFAULT_PUBLICATIONS = [
  {
    _id: 'pub-j1',
    title: 'Predicting Diabetic Retinopathy and Nephropathy Complications Using Machine Learning Techniques',
    authors: 'D. Manjunath, J. Lohith, S. S. Kumar, and A. Das',
    venue: 'IEEE Access',
    publicationType: 'journal',
    year: 2025,
    codeNumber: 'J1',
    featured: true
  },
  {
    _id: 'pub-j2',
    title: 'Enhancing Oyente: Four New Vulnerability Detections for Improved Smart Contract Security Analysis',
    authors: 'L. J.J. and K. Singh',
    venue: 'International Journal of Information Technology, vol. 16, no. 6, pp. 3389–3399',
    publicationType: 'journal',
    year: 2024,
    doi: 'https://doi.org/10.1007/s41870-024-01909-8',
    codeNumber: 'J2',
    featured: true
  },
  {
    _id: 'pub-j3',
    title: 'Digital Forensic Framework for Smart Contract Vulnerabilities Using Ensemble Models',
    authors: 'L. J.J., K. Singh, and B. Chakravarthi',
    venue: 'Multimedia Tools and Applications, pp. 1–44',
    publicationType: 'journal',
    year: 2023,
    doi: 'https://doi.org/10.1007/s11042-023-17308-3',
    codeNumber: 'J3',
    featured: true
  },
  {
    _id: 'pub-j4',
    title: 'TP-Detect: Trigram-Pixel Based Vulnerability Detection for Ethereum Smart Contracts',
    authors: 'P. S. Lohith J J et al.',
    venue: 'Multimedia Tools and Applications, pp. 1–15',
    publicationType: 'journal',
    year: 2023,
    doi: 'https://doi.org/10.1007/s11042-023-15042-4',
    codeNumber: 'J4',
    featured: true
  },
  {
    _id: 'pub-j5',
    title: 'Smart Healthcare System with Light-Weighted Blockchain System and Deep Learning Techniques',
    authors: 'R. Singh, L. J. J. Mir, et al.',
    venue: 'Computational Intelligence and Neuroscience, vol. 2022',
    publicationType: 'journal',
    year: 2022,
    doi: 'https://doi.org/10.1155/2022/1621258',
    codeNumber: 'J5',
    featured: false
  },
  {
    _id: 'pub-j6',
    title: 'Survey on Cognitive Apprehensive Device',
    authors: 'L. J. J, V. Tyagi, P. Bajaj, R. Desai, and Pranoy',
    venue: 'JETIR, vol. 2016',
    publicationType: 'journal',
    year: 2016,
    codeNumber: 'J6',
    featured: false
  },
  {
    _id: 'pub-j7',
    title: 'Role of Industry to Improve Outcome Based Education in Engineering',
    authors: 'L. J. J., Syedakram, Selvakumar S. et al.',
    venue: 'Journal of Engineering Education Transformations, vol. 2015',
    publicationType: 'journal',
    year: 2015,
    codeNumber: 'J7',
    featured: false
  },
  {
    _id: 'pub-c1',
    title: 'Vulnerabilities in Smart Contracts: A Detailed Survey of Detection and Mitigation Methodologies',
    authors: 'N. K. Kumar, N. V. Honnungar, M. Sharwari Prakash, and J. J. Lohith',
    venue: 'ICETCS 2024, pp. 1–7',
    publicationType: 'conference',
    year: 2024,
    doi: '10.1109/ICETCS61022.2024.10544155',
    codeNumber: 'C1',
    featured: true
  },
  {
    _id: 'pub-c2',
    title: 'Enhancing Wireless Sensor Network Longevity and Security: A Quad-LEACH Approach',
    authors: 'J. J. Lohith, S. Shreya, and J. L. Hamsa Priya',
    venue: 'ICETCS 2024, pp. 1–6',
    publicationType: 'conference',
    year: 2024,
    doi: '10.1109/ICETCS61022.2024.10543687',
    codeNumber: 'C2',
    featured: true
  },
  {
    _id: 'pub-c3',
    title: 'Unlocking Efficiency in Agricultural Supply Chains: A Secure and Transparent Approach Through Blockchain Technology',
    authors: 'J. J. Lohith, S. Shreya, and J. L. Hamsa Priya',
    venue: 'ICETCS 2024, pp. 1–9',
    publicationType: 'conference',
    year: 2024,
    doi: '10.1109/ICETCS61022.2024.10544311',
    codeNumber: 'C3',
    featured: true
  },
  {
    _id: 'pub-c4',
    title: 'Managing the Supply Chain for Crops Directed from Agricultural Fields Using Blockchains',
    authors: 'G. Kannan, M. Pattnaik, G. Karthikeyan, B. E, P. J. Augustine, and L. J.J.',
    venue: 'ICEARS 2022, pp. 908–913',
    publicationType: 'conference',
    year: 2022,
    doi: '10.1109/ICEARS53579.2022.9752088',
    codeNumber: 'C4',
    featured: false
  },
  {
    _id: 'pub-c5',
    title: 'Secure Distributed Medical Record Storage Using Blockchain and Emergency Sharing Using Multi-Party Computation',
    authors: 'S. Parthasarathy, A. Harikrishnan, G. Narayanan, L. J.J., and K. Singh',
    venue: 'NTMS 2021, pp. 1–5',
    publicationType: 'conference',
    year: 2021,
    doi: '10.1109/NTMS49979.2021.9432643',
    codeNumber: 'C5',
    featured: false
  },
  {
    _id: 'pub-c6',
    title: 'Intensifying the Lifetime of WSN Using a Centralized Energy Accumulator Node with RF Energy Transmission',
    authors: 'L. J.J. and B. C. S. B.',
    venue: 'IEEE IACC 2015, pp. 180–184',
    publicationType: 'conference',
    year: 2015,
    doi: '10.1109/IADCC.2015.7154694',
    codeNumber: 'C6',
    featured: false
  }
];

// State Store
let activeArea = 'all';
let explorerPublications = [...DEFAULT_PUBLICATIONS];
let explorerTalks = [...DEFAULT_TALKS];

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ----------------------------------------------------------------
// 1. NORMALIZATION & MATCHING ENGINE
// ----------------------------------------------------------------
export function normalizeItem(item) {
  if (!item) return { searchableText: '' };
  const parts = [
    item.title,
    item.authors,
    item.venue,
    item.institution,
    item.organization,
    item.category,
    item.thesis,
    item.description,
    Array.isArray(item.keywords) ? item.keywords.join(' ') : item.keywords
  ];
  return {
    ...item,
    searchableText: parts.filter(Boolean).join(' ').toLowerCase()
  };
}

export function matchesArea(item, areaId) {
  if (!areaId || areaId === 'all') return true;
  const area = RESEARCH_AREAS.find(a => a.id === areaId);
  if (!area || !area.keywords || area.keywords.length === 0) return true;

  const normalized = normalizeItem(item);
  return area.keywords.some(kw => normalized.searchableText.includes(kw.toLowerCase()));
}

// ----------------------------------------------------------------
// 2. STATISTICS CALCULATION
// ----------------------------------------------------------------
export function calculateAreaStats(areaId, publications = explorerPublications, talks = explorerTalks) {
  const matchingPubs = publications.filter(p => matchesArea(p, areaId));
  const matchingTalks = talks.filter(t => matchesArea(t, areaId));

  const years = [
    ...matchingPubs.map(p => Number(p.year)).filter(Boolean),
    ...matchingTalks.map(t => Number(t.year)).filter(Boolean)
  ];

  const minYear = years.length > 0 ? Math.min(...years) : 2015;
  const maxYear = years.length > 0 ? Math.max(...years) : 2026;
  const yearSpan = minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`;

  return {
    areaId,
    publicationCount: matchingPubs.length,
    talkCount: matchingTalks.length,
    yearSpan,
    matchingPubs,
    matchingTalks
  };
}

// ----------------------------------------------------------------
// 3. DATA SYNCHRONIZATION (from Sanity or local)
// ----------------------------------------------------------------
export function setResearchExplorerData({ publications, talks }) {
  if (Array.isArray(publications) && publications.length > 0) {
    explorerPublications = publications;
  }
  if (Array.isArray(talks) && talks.length > 0) {
    explorerTalks = talks;
  }
  renderDomainCards();
  renderResearchExplorerUI();
}

// ----------------------------------------------------------------
// 4. RENDERING DOMAIN ENTRY POINTS (Cards)
// ----------------------------------------------------------------
function renderDomainCards() {
  const container = document.getElementById('research-domain-cards');
  if (!container) return;

  const specificAreas = RESEARCH_AREAS.filter(a => a.id !== 'all');

  container.innerHTML = specificAreas.map(area => {
    const stats = calculateAreaStats(area.id, explorerPublications, explorerTalks);
    const isCurrentActive = activeArea === area.id;

    return `
      <div class="research-domain-card${isCurrentActive ? ' active' : ''}" data-domain="${escapeHtml(area.id)}">
        <div class="domain-card-top">
          <span class="domain-icon">${area.icon}</span>
          <span class="domain-badge">${escapeHtml(area.badge)}</span>
        </div>
        <h3 class="domain-title">${escapeHtml(area.title)}</h3>
        <p class="domain-desc">${escapeHtml(area.description)}</p>
        <div class="domain-metrics">
          <span class="domain-metric-tag"><strong>${stats.publicationCount}</strong> Papers</span>
          <span class="domain-metric-tag"><strong>${stats.talkCount}</strong> Talks</span>
        </div>
        <button class="domain-explore-btn" type="button" aria-label="Explore ${escapeHtml(area.title)}">
          <span>Explore Research</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="domain-arrow">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  // Attach click listeners to cards
  container.querySelectorAll('.research-domain-card').forEach(card => {
    card.addEventListener('click', () => {
      const domainId = card.dataset.domain;
      if (domainId) {
        selectResearchArea(domainId, true);
      }
    });
  });
}

// ----------------------------------------------------------------
// 5. MAIN UI RENDERER
// ----------------------------------------------------------------
export function renderResearchExplorerUI() {
  const currentArea = RESEARCH_AREAS.find(a => a.id === activeArea) || RESEARCH_AREAS[0];
  const stats = calculateAreaStats(activeArea, explorerPublications, explorerTalks);

  // 1. Update Area Overview Card
  const titleEl = document.getElementById('research-area-title');
  const descEl = document.getElementById('research-area-desc');
  const badgeEl = document.getElementById('research-area-badge');
  const statPubsEl = document.getElementById('r-stat-pubs');
  const statTalksEl = document.getElementById('r-stat-talks');
  const statSpanEl = document.getElementById('r-stat-span');

  if (titleEl) titleEl.textContent = currentArea.title;
  if (descEl) descEl.textContent = currentArea.description;
  if (badgeEl) badgeEl.textContent = currentArea.badge;
  if (statPubsEl) statPubsEl.textContent = String(stats.publicationCount);
  if (statTalksEl) statTalksEl.textContent = String(stats.talkCount);
  if (statSpanEl) statSpanEl.textContent = stats.yearSpan;

  // 2. Update Tabs State
  const tabs = document.querySelectorAll('.research-tab-btn');
  tabs.forEach(tab => {
    const isSelected = tab.dataset.area === activeArea;
    tab.classList.toggle('active', isSelected);
    tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });

  // 3. Update Domain Cards Active Class
  const domainCards = document.querySelectorAll('.research-domain-card');
  domainCards.forEach(card => {
    card.classList.toggle('active', card.dataset.domain === activeArea);
  });

  // 4. Render Featured Highlights (2-3 items)
  renderFeaturedHighlights(stats);

  // 5. Render Filtered Publications
  renderPublicationsList(stats.matchingPubs);

  // 6. Render Filtered Talks
  renderTalksList(stats.matchingTalks);

  // Refresh scroll reveal if available
  if (typeof window !== 'undefined' && window.refreshScrollReveal) {
    window.refreshScrollReveal();
  }
}

function renderFeaturedHighlights(stats) {
  const container = document.getElementById('research-featured-grid');
  if (!container) return;

  // Pick up to 3 featured highlights: priority to featured papers & keynotes
  const topPub = stats.matchingPubs.find(p => p.featured) || stats.matchingPubs[0];
  const otherPubs = stats.matchingPubs.filter(p => p !== topPub);
  const topTalk = stats.matchingTalks.find(t => t.featured) || stats.matchingTalks[0];

  const highlights = [];
  if (topPub) highlights.push({ type: 'publication', data: topPub });
  if (topTalk) highlights.push({ type: 'talk', data: topTalk });
  if (otherPubs.length > 0 && highlights.length < 3) {
    highlights.push({ type: 'publication', data: otherPubs[0] });
  }

  if (highlights.length === 0) {
    container.innerHTML = `<div class="explorer-empty">No featured items recorded in this area.</div>`;
    return;
  }

  container.innerHTML = highlights.map(item => {
    if (item.type === 'publication') {
      const p = item.data;
      const paperUrl = getPaperUrl ? getPaperUrl(p) : (p.doi || p.externalLink);
      return `
        <div class="featured-research-card${paperUrl ? ' pub-card--clickable' : ''}">
          <div class="featured-card-header">
            <span class="featured-type-tag">Featured Paper</span>
            <span class="featured-year-tag">${escapeHtml(String(p.year || ''))}</span>
          </div>
          ${paperUrl
            ? `<a href="${escapeHtml(paperUrl)}" target="_blank" rel="noopener noreferrer" class="pub-title-link"><h4 class="featured-title">${escapeHtml(p.title || '')} <span class="pub-link-icon">↗</span></h4></a>`
            : `<h4 class="featured-title">${escapeHtml(p.title || '')}</h4>`
          }
          <p class="featured-venue">${escapeHtml(p.venue || '')}</p>
          <div class="featured-authors">${escapeHtml(p.authors || '')}</div>
        </div>
      `;
    } else {
      const t = item.data;
      return `
        <div class="featured-research-card featured-research-card--talk">
          <div class="featured-card-header">
            <span class="featured-type-tag featured-type-tag--talk">Keynote / FDP</span>
            <span class="featured-year-tag">${escapeHtml(String(t.year || ''))}</span>
          </div>
          <h4 class="featured-title">${escapeHtml(t.title || '')}</h4>
          <p class="featured-venue">${escapeHtml(t.venue || '')}</p>
          <div class="featured-authors">${escapeHtml(t.dateString || '')}</div>
        </div>
      `;
    }
  }).join('');
}

function renderPublicationsList(pubs) {
  const container = document.getElementById('explorer-pubs-list');
  const countBadge = document.getElementById('research-pubs-count');
  if (countBadge) countBadge.textContent = String(pubs.length);
  if (!container) return;

  if (pubs.length === 0) {
    container.innerHTML = `
      <div class="explorer-empty">
        <p>No publications specifically cataloged under this filtered topic.</p>
        <button class="btn btn-outline btn-sm" style="margin-top:0.75rem;" onclick="window.selectResearchArea('all')">View All Publications</button>
      </div>
    `;
    return;
  }

  container.innerHTML = pubs.map((p, idx) => {
    const codeNum = p.codeNumber || `P${idx + 1}`;
    const paperUrl = getPaperUrl ? getPaperUrl(p) : (p.doi || p.externalLink);
    const pdfLinkHtml = p.pdfUrl ? `<a href="${escapeHtml(p.pdfUrl)}" target="_blank" rel="noopener noreferrer" class="pub-doi" style="margin-left:0.75rem;">PDF 📄</a>` : '';
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
  }).join('');
}

function renderTalksList(talks) {
  const container = document.getElementById('explorer-talks-list');
  const countBadge = document.getElementById('research-talks-count');
  if (countBadge) countBadge.textContent = String(talks.length);
  if (!container) return;

  if (talks.length === 0) {
    container.innerHTML = `
      <div class="explorer-empty">
        <p>No invited talks recorded under this specific keyword.</p>
        <button class="btn btn-outline btn-sm" style="margin-top:0.75rem;" onclick="window.selectResearchArea('all')">View All Talks</button>
      </div>
    `;
    return;
  }

  // Show up to 10 most relevant talks in this column for neat balance
  const displayTalks = talks.slice(0, 10);

  container.innerHTML = `
    <div class="explorer-talk-items">
      ${displayTalks.map(t => `
        <div class="explorer-talk-card">
          <div class="explorer-talk-top">
            <span class="explorer-talk-year">${escapeHtml(String(t.year || ''))}</span>
            <span class="explorer-talk-date">${escapeHtml(t.dateString || '')}</span>
          </div>
          <div class="explorer-talk-title">${escapeHtml(t.title || '')}</div>
          <div class="explorer-talk-venue">${escapeHtml(t.venue || '')}</div>
        </div>
      `).join('')}
    </div>
    ${talks.length > 10 ? `
      <div class="explorer-talks-more">
        <span>+ ${talks.length - 10} additional sessions in this area</span>
        <a href="#talks" class="explorer-link-all">Explore in Full Talks Section ↓</a>
      </div>
    ` : ''}
  `;
}

// ----------------------------------------------------------------
// 6. AREA SELECTION & URL SYNC
// ----------------------------------------------------------------
export function selectResearchArea(areaId, smoothScroll = false) {
  const targetArea = RESEARCH_AREAS.some(a => a.id === areaId) ? areaId : 'all';
  activeArea = targetArea;

  // Sync URL hash without jump
  if (typeof window !== 'undefined') {
    const hash = targetArea === 'all' ? '#research-focus' : `#research-${targetArea}`;
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', hash);
    }
  }

  renderResearchExplorerUI();

  if (smoothScroll && typeof window !== 'undefined') {
    const overviewEl = document.getElementById('research-overview-card');
    if (overviewEl) {
      overviewEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

// ----------------------------------------------------------------
// 7. INITIALIZER
// ----------------------------------------------------------------
export function initResearchExplorer() {
  // 1. Initial render of cards and UI
  renderDomainCards();

  // 2. Check URL Hash on page load
  if (typeof window !== 'undefined' && window.location.hash) {
    const rawHash = window.location.hash.toLowerCase();
    if (rawHash.startsWith('#research-')) {
      const parsedId = rawHash.replace('#research-', '');
      if (RESEARCH_AREAS.some(a => a.id === parsedId)) {
        activeArea = parsedId;
      }
    }
  }

  // 3. Attach Tab Listeners
  const tabsContainer = document.getElementById('research-selector-wrapper');
  if (tabsContainer && !tabsContainer.dataset.listenerAttached) {
    tabsContainer.dataset.listenerAttached = 'true';
    tabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.research-tab-btn');
      if (!btn) return;
      const areaId = btn.dataset.area;
      if (areaId) {
        selectResearchArea(areaId, false);
      }
    });
  }

  renderResearchExplorerUI();

  // 4. Global hash change listener
  if (typeof window !== 'undefined') {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#research-')) {
        const parsedId = hash.replace('#research-', '');
        if (RESEARCH_AREAS.some(a => a.id === parsedId) && parsedId !== activeArea) {
          selectResearchArea(parsedId, false);
        }
      }
    });
  }
}

// Expose on window for easy interaction
if (typeof window !== 'undefined') {
  window.selectResearchArea = selectResearchArea;
  window.setResearchExplorerData = setResearchExplorerData;
  window.initResearchExplorer = initResearchExplorer;
}
