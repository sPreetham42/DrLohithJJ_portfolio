// ================================================================
// REAL WORKER + D1 INTEGRATION TEST: REVISION & TRANSACTION ATOMICITY
// Proves transactional rollback on real D1 SQLite:
// 1. Mutation failure -> No revision inserted
// 2. Revision failure -> No content mutation persisted
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { createLocalTestD1, seedLocalTestD1, LocalD1Database } from '../helpers/d1-sqlite';
import { PublicationRepository } from '../../worker/repositories/publication.repository';
import { RevisionRepository } from '../../worker/repositories/revision.repository';

describe('Real Worker + D1 Integration: Revision Atomicity & Rollback', () => {
  let localDb: LocalD1Database;
  let pubRepo: PublicationRepository;
  let revRepo: RevisionRepository;

  beforeAll(async () => {
    localDb = await createLocalTestD1();
    await seedLocalTestD1(localDb);
    pubRepo = new PublicationRepository(localDb);
    revRepo = new RevisionRepository(localDb);
  });

  it('proves successful mutation creates both content update and audit revision atomically', async () => {
    const updated = await pubRepo.updateWithRevision(
      'pub-j2',
      {
        code_number: 'J2',
        title: 'Trigram-Pixel Image-Based Automated Vulnerability Detection [Updated]',
        authors: 'Lohith, J. J., & Eswari, R.',
        venue: 'Journal of The Institution of Engineers (India): Series B',
        publication_type: 'journal',
        year: 2024,
        doi: '10.1007/s41870-024-01909-8',
        external_url: 'https://doi.org/10.1007/s41870-024-01909-8',
        pdf_asset_id: null,
        featured: 1,
        published: 1,
        display_order: 2,
        metadata: null
      },
      1,
      'lohithjj@gmail.com'
    );

    expect(updated.version).toBe(2);

    const dbPub = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j2') as any;
    expect(dbPub.version).toBe(2);
    expect(dbPub.title).toContain('[Updated]');

    const revs = await revRepo.getHistoryForEntity('publication', 'pub-j2');
    expect(revs.length).toBe(1);
    expect(revs[0].version).toBe(2);
    expect(revs[0].action).toBe('update');
  });

  it('proves mutation failure (concurrency conflict) inserts ZERO revision rows', async () => {
    // Current version in DB is 2. We submit stale expectedVersion: 1
    const revsBefore = await revRepo.getHistoryForEntity('publication', 'pub-j2');
    const initialRevCount = revsBefore.length;

    await expect(
      pubRepo.updateWithRevision(
        'pub-j2',
        {
          code_number: 'J2',
          title: 'Illegal Stale Write',
          authors: 'Lohith, J. J.',
          venue: 'Journal',
          publication_type: 'journal',
          year: 2024,
          doi: null,
          external_url: null,
          pdf_asset_id: null,
          featured: 1,
          published: 1,
          display_order: 2,
          metadata: null
        },
        1, // Stale version
        'attacker@gmail.com'
      )
    ).rejects.toThrow();

    // Verify DB content was NOT modified
    const dbPub = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j2') as any;
    expect(dbPub.version).toBe(2);
    expect(dbPub.title).not.toContain('Illegal Stale Write');

    // Verify ZERO revisions were added
    const revsAfter = await revRepo.getHistoryForEntity('publication', 'pub-j2');
    expect(revsAfter.length).toBe(initialRevCount);
  });

  it('proves batch rollback: if revision fails (PK collision), content mutation is rolled back', async () => {
    // Setup a pre-existing revision with fixed ID 'collision-rev-id'
    const collisionId = 'collision-rev-pub-j3-version-2';
    localDb.rawDb.prepare(`
      INSERT INTO revisions (id, entity_type, entity_id, version, action, payload_json, author, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(collisionId, 'publication', 'pub-j3', 999, 'create', '{}', 'setup', new Date().toISOString());

    // Prepare an update statement on pub-j3
    const now = new Date().toISOString();
    const updateStmt = pubRepo.prepareUpdateStatement(
      'pub-j3',
      {
        code_number: 'J3',
        title: 'Title That Must Roll Back Due To Revision Failure',
        authors: 'Lohith, J. J.',
        venue: 'Wiley',
        publication_type: 'journal',
        year: 2023,
        doi: null,
        external_url: null,
        pdf_asset_id: null,
        featured: 1,
        published: 1,
        display_order: 3,
        metadata: null
      },
      1,
      now
    );

    // Prepare revision statement with COLLIDING primary key
    const collidingRevStmt = localDb
      .prepare(`
        INSERT INTO revisions (id, entity_type, entity_id, version, action, payload_json, author, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        collisionId, // Duplicate ID -> Causes PRIMARY KEY constraint violation
        'publication',
        'pub-j3',
        2,
        'update',
        JSON.stringify({ test: 'rollback' }),
        'admin',
        now
      );

    // Execute both in a single D1 batch transaction
    await expect(
      localDb.batch([updateStmt, collidingRevStmt])
    ).rejects.toThrow();

    // Verify Transaction Rollback: pub-j3 title must NOT have changed, and version must remain 1
    const pubJ3 = localDb.rawDb.prepare('SELECT * FROM publications WHERE id = ?').get('pub-j3') as any;
    expect(pubJ3.version).toBe(1);
    expect(pubJ3.title).not.toContain('Title That Must Roll Back');
  });
});
