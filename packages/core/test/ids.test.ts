import { describe, expect, it } from 'vitest';
import { base32, canonicalJson, hashId, hashValue, seededShuffle } from '../src/ids.js';

describe('canonicalJson', () => {
  it('sorts keys and drops undefined, keeping array order', () => {
    expect(canonicalJson({ beta: 1, alpha: { delta: undefined, gamma: [3, 1] } })).toBe('{"alpha":{"gamma":[3,1]},"beta":1}');
  });

  it('rejects non-finite numbers', () => {
    expect(() => canonicalJson({ value: Number.NaN })).toThrow();
  });
});

describe('hashId', () => {
  it('is deterministic and independent of key order', async () => {
    const first = await hashId({ url: 'https://example.com', lang: 'ja' });
    const reordered = await hashId({ lang: 'ja', url: 'https://example.com' });
    expect(first).toBe(reordered);
    expect(first).toMatch(/^[a-z2-7]{16}$/);
  });

  it('changes when content changes', async () => {
    expect(await hashId({ value: 1 })).not.toBe(await hashId({ value: 2 }));
  });

  it('hashValue is full sha-256 hex', async () => {
    expect(await hashValue('')).toBe('12ae32cb1ec02d01eda3581b127c1fee3b0dc53572ed6baf239721a03d82e126'); // sha256('""')
  });
});

describe('base32', () => {
  it('matches RFC 4648 test vectors (lowercase, unpadded)', () => {
    const encode = (text: string) => base32(new TextEncoder().encode(text));
    expect(encode('f')).toBe('my');
    expect(encode('foobar')).toBe('mzxw6ytboi');
  });
});

describe('seededShuffle', () => {
  it('is replayable from the seed and keeps every item', () => {
    const items = ['US', 'JP', 'CN', 'TW', 'GB', 'DE', 'RU'];
    const shuffled = seededShuffle(items, 42);
    expect(seededShuffle(items, 42)).toEqual(shuffled);
    expect([...shuffled].sort()).toEqual([...items].sort());
    expect(seededShuffle(items, 7)).not.toEqual(shuffled);
  });
});
