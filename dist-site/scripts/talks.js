// ================================================================
// INVITED TALKS & WORKSHOPS CONTROLLER
// Complete reactive state management for Year Filter & Show All / Show Less
// ================================================================

export const DEFAULT_TALKS = [
  {"_id": "talk-1", "title": "Cyber Security and Digital Ethics", "venue": "VIT, Pune (FDP)", "dateString": "Feb 27, 2026", "year": 2026, "featured": true, "order": 1},
  {"_id": "talk-2", "title": "Blockchain Technology in Education", "venue": "UGC Malaviya Mission Teacher Centre, Bengaluru University", "dateString": "Jan 28, 2026", "year": 2026, "featured": true, "order": 2},
  {"_id": "talk-3", "title": "Blockchain and Hands-on Smart Contracts", "venue": "RNSIT, Bengaluru", "dateString": "Oct 11, 2025", "year": 2025, "featured": true, "order": 3},
  {"_id": "talk-4", "title": "Blockchain and Smart Contracts", "venue": "DSCE, Bengaluru", "dateString": "Sep 11, 2025", "year": 2025, "featured": true, "order": 4},
  {"_id": "talk-5", "title": "Protecting Intellectual Property Rights", "venue": "SJCIT, Chikkaballapura", "dateString": "Aug 30, 2025", "year": 2025, "featured": true, "order": 5},
  {"_id": "talk-6", "title": "Deploying Smart Contracts", "venue": "NIT Jamshedpur (STC on Blockchain & Applications)", "dateString": "Jun 4, 2025", "year": 2025, "featured": true, "order": 6},
  {"_id": "talk-7", "title": "Personality Development — Induction Program", "venue": "VTU PG Center, Muddenahalli", "dateString": "Apr 24, 2025", "year": 2025, "featured": true, "order": 7},
  {"_id": "talk-8", "title": "Blockchain & Smart Contracts — 2-Day VAC", "venue": "Cambridge Institute of Technology, Bengaluru", "dateString": "Mar 10–11, 2025", "year": 2025, "featured": true, "order": 8},
  {"_id": "talk-9", "title": "Deploying Smart Contracts", "venue": "Vishwakarma Institute of Technology, Pune", "dateString": "Feb 13, 2025", "year": 2025, "featured": true, "order": 9},
  {"_id": "talk-10", "title": "Session Chair — ICIIICEE 2025", "venue": "BNMIT, Bengaluru", "dateString": "Jan 17, 2025", "year": 2025, "featured": false, "order": 10},
  {"_id": "talk-11", "title": "Deploying Smart Contracts — ISEA FUP on Next Gen Security", "venue": "NIT Kurukshetra", "dateString": "Dec 28, 2024", "year": 2024, "featured": false, "order": 11},
  {"_id": "talk-12", "title": "Transforming AI With Healthcare — EWASH Conference", "venue": "VTU PG Center, Muddenahalli", "dateString": "Dec 14, 2024", "year": 2024, "featured": false, "order": 12},
  {"_id": "talk-13", "title": "Blockchain & Ethereum Smart Contracts", "venue": "Bangalore Institute of Technology, Bengaluru", "dateString": "Nov 14, 2024", "year": 2024, "featured": false, "order": 13},
  {"_id": "talk-14", "title": "Blockchain & Smart Contracts — 3-Day VAC", "venue": "P.A. College of Engineering, Mangaluru", "dateString": "Oct 7–9, 2024", "year": 2024, "featured": false, "order": 14},
  {"_id": "talk-15", "title": "Essentials of Programming Language", "venue": "VTU PG Center, Muddenahalli", "dateString": "Oct 3, 2024", "year": 2024, "featured": false, "order": 15},
  {"_id": "talk-16", "title": "Introduction to Cryptocurrency & Technology Behind It", "venue": "Arohan Lecture 14, DTE Bengaluru", "dateString": "Sep 17, 2024", "year": 2024, "featured": false, "order": 16},
  {"_id": "talk-17", "title": "Exploring Cisco Packet Tracer Tool", "venue": "NCET, Dept of CSE(AI&ML), Bengaluru", "dateString": "Jun 11, 2024", "year": 2024, "featured": false, "order": 17},
  {"_id": "talk-18", "title": "Blockchain & Smart Contracts — 3-Day VAC", "venue": "NCET, Dept of CSE(DS), Bengaluru", "dateString": "May 27–29, 2024", "year": 2024, "featured": false, "order": 18},
  {"_id": "talk-19", "title": "Cybersecurity and its Attacks", "venue": "DSCE, Bengaluru", "dateString": "Jan 2, 2024", "year": 2024, "featured": false, "order": 19},
  {"_id": "talk-20", "title": "Cybersecurity and its Attacks", "venue": "SJCIT, Chikkaballapura", "dateString": "Dec 20, 2023", "year": 2023, "featured": false, "order": 20},
  {"_id": "talk-21", "title": "Blockchain and its Applications — 2-Day Workshop", "venue": "Alva's College of Engineering, Moodbidre", "dateString": "Nov 20–21, 2023", "year": 2023, "featured": false, "order": 21},
  {"_id": "talk-22", "title": "Blockchain and its Applications — 2-Day Workshop", "venue": "Manipal Institute of Technology, Manipal", "dateString": "Nov 10–11, 2023", "year": 2023, "featured": false, "order": 22},
  {"_id": "talk-23", "title": "Blockchain Technology — FDP", "venue": "MLWCE, Hyderabad", "dateString": "Mar 28, 2023", "year": 2023, "featured": false, "order": 23},
  {"_id": "talk-24", "title": "Current Trends in Blockchain & CyberSecurity — FDP", "venue": "BMSCE, Bengaluru", "dateString": "Mar 20–26, 2023", "year": 2023, "featured": false, "order": 24},
  {"_id": "talk-25", "title": "Introduction to Cryptology — DST-SERB Workshop", "venue": "NIT Tiruchirappalli", "dateString": "Jan 11–12, 2023", "year": 2023, "featured": false, "order": 25},
  {"_id": "talk-26", "title": "Blockchain & IOT Applications — FDP", "venue": "MSRUAS, Bengaluru", "dateString": "Aug 11, 2022", "year": 2022, "featured": false, "order": 26},
  {"_id": "talk-27", "title": "Blockchain & AWS — 3-Day FDP", "venue": "Reva University, Bengaluru", "dateString": "Jul 25–27, 2022", "year": 2022, "featured": false, "order": 27},
  {"_id": "talk-28", "title": "Introduction to Cryptocurrency & Blockchain", "venue": "RVCE, Bengaluru", "dateString": "May 30, 2022", "year": 2022, "featured": false, "order": 28},
  {"_id": "talk-29", "title": "Blockchain & Hands on Ethereum Smart Contracts — Workshop", "venue": "SVIT, Bengaluru", "dateString": "May 19–20, 2022", "year": 2022, "featured": false, "order": 29},
  {"_id": "talk-30", "title": "Introduction to Blockchain", "venue": "HNSNC, Virudhunagar, Tamil Nadu", "dateString": "May 10, 2022", "year": 2022, "featured": false, "order": 30},
  {"_id": "talk-31", "title": "Blockchain & Hands on Ethereum Smart Contracts — 2-Day Workshop", "venue": "AIT, Chikkamagaluru", "dateString": "Apr 29–30, 2022", "year": 2022, "featured": false, "order": 31},
  {"_id": "talk-32", "title": "Recent Trends in Cyber Security & Blockchain — FDP", "venue": "VVCE, Mysuru", "dateString": "Apr 20–21, 2022", "year": 2022, "featured": false, "order": 32},
  {"_id": "talk-33", "title": "Blockchain Technologies and Applications — ATAL FDP", "venue": "Manipal Institute of Technology", "dateString": "Dec 6–10, 2021", "year": 2021, "featured": false, "order": 33},
  {"_id": "talk-34", "title": "Lightweight Cryptography for IoT & Blockchain — ATAL FDP", "venue": "UIT RGPV, Bhopal", "dateString": "Jul 28, 2021", "year": 2021, "featured": false, "order": 34},
  {"_id": "talk-35", "title": "Blockchain & Smart Contract Technology — FDP", "venue": "NIT Tiruchirappalli", "dateString": "Jun 26, 2021", "year": 2021, "featured": false, "order": 35},
  {"_id": "talk-36", "title": "Challenges & Research Directions for Blockchains in IoT — STTP", "venue": "Sona College of Engineering, Salem", "dateString": "Feb 11, 2021", "year": 2021, "featured": false, "order": 36},
  {"_id": "talk-37", "title": "Blockchain & Use Cases — ATAL FDP", "venue": "BNMIT, Bengaluru", "dateString": "Jan 18–19, 2021", "year": 2021, "featured": false, "order": 37},
  {"_id": "talk-38", "title": "Writing Smart Contracts Using Ethereum — AICTE STTP", "venue": "Sona College of Engineering, Salem", "dateString": "Jan 5–6, 2021", "year": 2021, "featured": false, "order": 38},
  {"_id": "talk-39", "title": "Research Challenges in Blockchain Technology — ATAL FDP", "venue": "Sona College of Engineering, Salem", "dateString": "Dec 14, 2020", "year": 2020, "featured": false, "order": 39},
  {"_id": "talk-40", "title": "Introduction to Ethereum Smart Contracts", "venue": "LBSITW", "dateString": "Nov 25, 2020", "year": 2020, "featured": false, "order": 40},
  {"_id": "talk-41", "title": "Hands-on Ethereum Smart Contracts — ATAL FDP", "venue": "Bangalore Institute of Technology", "dateString": "Nov 24, 2020", "year": 2020, "featured": false, "order": 41},
  {"_id": "talk-42", "title": "Blockchain Technology — Expert Talk", "venue": "BMSIT, Bengaluru", "dateString": "Jun 22, 2020", "year": 2020, "featured": false, "order": 42},
  {"_id": "talk-43", "title": "Blockchain Technology — National Conference on BSCT", "venue": "NIT Tiruchirappalli", "dateString": "2019", "year": 2019, "featured": false, "order": 43},
  {"_id": "talk-44", "title": "Guest Lectures Series in Blockchain & Networks", "venue": "Krupanidhi Degree College & PES Polytechnic, Bengaluru", "dateString": "2018 — 2023", "year": 2018, "featured": false, "order": 44},
  {"_id": "talk-att-1", "title": "Python Programming — Online One-Week FDP (Attended)", "venue": "MHRD & IIT Bombay", "dateString": "2020", "year": 2020, "featured": false, "order": 45},
  {"_id": "talk-att-2", "title": "Blockchain Architecture Design & Use Cases — 3-Week STTP (Attended)", "venue": "AICTE", "dateString": "2020", "year": 2020, "featured": false, "order": 46},
  {"_id": "talk-att-3", "title": "Intellectual Property Rights, Technology Development & Startup (Attended)", "venue": "NIT Tiruchirappalli", "dateString": "2019", "year": 2019, "featured": false, "order": 47},
  {"_id": "talk-att-4", "title": "Pseudospectral Methods in Differential Equations — 2-Week GIAN FDP (Attended)", "venue": "GIAN", "dateString": "2018", "year": 2018, "featured": false, "order": 48},
  {"_id": "talk-att-5", "title": "Software Engineering — Short Term Course (Attended)", "venue": "Dept of CSE, NIT Tiruchirappalli", "dateString": "2017", "year": 2017, "featured": false, "order": 49},
  {"_id": "talk-att-6", "title": "Introduction to Algorithms — Short Term Course (Attended)", "venue": "Dept of CSE, NIT Tiruchirappalli", "dateString": "2017", "year": 2017, "featured": false, "order": 50},
  {"_id": "talk-att-7", "title": "Introduction to Cryptography — Short Term Course (Attended)", "venue": "Dept of CSE, NIT Tiruchirappalli", "dateString": "2017", "year": 2017, "featured": false, "order": 51},
  {"_id": "talk-att-8", "title": "Computer Networking — 2-Week ISTE Workshop (Attended)", "venue": "IIT Bombay & ISTE", "dateString": "2014", "year": 2014, "featured": false, "order": 52},
  {"_id": "talk-att-9", "title": "Faculty Orientation Program (Attended)", "venue": "BMSCE, Bengaluru", "dateString": "2011", "year": 2011, "featured": false, "order": 53}
];

