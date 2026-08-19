import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeSnapshot, deepSortKeys } from './normalize_snapshot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');
const MANIFEST_PATH = path.join(__dirname, 'migration-manifest.json');
const CHECKSUM_PATH = path.join(__dirname, 'migration-manifest.sha256');

export function hashString(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

export function hashObject(obj) {
  const sorted = deepSortKeys(obj);
  return hashString(JSON.stringify(sorted));
}

export function generateManifest(filePath = SNAPSHOT_PATH) {
  console.log('[MANIFEST] Generating deterministic cryptographic migration manifest...');

  // Normalize first to ensure determinism
  const snapshot = normalizeSnapshot(filePath);
  const rawFile = fs.readFileSync(filePath);
  const snapshotChecksum = crypto.createHash('sha256').update(rawFile).digest('hex');

  const recordHashes = [];

  // 1. Singletons
  recordHashes.push({
    entityType: 'profile',
    id: 'profile',
    sha256: hashObject(snapshot.profile)
  });

  recordHashes.push({
    entityType: 'scholarStats',
    id: 'scholarStats',
    sha256: hashObject(snapshot.scholarStats)
  });

  // 2. Collections
  const addListHashes = (entityType, items) => {
    for (const item of items) {
      recordHashes.push({
        entityType,
        id: item.id,
        sha256: hashObject(item)
      });
    }
  };

  addListHashes('experience', snapshot.experience);
  addListHashes('education', snapshot.education);
  addListHashes('publication', snapshot.publications);
  addListHashes('talk', snapshot.talks);
  addListHashes('award', snapshot.awards);
  addListHashes('skillCategory', snapshot.skillCategories);
  addListHashes('socialLink', snapshot.socialLinks);

  // 3. Asset file hashes
  const assetHashes = [];
  for (const asset of snapshot.assets) {
    const fullPath = path.join(__dirname, '..', asset.localPath);
    let fileHash = null;
    if (fs.existsSync(fullPath)) {
      fileHash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
    }
    assetHashes.push({
      id: asset.id,
      filename: asset.filename,
      localPath: asset.localPath,
      metadataSha256: hashObject(asset),
      fileSha256: fileHash
    });
  }

  const manifest = {
    version: '1.0.0',
    migrationSource: 'CURRENT_PORTFOLIO_CANONICAL_SNAPSHOT',
    snapshotFile: 'current-portfolio-snapshot.json',
    snapshotSha256: snapshotChecksum,
    generatedAt: snapshot.generatedAt || new Date().toISOString(),
    entityCounts: {
      profile: 1,
      scholarStats: 1,
      publications: snapshot.publications.length,
      talks: snapshot.talks.length,
      awards: snapshot.awards.length,
      experience: snapshot.experience.length,
      education: snapshot.education.length,
      skillCategories: snapshot.skillCategories.length,
      socialLinks: snapshot.socialLinks.length,
      assets: snapshot.assets.length,
      totalEntities: 2 + snapshot.publications.length + snapshot.talks.length + snapshot.awards.length +
                     snapshot.experience.length + snapshot.education.length + snapshot.skillCategories.length +
                     snapshot.socialLinks.length
    },
    recordHashes,
    assetHashes
  };

  const manifestJson = JSON.stringify(manifest, null, 2) + '\n';
  fs.writeFileSync(MANIFEST_PATH, manifestJson, 'utf8');

  const manifestChecksum = crypto.createHash('sha256').update(manifestJson).digest('hex');
  fs.writeFileSync(CHECKSUM_PATH, `${manifestChecksum}  migration-manifest.json\n`, 'utf8');

  console.log(`✅ [MANIFEST SUCCESS] Created ${MANIFEST_PATH}`);
  console.log(`   • Snapshot SHA-256: ${snapshotChecksum}`);
  console.log(`   • Manifest SHA-256: ${manifestChecksum}`);
  console.log(`   • Total Records Tracked: ${recordHashes.length}`);
  console.log(`   • Total Assets Tracked: ${assetHashes.length}`);

  return { manifest, snapshotChecksum, manifestChecksum };
}

if (process.argv[1] && process.argv[1].endsWith('generate_manifest.js')) {
  generateManifest();
}
