// ================================================================
// FEATURED TALKS HORIZONTAL MARQUEE CONTROLLER
// Continuous horizontal ticker above the hero section.
// Equal-sized cards derived from Featured Highlights design tokens.
// Dynamically rendered from published talks (Newest -> Oldest).
// Powered by requestAnimationFrame with seamless infinite loop.
// ================================================================

import { DEFAULT_TALKS } from './talks.js';

let marqueeAnimationFrame = null;
let isPaused = false;
let isManualScrolling = false;
let manualScrollTimer = null;
let currentOffset = 0;

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Filter published talks and sort newest -> oldest (year DESC, then displayOrder/order ASC).
 * Selects the latest 6-8 published talks.
 */
export function getFeaturedTalks(allTalks) {
  const source = Array.isArray(allTalks) && allTalks.length > 0 ? allTalks : DEFAULT_TALKS;

  // Only published talks
  const published = source.filter(t => t.published !== 0 && t.published !== false);

  // Dynamic sort: year DESC, then order / displayOrder
  const sorted = [...published].sort((a, b) => {
    const yearA = Number(a.year) || 0;
    const yearB = Number(b.year) || 0;
    if (yearB !== yearA) {
      return yearB - yearA; // Newest year first
    }
    const orderA = a.displayOrder ?? a.order ?? 0;
    const orderB = b.displayOrder ?? b.order ?? 0;
    return orderA - orderB;
  });

  // Select latest 6–8 talks (up to 8, or all available if fewer)
  return sorted.slice(0, 8);
}

function renderTalkCardHtml(talk) {
  const year = escapeHtml(String(talk.year || ''));
  const title = escapeHtml(talk.title || '');
  const venue = escapeHtml(talk.venue || '');
  const dateStr = talk.dateString && String(talk.dateString).trim() !== String(talk.year)
    ? escapeHtml(String(talk.dateString).trim())
    : '';

  return `
    <div class="talks-marquee-card featured-research-card featured-research-card--talk">
      <div class="featured-card-header">
        <span class="featured-type-tag featured-type-tag--talk">INVITED TALK</span>
        <span class="featured-year-tag">${year}</span>
      </div>
      <h4 class="featured-title" title="${title}">${title}</h4>
      <p class="featured-venue" title="${venue}">${venue}</p>
      ${dateStr ? `<div class="featured-authors">${dateStr}</div>` : ''}
    </div>
  `;
}

export function renderTalksMarquee(talks) {
  const track = document.getElementById('talks-marquee-track');
  if (!track) return;

  const featured = getFeaturedTalks(talks);
  if (featured.length === 0) return;

  // Render Set A (primary items: newest -> oldest) + Set B (exact replica for infinite seamless loop)
  const setAHtml = featured.map(t => renderTalkCardHtml(t)).join('');
  const setBHtml = featured.map(t => renderTalkCardHtml(t)).join('');

  track.innerHTML = setAHtml + setBHtml;
}

export function initTalksMarquee(initialTalks = null) {
  const marquee = document.getElementById('talks-marquee');
  const track = document.getElementById('talks-marquee-track');
  if (!track) return;

  renderTalksMarquee(initialTalks || DEFAULT_TALKS);

  // Pause / Resume & Wheel interactions
  if (marquee && !marquee.dataset.eventsBound) {
    marquee.dataset.eventsBound = 'true';

    marquee.addEventListener('mouseenter', () => {
      isPaused = true;
    });

    marquee.addEventListener('mouseleave', () => {
      isPaused = false;
    });

    marquee.addEventListener('focusin', () => {
      isPaused = true;
    });

    marquee.addEventListener('focusout', () => {
      isPaused = false;
    });

    // Manual Mouse / Trackpad Wheel Control
    marquee.addEventListener('wheel', handleMarqueeWheel, { passive: false });

    // Touch Swipe Interaction for Mobile / Tablets
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchActive = false;
    let isHorizontalSwipe = false;

    marquee.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isTouchActive = true;
      isHorizontalSwipe = false;
      isManualScrolling = true;
      if (manualScrollTimer) clearTimeout(manualScrollTimer);
    }, { passive: true });

    marquee.addEventListener('touchmove', (e) => {
      if (!isTouchActive || e.touches.length !== 1) return;
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = touchStartX - currentX;
      const deltaY = touchStartY - currentY;

      if (!isHorizontalSwipe) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 6) {
          isHorizontalSwipe = true;
        }
      }

      if (isHorizontalSwipe) {
        if (e.cancelable) e.preventDefault();
        touchStartX = currentX;
        touchStartY = currentY;
        applyWheelOffset(deltaX);
      }
    }, { passive: false });

    const endTouch = () => {
      if (!isTouchActive) return;
      isTouchActive = false;
      if (manualScrollTimer) clearTimeout(manualScrollTimer);
      manualScrollTimer = setTimeout(() => {
        isManualScrolling = false;
      }, 1000);
    };

    marquee.addEventListener('touchend', endTouch, { passive: true });
    marquee.addEventListener('touchcancel', endTouch, { passive: true });
  }

  // Animation Loop
  startMarqueeAnimation();
}

