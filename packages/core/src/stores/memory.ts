import type { Store } from '../adapters.js';

interface Entry {
  value: unknown;
  expiresAt?: number;
}

// In memory Store. Values structure are cloned so callers cannot mutate the cache.
export function memoryStore(opts: { now?: () => number } = {}): Store & { size(): number; clear(): void } {
  const now = opts.now ?? Date.now;
  const map = new Map<string, Entry>();
  return {
    id: 'memory-store',
    async get<TValue>(key: string): Promise<TValue | undefined> {
      const entry = map.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt !== undefined && entry.expiresAt <= now()) {
        map.delete(key);
        return undefined;
      }
      return structuredClone(entry.value) as TValue;
    },
    async set<TValue>(key: string, value: TValue, setOpts?: { ttlSeconds?: number }): Promise<void> {
      const entry: Entry = { value: structuredClone(value) };
      if (setOpts?.ttlSeconds !== undefined) entry.expiresAt = now() + setOpts.ttlSeconds * 1000;
      map.set(key, entry);
    },
    size: () => map.size,
    clear: () => map.clear(),
  };
}