let talksData = [...DEFAULT_TALKS];
let selectedYear = 'all';
let isExpanded = false;
const INITIAL_LIMIT = 9;

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function setTalksData(items) {
  if (Array.isArray(items) && items.length > 0) {
    talksData = items;
  }
  populateYearDropdown();
  renderTalksUI();
}

export function initTalksController() {
  const yearFilter = document.getElementById('talk-year-filter');
  const toggleBtn = document.getElementById('talks-toggle');

  if (yearFilter && !yearFilter.dataset.listenerAttached) {
    yearFilter.dataset.listenerAttached = 'true';
    yearFilter.addEventListener('change', (e) => {
      selectedYear = e.target.value;
      renderTalksUI();
    });
  }

  if (toggleBtn && !toggleBtn.dataset.listenerAttached) {
    toggleBtn.dataset.listenerAttached = 'true';
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isExpanded = !isExpanded;
      renderTalksUI();
    });
  }

  populateYearDropdown();
  renderTalksUI();
}

function populateYearDropdown() {
  const filterSelect = document.getElementById('talk-year-filter');
  if (!filterSelect) return;

  const years = [
    ...new Set(talksData.map(t => t.year).filter(Boolean))
  ].sort((a, b) => Number(b) - Number(a));

  const optionsHtml = [
    `<option value="all">All Years</option>`,
    ...years.map(y => `<option value="${y}">${y}</option>`)
  ].join('');

  filterSelect.innerHTML = optionsHtml;
  filterSelect.value = selectedYear;
}

