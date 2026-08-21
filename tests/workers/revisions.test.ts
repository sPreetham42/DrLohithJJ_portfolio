// ================================================================
// CLOUDFLARE WORKERS RUNTIME TEST: REVISION ATOMICITY
// Verifies transaction batch atomicity and revision creation in the
// real Cloudflare Workers D1 runtime.
// ================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { applyWorkerMigrations, seedWorkerFixtures } from './helpers/setup';
import { PublicationRepository } from '../../worker/repositories/publication.repository';
import { RevisionRepository } from '../../worker/repositories/revision.repository';

describe('Cloudflare Workers Runtime: Revision Atomicity', () => {
  let pubRepo: PublicationRepository;
  let revRepo: RevisionRepository;

  beforeAll(async () => {
    await applyWorkerMigrations(env.DB);
    await seedWorkerFixtures(env.DB);
    pubRepo = new PublicationRepository(env.DB);
    revRepo = new RevisionRepository(env.DB);
  });

  it('proves successful mutation writes content and revision record in single D1 batch', async () => {
    const updated = await pubRepo.updateWithRevision(
      'pub-j1',
      {
        code_number: 'J1',
        title: 'Batch Atomicity Test Title',
        authors: 'Dr. Lohith J.J.',
        venue: 'IEEE Access',
        publication_type: 'journal',
        year: 2024,
        doi: '10.1109/ACCESS.2024.3411075',
        external_url: 'https://doi.org/10.1109/ACCESS.2024.3411075',
        pdf_asset_id: null,
        featured: 1,
        published: 1,
        display_order: 1,
        metadata: null
      },
      1,
      'admin@drlohithjj.in'
    );

    expect(updated.version).toBe(2);

    const dbPub = (await env.DB.prepare('SELECT * FROM publications WHERE id = ?').bind('pub-j1').first()) as any;
    expect(dbPub.version).toBe(2);
    expect(dbPub.title).toBe('Batch Atomicity Test Title');

    const revs = await revRepo.getHistoryForEntity('publication', 'pub-j1');
    expect(revs.length).toBeGreaterThanOrEqual(1);
    expect(revs[0].version).toBe(2);
    expect(revs[0].author).toBe('admin@drlohithjj.in');
  });

  it('proves stale version mismatch creates ZERO revision rows in D1', async () => {
    const revsBefore = await revRepo.getHistoryForEntity('publication', 'pub-j1');
    const countBefore = revsBefore.length;

    await expect(
      pubRepo.updateWithRevision(
        'pub-j1',
        {
          code_number: 'J1',
          title: 'Illegal Stale Write In Workers Runtime',
          authors: 'Dr. Lohith J.J.',
          venue: 'IEEE Access',
          publication_type: 'journal',
          year: 2024,
          doi: null,
          external_url: null,
          pdf_asset_id: null,
          featured: 1,
          published: 1,
          display_order: 1,
          metadata: null
        },
        1, // Stale version (current is 2)
        'attacker@gmail.com'
      )
    ).rejects.toThrow();

    const revsAfter = await revRepo.getHistoryForEntity('publication', 'pub-j1');
    expect(revsAfter.length).toBe(countBefore);
  });
});
