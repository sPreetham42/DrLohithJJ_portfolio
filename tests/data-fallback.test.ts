import { describe, it, expect } from 'vitest';
import { fallbackData } from '../scripts/data/fallback.js';
import {
  toPublicProfileDto,
  toPublicScholarStatsDto,
  toPublicPublicationDto,
  toPublicTalkDto
} from '../worker/dto/public.dto';

describe('Canonical Fallback Data & Public DTO Mappers', () => {
  it('contains complete canonical profile data matching professor identity', () => {
    expect(fallbackData.profile.name).toBe('Dr. Lohith J.J.');
    expect(fallbackData.profile.credential).toContain('Ph.D.');
    expect(fallbackData.profile.yearsExperience).toBeGreaterThanOrEqual(20);
    expect(fallbackData.profile.emailPrimary).toBe('lohithjj@gmail.com');
  });

  it('contains valid numeric scholar stats without NaN or string formats', () => {
    expect(typeof fallbackData.scholarStats.citations).toBe('number');
    expect(fallbackData.scholarStats.citations).toBeGreaterThan(0);
    expect(typeof fallbackData.scholarStats.hIndex).toBe('number');
    expect(typeof fallbackData.scholarStats.sciePapersCount).toBe('number');
  });

  it('correctly maps D1 database records to Public DTOs with camelCase keys', () => {
    const d1Pub = {
      id: 'pub-test-1',
      code_number: 'J1',
      title: 'Static Analysis of Smart Contracts',
      authors: 'Lohith J.J.',
      venue: 'IEEE Access',
      publication_type: 'journal' as const,
      year: 2024,
      doi: '10.1109/ACCESS.2024.123',
      external_url: 'https://doi.org/10.1109/ACCESS.2024.123',
      pdf_asset_id: null,
      featured: 1,
      published: 1,
      display_order: 1,
      version: 1,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      metadata: null
    };

    const dto = toPublicPublicationDto(d1Pub);
    expect(dto.id).toBe('pub-test-1');
    expect(dto.codeNumber).toBe('J1');
    expect(dto.publicationType).toBe('journal');
    expect(dto.featured).toBe(true);
    expect(dto.order).toBe(1);
    expect((dto as any).published).toBeUndefined(); // internal flags stripped
    expect((dto as any).version).toBeUndefined();
  });
});