function handleMarqueeWheel(e) {
  // Determine delta (horizontal wheel deltaX takes priority if present, else vertical deltaY)
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (!delta) return;

  // Prevent page vertical/horizontal scrolling while interacting over Featured Talks
  e.preventDefault();

  isManualScrolling = true;
  if (manualScrollTimer) {
    clearTimeout(manualScrollTimer);
  }

  // 1000ms inactivity period before automatic marquee resumes
  manualScrollTimer = setTimeout(() => {
    isManualScrolling = false;
  }, 1000);

  applyWheelOffset(delta);
}

function applyWheelOffset(delta) {
  const track = document.getElementById('talks-marquee-track');
  if (!track) return;

  const items = Array.from(track.querySelectorAll('.talks-marquee-card'));
  const halfCount = items.length / 2;
  if (halfCount <= 0 || items.length % 2 !== 0) return;

  const secondSetFirstItem = items[halfCount];
  const travelDistance = secondSetFirstItem ? secondSetFirstItem.offsetLeft : (track.scrollWidth / 2);
  if (travelDistance <= 0) return;

  currentOffset -= delta;

  // Seamless infinite loop normalization
  while (Math.abs(currentOffset) >= travelDistance && currentOffset <= 0) {
    currentOffset += travelDistance;
  }
  while (currentOffset > 0) {
    currentOffset -= travelDistance;
  }

  track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
}

function startMarqueeAnimation() {
  const track = document.getElementById('talks-marquee-track');
  if (!track) return;

  if (marqueeAnimationFrame) {
    cancelAnimationFrame(marqueeAnimationFrame);
    marqueeAnimationFrame = null;
  }

  const items = Array.from(track.querySelectorAll('.talks-marquee-card'));
  const halfCount = items.length / 2;
  if (halfCount <= 0 || items.length % 2 !== 0) return;

  let previousTime = performance.now();

  function measureTravelDistance() {
    const secondSetFirstItem = items[halfCount];
    if (!secondSetFirstItem) return track.scrollWidth / 2;
    return secondSetFirstItem.offsetLeft;
  }

  let travelDistance = measureTravelDistance();

  function getPixelsPerSecond() {
    const width = window.innerWidth;
    if (width <= 768) return 35;
    if (width <= 1024) return 40;
    return 45; // Smooth readable speed for card blocks
  }

  let pixelsPerSecond = getPixelsPerSecond();

  // Respect reduced-motion preference
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate(now) {
    const deltaSeconds = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    if (!reduceMotion && !isPaused && !isManualScrolling && travelDistance > 0) {
      currentOffset -= pixelsPerSecond * deltaSeconds;

      if (Math.abs(currentOffset) >= travelDistance) {
        currentOffset += travelDistance;
      }

      track.style.transform = `translate3d(${currentOffset}px, 0, 0)`;
    } else if (travelDistance <= 0) {
      travelDistance = measureTravelDistance();
    }

    marqueeAnimationFrame = requestAnimationFrame(animate);
  }

  marqueeAnimationFrame = requestAnimationFrame(animate);

  // Resize listener with debouncing
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      pixelsPerSecond = getPixelsPerSecond();
      const newDistance = measureTravelDistance();
      if (newDistance > 0) {
        travelDistance = newDistance;
        if (Math.abs(currentOffset) >= travelDistance) {
          currentOffset %= travelDistance;
        }
      }
    }, 100);
  });
}

export function updateTalksMarquee(talks) {
  renderTalksMarquee(talks);
  startMarqueeAnimation();
}
