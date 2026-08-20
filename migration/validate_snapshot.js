import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CanonicalSnapshotSchema } from '../worker/validation/schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');

export function validateSnapshot(filePath = SNAPSHOT_PATH) {
  console.log(`[VALIDATION] Loading snapshot from: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot file not found at: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);

  // 1. Zod Schema Validation
  console.log('[VALIDATION] Executing Zod schema validation...');
  const parseResult = CanonicalSnapshotSchema.safeParse(json);
  if (!parseResult.success) {
    console.error('[VALIDATION FAILED] Zod schema errors:', parseResult.error.format());
    return { success: false, errors: parseResult.error.errors };
  }

  const data = parseResult.data;
  const errors = [];

  // 2. Logical ID Uniqueness Validation
  const idSet = new Set();
  const checkUniqueId = (entityType, item) => {
    if (!item.id) {
      errors.push(`[${entityType}] Missing required ID`);
      return;
    }
    const fullId = `${entityType}:${item.id}`;
    if (idSet.has(fullId)) {
      errors.push(`[${entityType}] Duplicate ID found: ${item.id}`);
    }
    idSet.add(fullId);
  };

  data.experience.forEach(i => checkUniqueId('experience', i));
  data.education.forEach(i => checkUniqueId('education', i));
  data.publications.forEach(i => checkUniqueId('publication', i));
  data.talks.forEach(i => checkUniqueId('talk', i));
  data.awards.forEach(i => checkUniqueId('award', i));
  data.skillCategories.forEach(i => checkUniqueId('skillCategory', i));
  data.socialLinks.forEach(i => checkUniqueId('socialLink', i));
  data.assets.forEach(i => checkUniqueId('asset', i));

  // 3. Expected Entity Count Checks
  const counts = {
    profile: data.profile ? 1 : 0,
    scholarStats: data.scholarStats ? 1 : 0,
    publications: data.publications.length,
    talks: data.talks.length,
    awards: data.awards.length,
    experience: data.experience.length,
    education: data.education.length,
    skillCategories: data.skillCategories.length,
    socialLinks: data.socialLinks.length,
    assets: data.assets.length,
  };

  console.log('[VALIDATION] Verified Record Counts:', counts);

  if (counts.publications !== 13) errors.push(`Expected 13 publications, got ${counts.publications}`);
  if (counts.talks !== 53) errors.push(`Expected 53 talks, got ${counts.talks}`);
  if (counts.awards !== 25) errors.push(`Expected 25 awards, got ${counts.awards}`);
  if (counts.experience !== 6) errors.push(`Expected 6 experience records, got ${counts.experience}`);
  if (counts.education !== 3) errors.push(`Expected 3 education records, got ${counts.education}`);
  if (counts.skillCategories !== 4) errors.push(`Expected 4 skill categories, got ${counts.skillCategories}`);
  if (counts.socialLinks !== 7) errors.push(`Expected 7 social links, got ${counts.socialLinks}`);

  // 4. Asset Reference Integrity
  const assetIdSet = new Set(data.assets.map(a => a.id));
  if (data.profile.photoAsset && !assetIdSet.has(data.profile.photoAsset)) {
    errors.push(`Profile photoAsset '${data.profile.photoAsset}' does not reference a valid asset ID.`);
  }

  for (const asset of data.assets) {
    const localFile = path.join(__dirname, '..', asset.localPath);
    if (!fs.existsSync(localFile)) {
      errors.push(`Referenced local asset file does not exist: ${asset.localPath}`);
    }
  }

  if (errors.length > 0) {
    console.error(`[VALIDATION FAILED] ${errors.length} logical errors:`, errors);
    return { success: false, errors };
  }

  console.log('✅ [VALIDATION SUCCESS] Snapshot passed all schema and logical checks!');
  return { success: true, data, counts };
}

if (process.argv[1] && process.argv[1].endsWith('validate_snapshot.js')) {
  const res = validateSnapshot();
  if (!res.success) process.exit(1);
}
