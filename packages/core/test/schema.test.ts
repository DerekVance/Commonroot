import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { Comparison, Outlet, RunParams, Seed } from '../src/index.js';

describe('schemas', () => {
  it('accepts each seed kind and rejects junk', () => {
    expect(Seed.parse({ kind: 'url', url: 'https://example.com/a' }).kind).toBe('url');
    expect(Seed.parse({ kind: 'headline', text: 'Strait remark draws protest', lang: 'en' }).kind).toBe('headline');
    expect(() => Seed.parse({ kind: 'url', url: 'not a url' })).toThrow();
  });

  it('fills RunParams defaults', () => {
    const parsed = RunParams.parse({ countries: ['US', 'JP'] });
    expect(parsed.perCountry).toBe(4);
    expect(parsed.thresholds.sharedMinCountries).toBe(3);
  });

  it('rejects lowercase country codes', () => {
    expect(() => RunParams.parse({ countries: ['us'] })).toThrow();
  });

  it('validates an outlet record', () => {
    const outlet = Outlet.parse({
      id: 'jp.example',
      name: 'Example Shimbun',
      domains: ['example.jp'],
      country: 'JP',
      langs: ['ja'],
      ownership: { type: 'private', sources: [{ url: 'https://example.jp/about' }] },
      registryVersion: '2026.11.0',
    });
    expect(outlet.isWire).toBe(false);
    expect(outlet.editorialNotes).toEqual([]);
  });

  it('exports a JSON Schema for non-TS consumers', () => {
    const schema = z.toJSONSchema(Comparison, { io: 'input' }) as { type?: string; properties?: object };
    expect(schema.type).toBe('object');
    expect(Object.keys(schema.properties ?? {})).toContain('provenance');
  });
});
