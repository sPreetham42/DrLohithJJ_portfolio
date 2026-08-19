import { ProfileRecord } from '../types';
import { ConcurrencyConflictError } from '../errors';

export class ProfileRepository {
  constructor(private db: D1Database) {}

  async get(): Promise<ProfileRecord | null> {
    return await this.db
      .prepare('SELECT * FROM profile WHERE id = ?')
      .bind('profile')
      .first<ProfileRecord>();
  }

  async update(
    data: Omit<ProfileRecord, 'id' | 'version' | 'updated_at'>,
    expectedVersion: number
  ): Promise<ProfileRecord> {
    const now = new Date().toISOString();

    const result = await this.db
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
      )
      .run();

    if (!result.success || result.meta.changes === 0) {
      throw new ConcurrencyConflictError('profile', 'profile', expectedVersion);
    }

    const updated = await this.get();
    if (!updated) throw new Error('Failed to retrieve updated profile');
    return updated;
  }
}