export function renderTalksUI() {
  const container = document.getElementById('talks-grid') || document.getElementById('talks-featured');
  const countSpan = document.getElementById('talk-count');
  const toggleBtn = document.getElementById('talks-toggle');
  const toggleContainer = document.getElementById('talks-toggle-container') || (toggleBtn ? toggleBtn.parentElement : null);
  const toggleText = document.getElementById('talks-toggle-text') || (toggleBtn ? toggleBtn.querySelector('span') : null);

  // 1. Filter items by selectedYear
  const filtered = selectedYear === 'all'
    ? talksData
    : talksData.filter(t => String(t.year) === String(selectedYear));

  // 2. Update Counter
  if (countSpan) {
    if (selectedYear === 'all') {
      countSpan.textContent = `${talksData.length > 50 ? '60+' : talksData.length}`;
    } else {
      countSpan.textContent = filtered.length;
    }
  }

  // 3. Slice items to display based on isExpanded
  const itemsToDisplay = isExpanded ? filtered : filtered.slice(0, INITIAL_LIMIT);

  // 4. Render talk cards into the container
  if (container) {
    if (itemsToDisplay.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No talks recorded for ${escapeHtml(selectedYear)}.</div>`;
    } else {
      container.innerHTML = itemsToDisplay.map(t => `
        <div class="talk-card" data-year="${escapeHtml(String(t.year || ''))}">
          <div class="talk-topic">${escapeHtml(t.title || '')}</div>
          <div class="talk-venue">${escapeHtml(t.venue || '')}</div>
          <div class="talk-date">${escapeHtml(t.dateString || String(t.year || ''))}</div>
        </div>
      `).join('');
    }
  }

  // 5. Configure Toggle Button state
  if (toggleBtn) {
    if (filtered.length <= INITIAL_LIMIT) {
      if (toggleContainer) toggleContainer.style.display = 'none';
      toggleBtn.style.display = 'none';
    } else {
      if (toggleContainer) toggleContainer.style.display = 'block';
      toggleBtn.style.display = 'inline-flex';

      if (isExpanded) {
        toggleBtn.classList.add('expanded');
        if (toggleText) toggleText.textContent = 'Show Less';
      } else {
        toggleBtn.classList.remove('expanded');
        if (toggleText) {
          toggleText.textContent = selectedYear === 'all'
            ? 'View All 60+ Sessions'
            : `View All ${filtered.length} Sessions`;
        }
      }
    }
  }

  // 6. Trigger scroll reveal observer if present
  if (window.refreshScrollReveal) {
    window.refreshScrollReveal();
  }
}

// Attach to window object for legacy / external calls
if (typeof window !== 'undefined') {
  window.setTalksData = setTalksData;
  window.renderTalksUI = renderTalksUI;
  window.initTalksController = initTalksController;
}
