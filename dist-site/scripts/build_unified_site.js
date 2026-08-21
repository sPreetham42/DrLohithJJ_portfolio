// ================================================================
// UNIFIED SITE BUILDER FOR CLOUDFLARE WORKER STATIC ASSETS
// Assembles the public portfolio (/) and Admin SPA (/dashboard)
// into a unified deployment directory (dist-site/).
// ================================================================

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = path.resolve('.');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'dist-site');
const ADMIN_DIST = path.resolve(ROOT_DIR, 'dist-admin');

console.log('='.repeat(70));
console.log(' BUILDING UNIFIED CLOUDFLARE STATIC ASSET BUNDLE (dist-site/)');
console.log('='.repeat(70) + '\n');

// 1. Clean output directory
if (fs.existsSync(OUTPUT_DIR)) {
  try {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  } catch {
    // If folder handle is locked by dev server, empty contents
    fs.readdirSync(OUTPUT_DIR).forEach(f => {
      fs.rmSync(path.join(OUTPUT_DIR, f), { recursive: true, force: true });
    });
  }
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 2. Build Admin SPA if needed
console.log('[1/4] Building React 19 Admin SPA (base: /dashboard/)...');
execSync('npm run build:admin', { stdio: 'inherit', cwd: ROOT_DIR });

// 3. Copy public portfolio static assets to dist-site/
console.log('[2/4] Copying public portfolio static assets to root of dist-site/...');
fs.copyFileSync(path.join(ROOT_DIR, 'index.html'), path.join(OUTPUT_DIR, 'index.html'));

if (fs.existsSync(path.join(ROOT_DIR, 'CNAME'))) {
  fs.copyFileSync(path.join(ROOT_DIR, 'CNAME'), path.join(OUTPUT_DIR, 'CNAME'));
}
if (fs.existsSync(path.join(ROOT_DIR, 'robots.txt'))) {
  fs.copyFileSync(path.join(ROOT_DIR, 'robots.txt'), path.join(OUTPUT_DIR, 'robots.txt'));
}
if (fs.existsSync(path.join(ROOT_DIR, 'sitemap.xml'))) {
  fs.copyFileSync(path.join(ROOT_DIR, 'sitemap.xml'), path.join(OUTPUT_DIR, 'sitemap.xml'));
}

const copyDirRecursive = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

copyDirRecursive(path.join(ROOT_DIR, 'styles'), path.join(OUTPUT_DIR, 'styles'));
copyDirRecursive(path.join(ROOT_DIR, 'scripts'), path.join(OUTPUT_DIR, 'scripts'));
copyDirRecursive(path.join(ROOT_DIR, 'assets'), path.join(OUTPUT_DIR, 'assets'));
copyDirRecursive(path.join(ROOT_DIR, 'data'), path.join(OUTPUT_DIR, 'data'));

// 4. Copy Admin SPA into dist-site/dashboard/
console.log('[3/4] Packaging Admin SPA into dist-site/dashboard/...');
const dashboardDir = path.join(OUTPUT_DIR, 'dashboard');
fs.mkdirSync(dashboardDir, { recursive: true });
copyDirRecursive(ADMIN_DIST, dashboardDir);

// 5. Verification
console.log('[4/4] Verifying unified structure...');
const checks = [
  { path: path.join(OUTPUT_DIR, 'index.html'), label: 'Public index.html' },
  { path: path.join(OUTPUT_DIR, 'styles', 'main.css'), label: 'Public styles/main.css' },
  { path: path.join(OUTPUT_DIR, 'scripts', 'main.js'), label: 'Public scripts/main.js' },
  { path: path.join(OUTPUT_DIR, 'dashboard', 'index.html'), label: 'Admin dashboard/index.html' },
  { path: path.join(OUTPUT_DIR, 'dashboard', 'assets'), label: 'Admin dashboard/assets/' }
];

let allPassed = true;
for (const check of checks) {
  if (fs.existsSync(check.path)) {
    console.log(`  ✅ [PASS] ${check.label} packaged`);
  } else {
    console.error(`  ❌ [FAIL] Missing: ${check.label} at ${check.path}`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error('\n❌ Unified site build failed.');
  process.exit(1);
}

console.log('\n' + '='.repeat(70));
console.log(' ✅ UNIFIED BUNDLE READY IN dist-site/');
console.log('    • Public Portfolio:  dist-site/index.html (and subdirectories)');
console.log('    • Admin Dashboard:   dist-site/dashboard/index.html');
console.log('='.repeat(70) + '\n');
