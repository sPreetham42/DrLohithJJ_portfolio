import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.join(__dirname, '..', 'current-portfolio-snapshot.json');

export function deepSortKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map(deepSortKeys);
  } else if (obj !== null && typeof obj === 'object') {
    const sorted = {};
    Object.keys(obj)
      .sort()
      .forEach(key => {
        sorted[key] = deepSortKeys(obj[key]);
      });
    return sorted;
  }
  return obj;
}

export function normalizeSnapshotData(parsed) {
  const clone = JSON.parse(JSON.stringify(parsed));

  // Sort list collections deterministically by order and id
  if (Array.isArray(clone.publications)) {
    clone.publications.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }
  if (Array.isArray(clone.talks)) {
    clone.talks.sort((a, b) => b.year - a.year || a.order - b.order || a.id.localeCompare(b.id));
  }
  if (Array.isArray(clone.awards)) {
    clone.awards.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }
  if (Array.isArray(clone.experience)) {
    clone.experience.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }
  if (Array.isArray(clone.education)) {
    clone.education.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }
  if (Array.isArray(clone.skillCategories)) {
    clone.skillCategories.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }
  if (Array.isArray(clone.socialLinks)) {
    clone.socialLinks.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  }
  if (Array.isArray(clone.assets)) {
    clone.assets.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Deep recursive key sort
  return deepSortKeys(clone);
}

export function normalizeSnapshot(filePath = SNAPSHOT_PATH, options = { writeToFile: false }) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Snapshot file not found at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const normalized = normalizeSnapshotData(parsed);

  if (options.writeToFile) {
    const normalizedJson = JSON.stringify(normalized, null, 2) + '\n';
    fs.writeFileSync(filePath, normalizedJson, 'utf8');
    console.log(`[NORMALIZE] Written normalized snapshot to: ${filePath}`);
  }

  return normalized;
}

if (process.argv[1] && process.argv[1].endsWith('normalize_snapshot.js')) {
  const shouldWrite = process.argv.includes('--write');
  normalizeSnapshot(SNAPSHOT_PATH, { writeToFile: shouldWrite });
}
