import { describe, it, expect } from 'vitest';
import { getFeaturedTalks } from '../scripts/talks-marquee.js';
import { DEFAULT_TALKS } from '../scripts/talks.js';

describe('Featured Talks Marquee Selection & Ordering', () => {
  it('dynamically sources published talks and selects between 6 and 8 talks', () => {
    const featured = getFeaturedTalks(DEFAULT_TALKS);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    expect(featured.length).toBeLessThanOrEqual(8);
  });

  it('orders talks strictly newest → oldest with the newest talk at the leading/left edge (index 0)', () => {
    const mockTalks = [
      { id: 't1', title: 'Talk 2024', year: 2024, order: 1, published: 1 },
      { id: 't2', title: 'Talk 2026 Latest', year: 2026, order: 1, published: 1 },
      { id: 't3', title: 'Talk 2025 Mid', year: 2025, order: 1, published: 1 },
      { id: 't4', title: 'Talk 2026 Second', year: 2026, order: 2, published: 1 },
      { id: 't5', title: 'Talk 2023 Old', year: 2023, order: 1, published: 1 },
    ];

    const featured = getFeaturedTalks(mockTalks);

    // Newest year (2026) must be first (index 0)
    expect(featured[0].title).toBe('Talk 2026 Latest');
    expect(featured[0].year).toBe(2026);

    // Within same year (2026), order 1 comes before order 2
    expect(featured[1].title).toBe('Talk 2026 Second');
    expect(featured[1].year).toBe(2026);

    // Followed by 2025, 2024, 2023
    expect(featured[2].year).toBe(2025);
    expect(featured[3].year).toBe(2024);
    expect(featured[4].year).toBe(2023);
  });

  it('filters out unpublished talks strictly', () => {
    const mockTalks = [
      { id: 't1', title: 'Hidden Talk 2026', year: 2026, order: 1, published: 0 },
      { id: 't2', title: 'Visible Talk 2026', year: 2026, order: 2, published: 1 },
      { id: 't3', title: 'Draft Talk 2025', year: 2025, order: 1, published: false },
      { id: 't4', title: 'Visible Talk 2025', year: 2025, order: 2, published: 1 },
    ];

    const featured = getFeaturedTalks(mockTalks);
    expect(featured.map(t => t.title)).toEqual([
      'Visible Talk 2026',
      'Visible Talk 2025'
    ]);
  });

  it('gracefully handles null, undefined, or empty arrays by falling back to default talks', () => {
    const fromNull = getFeaturedTalks(null as any);
    expect(fromNull.length).toBeGreaterThanOrEqual(6);
    expect(fromNull[0].year).toBe(2026);

    const fromEmpty = getFeaturedTalks([]);
    expect(fromEmpty.length).toBeGreaterThanOrEqual(6);
    expect(fromEmpty[0].year).toBe(2026);
  });

  it('renders Set A (primary talks) and Set B (exact replica) for infinite loop wrapping', () => {
    const mockTalks = [
      { id: 't1', title: 'Keynote 1', year: 2026, order: 1, published: 1 },
      { id: 't2', title: 'Keynote 2', year: 2025, order: 2, published: 1 }
    ];

    const featured = getFeaturedTalks(mockTalks);
    expect(featured.length).toBe(2);
    expect(featured[0].title).toBe('Keynote 1');
    expect(featured[1].title).toBe('Keynote 2');
  });
});
