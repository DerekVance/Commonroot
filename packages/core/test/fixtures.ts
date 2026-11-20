import type { CommonrootConfig, LLM, Registry } from '../src/index.js';

const llm = (model: string): LLM => ({
  id: 'fake-llm',
  model,
  async generate() {
    throw new Error('fake LLM: not used in M0 tests');
  },
});

export const registry: Registry = {
  version: 'test-0',
  outlets: () => [],
  byCountry: () => [],
  byDomain: () => undefined,
};

export function config(overrides: Partial<CommonrootConfig> = {}): CommonrootConfig {
  return {
    sources: [
      {
        id: 'fake-source',
        capabilities: { countries: 'any', langs: 'any', maxWindowDays: 90, returnsBodyText: false },
        async *search() {},
      },
    ],
    llm: { small: llm('small-model'), large: llm('large-model') },
    embedder: { id: 'fake-embedder', model: 'emb', embed: async (texts) => texts.map(() => [0]) },
    fetcher: { id: 'fake-fetcher', fetch: async (url) => ({ url, finalUrl: url, status: 404 }) },
    registry,
    ...overrides,
  };
}
