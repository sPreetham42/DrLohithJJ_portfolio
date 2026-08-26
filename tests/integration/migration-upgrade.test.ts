// ================================================================
// REAL WORKER + D1 INTEGRATION TEST: MIGRATION UPGRADE PATH
// Verifies sequential migration execution from fresh install (0001-0005)
// and upgrade progression with data already present.
// ================================================================

import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

describe('Real D1 Migration Upgrade Progression', () => {
  const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
  const readMigration = (filename: string) =>
    fs.readFileSync(path.join(migrationsDir, filename), 'utf-8');

  it('Fresh Install: executes 0001 to 0005 on an empty database cleanly', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    expect(files.length).toBe(7);

    for (const file of files) {
      expect(() => db.exec(readMigration(file))).not.toThrow();
    }

    const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
    expect(fkCheck.length).toBe(0);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all()
      .map((t: any) => t.name);

    expect(tables).toContain('profile');
    expect(tables).toContain('scholar_stats');
    expect(tables).toContain('assets');
    expect(tables).toContain('publications');
    expect(tables).toContain('talks');
    expect(tables).toContain('experience');
    expect(tables).toContain('education');
    expect(tables).toContain('awards');
    expect(tables).toContain('skill_categories');
    expect(tables).toContain('social_links');
    expect(tables).toContain('revisions');
    expect(tables).toContain('scholar_sync_runs');
    expect(tables).toContain('admin_sessions');
    expect(tables).toContain('patents');
    expect(tables).toContain('research_scholars');
  });

  it('Upgrade Path: migrates state from 0001 baseline through 0007 without data loss', () => {
    const db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    // 1. Apply Migration 0001
    db.pragma('foreign_keys = OFF'); // Legacy pre-migration seed state
    db.exec(readMigration('0001_initial_schema.sql'));

    // Insert legacy asset & profile referencing storage_key path
    db.prepare(`
      INSERT INTO assets (id, storage_key, filename, mime_type, byte_size, is_primary_photo, created_at)
      VALUES ('asset-headshot', 'assets/Dr Lohith J J.jpeg', 'Dr Lohith J J.jpeg', 'image/jpeg', 266676, 1, '2024-01-01')
    `).run();

    db.prepare(`
      INSERT INTO profile (
        id, name, designation, years_experience, current_institution,
        hero_description_line1, hero_description_line2, email_primary,
        phone, address, photo_asset_id, updated_at
      ) VALUES (
        'profile', 'Dr. Lohith J.J.', 'Professor', 20, 'NCET',
        'Hero 1', 'Hero 2', 'lohithjj@gmail.com',
        '+91-9886745882', 'Bengaluru', 'assets/Dr Lohith J J.jpeg', '2024-01-01'
      )
    `).run();

    // 2. Apply Migration 0002 (revisions)
    expect(() => db.exec(readMigration('0002_create_revisions.sql'))).not.toThrow();

    // 3. Apply Migration 0003 (hardening & indexes)
    expect(() => db.exec(readMigration('0003_hardening_updates.sql'))).not.toThrow();

    // 4. Apply Migration 0004 (admin_sessions)
    expect(() => db.exec(readMigration('0004_create_admin_sessions.sql'))).not.toThrow();

    // 5. Apply Migration 0005 (photo asset FK normalization)
    expect(() => db.exec(readMigration('0005_fix_profile_photo_asset_fk.sql'))).not.toThrow();

    // 6. Apply Migration 0006 (patents & research_scholars)
    expect(() => db.exec(readMigration('0006_create_patents_and_research_scholars.sql'))).not.toThrow();

    // 7. Apply Migration 0007 (add_patent_status)
    expect(() => db.exec(readMigration('0007_add_patent_status.sql'))).not.toThrow();

    // Enable strict foreign keys and verify normalization
    db.pragma('foreign_keys = ON');

    // Verify Migration 0005 normalized photo_asset_id from 'assets/Dr Lohith J J.jpeg' to 'asset-headshot'
    const profile = db.prepare('SELECT photo_asset_id FROM profile WHERE id = ?').get('profile') as any;
    expect(profile.photo_asset_id).toBe('asset-headshot');

    // Verify Migration 0007 added status column to patents
    const patentCols = db.prepare("PRAGMA table_info('patents')").all() as any[];
    expect(patentCols.some((c: any) => c.name === 'status')).toBe(true);

    // Verify foreign key integrity
    const fkCheck = db.prepare('PRAGMA foreign_key_check').all();
    expect(fkCheck.length).toBe(0);
  });
});
