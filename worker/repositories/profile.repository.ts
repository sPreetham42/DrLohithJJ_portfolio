// ================================================================
// PROFILE REPOSITORY
// Singleton profile data access with atomic D1 batch mutation & revision auditing
// ================================================================

import { ProfileRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';
import { RevisionRepository } from './revision.repository';

export class ProfileRepository {
  constructor(private db: D1Database) {}

  async get(): Promise<ProfileRecord | null> {
    return await this.db
      .prepare('SELECT * FROM profile WHERE id = ?')
      .bind('profile')
      .first<ProfileRecord>();
  }

  prepareUpdateStatement(
    data: Omit<ProfileRecord, 'id' | 'version' | 'updated_at'>,
    expectedVersion: number,
    now: string
  ): D1PreparedStatement {
    return this.db
      .prepare(`
        UPDATE profile SET
          name = ?,
          credential = ?,
          designation = ?,
          years_experience = ?,
          current_institution = ?,
          hero_description_line1 = ?,
          hero_description_line2 = ?,
          email_primary = ?,
          email_secondary = ?,
          phone = ?,
          address = ?,
          photo_asset_id = ?,
          additional_roles_json = ?,
          professional_memberships_json = ?,
          version = version + 1,
          updated_at = ?,
          metadata = ?
        WHERE id = 'profile' AND version = ?
      `)
      .bind(
        data.name,
        data.credential || null,
        data.designation,
        data.years_experience,
        data.current_institution,
        data.hero_description_line1,
        data.hero_description_line2,
        data.email_primary,
        data.email_secondary || null,
        data.phone,
        data.address,
        data.photo_asset_id || null,
        data.additional_roles_json,
        data.professional_memberships_json,
        now,
        data.metadata || null,
        expectedVersion
      );
  }

  async updateWithRevision(
    data: Omit<ProfileRecord, 'id' | 'version' | 'updated_at'>,
    expectedVersion: number,
    author: string
  ): Promise<ProfileRecord> {
    const now = new Date().toISOString();
    const nextVersion = expectedVersion + 1;
    const updateStmt = this.prepareUpdateStatement(data, expectedVersion, now);

    const revRepo = new RevisionRepository(this.db);
    const revStmt = revRepo.createConditionalRevisionStatement({
      id: `rev-profile-profile-${nextVersion}-${Date.now()}`,
      entity_type: 'profile',
      entity_id: 'profile',
      version: nextVersion,
      action: 'update',
      payload_json: JSON.stringify({ ...data, version: nextVersion }),
      author,
      created_at: now
    });

    const [updateRes] = await this.db.batch([updateStmt, revStmt]);

    if (!updateRes.success || updateRes.meta.changes === 0) {
      throw new ConcurrencyConflictError('profile', 'profile', expectedVersion);
    }

    const updated = await this.get();
    if (!updated) throw new Error('Failed to retrieve updated profile');
    return updated;
  }

  async update(
    data: Omit<ProfileRecord, 'id' | 'version' | 'updated_at'>,
    expectedVersion: number
  ): Promise<ProfileRecord> {
    return await this.updateWithRevision(data, expectedVersion, 'system');
  }
}
