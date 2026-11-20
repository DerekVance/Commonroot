// Deterministic content hashing. Same input, same id, on any runtime with Web Crypto
// (Node 20+, Cloudflare Workers, browsers).

const encoder = new TextEncoder();

// JSON with sorted object keys and `undefined` fields dropped. Arrays keep their order.
export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalise(value));
}

function normalise(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new TypeError('canonicalJson: non-finite numbers are not allowed');
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => (item === undefined ? null : normalise(item)));
  if (value instanceof Date) return value.toISOString();
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const field = (value as Record<string, unknown>)[key];
    if (field !== undefined) sorted[key] = normalise(field);
  }
  return sorted;
}

export async function sha256(data: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof data === 'string' ? encoder.encode(data) : data;
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return new Uint8Array(digest);
}

export async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const bytes = await sha256(data);
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return hex;
}

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

// RFC 4648 base32 (lowercase, no padding).
export function base32(bytes: Uint8Array): string {
  let bitCount = 0;
  let buffer = 0;
  let encoded = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      encoded += BASE32_ALPHABET[(buffer >>> (bitCount - 5)) & 31];
      bitCount -= 5;
    }
  }
  if (bitCount > 0) encoded += BASE32_ALPHABET[(buffer << (5 - bitCount)) & 31];
  return encoded;
}

// 16-char content hash id for any JSONable value (80 bits).
export async function hashId(value: unknown): Promise<string> {
  const bytes = await sha256(canonicalJson(value));
  return base32(bytes.subarray(0, 10));
}

// Full SHA-256 hex of a value's canonical JSON. Used for provenance step hashes.
export async function hashValue(value: unknown): Promise<string> {
  return sha256Hex(canonicalJson(value));
}

// Seeded PRNG (mulberry32) so shuffles are replayable from RunParams.seed.
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with a seeded PRNG. Returns a new array.
export function seededShuffle<TItem>(items: readonly TItem[], seed: number): TItem[] {
  const random = seededRandom(seed);
  const shuffled = items.slice();
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex] as TItem, shuffled[index] as TItem];
  }
  return shuffled;
}
