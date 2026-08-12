import { initSanityData } from './sanity/loader.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initMobileMenu();
  initSmoothScroll();
  initContactForm();
  initGoogleScholarSync();
  initTalksYearFilter();

  // Load CMS data from Sanity
  initSanityData().catch(err => {
    console.warn('[Sanity Loader] Fallback to static HTML content:', err.message);
  });
});

// Expose scroll reveal refresh for dynamic elements
window.refreshScrollReveal = function() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-children');
  if (window._revealObserver) {
    revealElements.forEach(el => window._revealObserver.observe(el));
  }
};

// ================================================================
// NAVBAR SCROLL EFFECT
// ================================================================
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });
}

// ================================================================
// SCROLL REVEAL (Intersection Observer)
// ================================================================
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-children');

  window._revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        window._revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => window._revealObserver.observe(el));
}

// ================================================================
// TALKS YEAR FILTER
// ================================================================
function initTalksYearFilter() {
  const yearFilter = document.getElementById('talk-year-filter');
  const countSpan = document.getElementById('talk-count');
  if (!yearFilter) return;

  yearFilter.addEventListener('change', (e) => {
    const selectedYear = e.target.value;
    const talkCards = document.querySelectorAll('.talk-card');
    let visibleCount = 0;

    talkCards.forEach(card => {
      const cardYear = card.getAttribute('data-year') || card.querySelector('.talk-date')?.textContent;
      if (selectedYear === 'all' || (cardYear && cardYear.includes(selectedYear))) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (countSpan) {
      countSpan.textContent = visibleCount;
    }
  });
}

// ================================================================
// MOBILE MENU
// ================================================================
function initMobileMenu() {
  const toggle = document.getElementById('nav-mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });
}

// ================================================================
// SMOOTH SCROLL
// ================================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

// ================================================================
// CONTACT FORM (Formspree)
// ================================================================
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn-primary');
    const originalText = btn.innerHTML;

    // Show sending state
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      Sending...
    `;
    btn.disabled = true;

    const formData = new FormData(form);

    fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
    .then(response => {
      if (response.ok) {
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Message Sent!
        `;
        btn.style.background = '#0F2137';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
          btn.disabled = false;
          form.reset();
        }, 3000);
      } else {
        throw new Error('Form submission failed');
      }
    })
    .catch(() => {
      btn.innerHTML = `⚠ Failed — Try Again`;
      btn.style.background = '#b91c1c';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 3000);
    });
  });
}

// ================================================================
// GOOGLE SCHOLAR LIVE SYNC
// Reads from data/scholar.json (auto-updated daily by GitHub Actions)
// ================================================================
function initGoogleScholarSync() {
  fetch('data/scholar.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (data.citations && data.citations > 0) {
        document.querySelectorAll('.stat-citations').forEach(el => {
          el.textContent = `${data.citations}+`;
        });
      }
      if (data.h_index && data.h_index > 0) {
        document.querySelectorAll('.stat-hindex').forEach(el => {
          el.textContent = data.h_index;
        });
      }
      if (data.papers_count && data.papers_count > 0) {
        document.querySelectorAll('.stat-papers').forEach(el => {
          el.textContent = data.papers_count;
        });
      }
    })
    .catch(err => {
      console.warn('[Scholar Sync] Using baseline values:', err.message);
    });
}