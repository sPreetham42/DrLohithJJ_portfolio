import { initPublicDataAdapter } from './data/adapter.js';
import { initTalksController } from './talks.js';
import { initResearchExplorer } from './research-explorer.js';
import { initScholarHealth } from './scholar-health.js';

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollReveal();
  initMobileMenu();
  initSmoothScroll();
  initContactForm();
  initGoogleScholarSync();
  initScholarHealth();
  initHeroCounters();
  initTalksController();
  initResearchExplorer();
  initPublicationCardLinks();

  // Primary Data Source: D1 Worker Public API (with automatic canonical fallback)
  initPublicDataAdapter().catch(err => {
    console.warn('[Public Adapter] Falling back to static HTML fallback:', err.message);
  });
});

// Expose scroll reveal refresh for dynamic elements
window.refreshScrollReveal = function () {
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

  if (!navbar) return;

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
// MOBILE MENU
// ================================================================
function initMobileMenu() {
  const toggle = document.getElementById('nav-mobile-toggle');
  const navLinks = document.getElementById('nav-links');

  if (!toggle || !navLinks) return;

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
      const href = anchor.getAttribute('href');
      const target = document.querySelector(href);
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
          btn.style.background = '#0B6B5A';
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

// ================================================================
// HERO STATS — SMOOTH COUNT-UP
// ================================================================
function initHeroCounters() {
  const counters = document.querySelectorAll(
    '.hero-stat-number[data-count]'
  );

  counters.forEach((counter, index) => {
    const target = Number(counter.dataset.count);

    if (!Number.isFinite(target)) return;

    const hasPlus = counter.textContent.includes('+');

    // Start from zero
    counter.textContent = hasPlus ? '0+' : '0';

    // Stagger each counter slightly
    const delay = 600 + (index * 120);

    // Count-up duration
    const duration = 2000;

    setTimeout(() => {
      const startTime = performance.now();

      function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Smooth ease-out
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(easedProgress * target);

        counter.textContent = hasPlus ? `${currentValue}+` : `${currentValue}`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          counter.textContent = hasPlus ? `${target}+` : `${target}`;
        }
      }

      requestAnimationFrame(animate);
    }, delay);
  });
}

// ================================================================
// CLICKABLE PUBLICATION CARDS
// Allows clicking anywhere on a clickable publication card to open the paper
// ================================================================
function initPublicationCardLinks() {
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.pub-card--clickable');
    if (!card) return;

    // If clicked directly on an <a> element or its children, let native link behavior handle it
    if (e.target.closest('a')) return;

    const mainLink = card.querySelector('.pub-title-link');
    if (mainLink && mainLink.href) {
      window.open(mainLink.href, '_blank', 'noopener,noreferrer');
    }
  });
}