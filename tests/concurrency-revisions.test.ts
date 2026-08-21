import { describe, it, expect, vi } from 'vitest';
import { PublicationRepository } from '../worker/repositories/publication.repository';
import { RevisionRepository } from '../worker/repositories/revision.repository';
import { ConcurrencyConflictError } from '../worker/errors';

describe('Optimistic Concurrency & Atomic Revision Logging', () => {
  const createMockBatchDb = (currentVersion = 5) => {
    let version = currentVersion;
    const statementsExecuted: string[] = [];

    return {
      version,
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn((...args: any[]) => ({
          sql,
          args
        }))
      })),
      batch: vi.fn(async (statements: any[]) => {
        statements.forEach(s => statementsExecuted.push(s.sql));

        const updateStmt = statements[0];
        const revStmt = statements[1];

        // Check if update expected version matches
        if (updateStmt && updateStmt.sql.includes('UPDATE publications')) {
          const expectedVersion = updateStmt.args[updateStmt.args.length - 1];
          if (expectedVersion === version) {
            version += 1;
            return [
              { success: true, meta: { changes: 1 } },
              { success: true, meta: { changes: 1 } }
            ];
          } else {
            // Version mismatch - 0 rows updated
            return [
              { success: true, meta: { changes: 0 } },
              { success: true, meta: { changes: 0 } }
            ];
          }
        }

        return statements.map(() => ({ success: true, meta: { changes: 1 } }));
      })
    } as unknown as D1Database;
  };

  it('successfully executes atomic update and revision when version matches', async () => {
    const mockDb = createMockBatchDb(5);
    const repo = new PublicationRepository(mockDb);

    // Mock getById
    repo.getById = vi.fn(async (id: string) => ({
      id,
      code_number: 'J1',
      title: 'Updated Title',
      authors: 'Lohith J.J.',
      venue: 'IEEE Access',
      publication_type: 'journal',
      year: 2024,
      doi: null,
      external_url: null,
      pdf_asset_id: null,
      featured: 1,
      published: 1,
      display_order: 1,
      version: 6,
      created_at: '2024-01-01',
      updated_at: new Date().toISOString(),
      metadata: null
    }));

    const result = await repo.updateWithRevision(
      'pub-1',
      {
        code_number: 'J1',
        title: 'Updated Title',
        authors: 'Lohith J.J.',
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
      5,
      'admin@drlohithjj.in'
    );

    expect(result.version).toBe(6);
    expect(mockDb.batch).toHaveBeenCalledTimes(1);
    const batchArgs = (mockDb.batch as any).mock.calls[0][0];
    expect(batchArgs.length).toBe(2); // Statement 1: UPDATE, Statement 2: INSERT revision
    expect(batchArgs[0].sql).toContain('UPDATE publications');
    expect(batchArgs[1].sql).toContain('INSERT INTO revisions');
    expect(batchArgs[1].sql).toContain('WHERE changes() > 0');
  });

  it('throws ConcurrencyConflictError (HTTP 409) when version does not match', async () => {
    const mockDb = createMockBatchDb(5); // DB is at version 5
    const repo = new PublicationRepository(mockDb);

    // Admin attempts to save with stale expectedVersion 4
    await expect(
      repo.updateWithRevision(
        'pub-1',
        {
          code_number: 'J1',
          title: 'Stale Title Edit',
          authors: 'Lohith J.J.',
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
        4, // Stale version
        'admin@drlohithjj.in'
      )
    ).rejects.toThrow(ConcurrencyConflictError);
  });
});
