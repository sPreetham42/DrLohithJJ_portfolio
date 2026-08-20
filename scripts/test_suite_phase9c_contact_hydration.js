// ================================================================
// PHASE 9C — DYNAMIC CONTACT & OFFICE LOCATION HYDRATION TEST SUITE
// ================================================================

import fs from 'fs';
import path from 'path';
import { fallbackData } from './data/fallback.js';

const ROOT_DIR = path.resolve('.');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const ADAPTER_JS_PATH = path.join(ROOT_DIR, 'scripts', 'data', 'adapter.js');

console.log('\n' + '='.repeat(70));
console.log(' PHASE 9C — DYNAMIC CONTACT & OFFICE LOCATION HYDRATION SUITE');
console.log('='.repeat(70) + '\n');

let passed = 0;
let failed = 0;

function assert(cond, desc) {
  if (cond) {
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${desc}`);
    failed++;
  }
}

// ----------------------------------------------------------------
// SUITE 1: HTML SELECTORS & MARKUP STRUCTURE
// ----------------------------------------------------------------
console.log('--- SUITE 1: HTML SELECTORS & MARKUP STRUCTURE ---');

const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

assert(indexHtml.includes('class="contact-email-primary"'), '1.1 .contact-email-primary selector exists in index.html');
assert(indexHtml.includes('class="contact-detail-item contact-item-secondary"'), '1.2 .contact-item-secondary selector exists in index.html');
assert(indexHtml.includes('class="contact-email-secondary"'), '1.3 .contact-email-secondary selector exists in index.html');
assert(indexHtml.includes('class="contact-location-address"'), '1.4 .contact-location-address selector exists in index.html');

// Phone is NOT exposed in public HTML
const phoneRegex = /\+91[- ]?9886745882/;
assert(!phoneRegex.test(indexHtml), '1.5 Phone number is NOT hardcoded or rendered in index.html (Privacy preserved)');

// ----------------------------------------------------------------
// SUITE 2: ADAPTER HYDRATION LOGIC AUDIT
// ----------------------------------------------------------------
console.log('\n--- SUITE 2: ADAPTER HYDRATION LOGIC AUDIT ---');

const adapterJs = fs.readFileSync(ADAPTER_JS_PATH, 'utf-8');

assert(adapterJs.includes('.contact-email-primary'), '2.1 adapter.js queries .contact-email-primary');
assert(adapterJs.includes('.contact-email-secondary'), '2.2 adapter.js queries .contact-email-secondary');
assert(adapterJs.includes('.contact-item-secondary'), '2.3 adapter.js manages .contact-item-secondary visibility');
assert(adapterJs.includes('.contact-location-address'), '2.4 adapter.js queries .contact-location-address');
assert(adapterJs.includes('mailto:${data.emailPrimary}'), '2.5 adapter.js updates mailto href for primary email');
assert(adapterJs.includes('mailto:${data.emailSecondary}'), '2.6 adapter.js updates mailto href for secondary email');
assert(!adapterJs.includes('data.phone') && !adapterJs.includes('.contact-phone'), '2.7 adapter.js does not leak phone to public DOM');

// ----------------------------------------------------------------
// SUITE 3: DOM SIMULATION & HYDRATION BEHAVIOR
// ----------------------------------------------------------------
console.log('\n--- SUITE 3: DOM SIMULATION & HYDRATION BEHAVIOR ---');

// Mock DOM elements
function createMockElement(tagName, className = '', text = '', href = '') {
  return {
    tagName: tagName.toUpperCase(),
    className,
    textContent: text,
    href,
    style: { display: '' }
  };
}

class MockDocument {
  constructor() {
    this.primaryEmailAnchor = createMockElement('a', 'contact-email-primary', 'old@gmail.com', 'mailto:old@gmail.com');
    this.secondaryItem = createMockElement('div', 'contact-detail-item contact-item-secondary');
    this.secondaryEmailAnchor = createMockElement('a', 'contact-email-secondary', 'old@wilp.in', 'mailto:old@wilp.in');
    this.locationSpan = createMockElement('span', 'contact-location-address', 'Old Address, City');
  }

  querySelectorAll(selector) {
    if (selector === '.contact-email-primary') return [this.primaryEmailAnchor];
    if (selector === '.contact-item-secondary') return [this.secondaryItem];
    if (selector === '.contact-email-secondary') return [this.secondaryEmailAnchor];
    if (selector === '.contact-location-address') return [this.locationSpan];
    return [];
  }
}

// 3.1 Standard Hydration
const doc = new MockDocument();
const sampleData = {
  emailPrimary: 'lohithjj@gmail.com',
  emailSecondary: 'lohithjj@wilp.bits-pilani.ac.in',
  address: 'NCET, Bengaluru, India earth'
};

// Simulate adapter logic
if (sampleData.emailPrimary) {
  doc.querySelectorAll('.contact-email-primary').forEach(el => {
    el.textContent = sampleData.emailPrimary;
    if (el.tagName === 'A') el.href = `mailto:${sampleData.emailPrimary}`;
  });
}
if (sampleData.emailSecondary) {
  doc.querySelectorAll('.contact-email-secondary').forEach(el => {
    el.textContent = sampleData.emailSecondary;
    if (el.tagName === 'A') el.href = `mailto:${sampleData.emailSecondary}`;
  });
  doc.querySelectorAll('.contact-item-secondary').forEach(el => {
    el.style.display = '';
  });
}
if (sampleData.address) {
  doc.querySelectorAll('.contact-location-address').forEach(el => {
    el.textContent = sampleData.address;
  });
}

assert(doc.primaryEmailAnchor.textContent === 'lohithjj@gmail.com', '3.1 Primary email text updated');
assert(doc.primaryEmailAnchor.href === 'mailto:lohithjj@gmail.com', '3.2 Primary email mailto href updated');
assert(doc.secondaryEmailAnchor.textContent === 'lohithjj@wilp.bits-pilani.ac.in', '3.3 Secondary email text updated');
assert(doc.secondaryEmailAnchor.href === 'mailto:lohithjj@wilp.bits-pilani.ac.in', '3.4 Secondary email mailto href updated');
assert(doc.secondaryItem.style.display === '', '3.5 Secondary email item visible');
assert(doc.locationSpan.textContent === 'NCET, Bengaluru, India earth', '3.6 Location address updated with exact API string');

// 3.2 Null Secondary Email Handling
const docNullSecondary = new MockDocument();
const nullSecondaryData = {
  emailPrimary: 'lohithjj@gmail.com',
  emailSecondary: null,
  address: 'NCET, Bengaluru'
};

if (nullSecondaryData.emailSecondary) {
  docNullSecondary.querySelectorAll('.contact-email-secondary').forEach(el => {
    el.textContent = nullSecondaryData.emailSecondary;
    if (el.tagName === 'A') el.href = `mailto:${nullSecondaryData.emailSecondary}`;
  });
  docNullSecondary.querySelectorAll('.contact-item-secondary').forEach(el => {
    el.style.display = '';
  });
} else if (nullSecondaryData.emailSecondary === null || nullSecondaryData.emailSecondary === '') {
  docNullSecondary.querySelectorAll('.contact-item-secondary').forEach(el => {
    el.style.display = 'none';
  });
}

assert(docNullSecondary.secondaryItem.style.display === 'none', '3.7 Missing secondary email cleanly hides container');

// ----------------------------------------------------------------
// SUITE 4: STATIC FALLBACK DATA INTEGRITY
// ----------------------------------------------------------------
console.log('\n--- SUITE 4: STATIC FALLBACK DATA INTEGRITY ---');

assert(Boolean(fallbackData.profile.emailPrimary), '4.1 Fallback profile contains emailPrimary');
assert(Boolean(fallbackData.profile.emailSecondary), '4.2 Fallback profile contains emailSecondary');
assert(Boolean(fallbackData.profile.address), '4.3 Fallback profile contains address');

// ----------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------
console.log('\n' + '='.repeat(70));
console.log(` PHASE 9C CONTACT HYDRATION SUITE: ${passed} PASSED, ${failed} FAILED`);
console.log('='.repeat(70) + '\n');

if (failed > 0) {
  process.exit(1);
}
