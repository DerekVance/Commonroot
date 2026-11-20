import { describe, expect, it } from 'vitest';
import { CORE_VERSION } from '@commonroot/core';
import { handleRequest } from '../src/index.js';

const get = (path: string) => handleRequest(new Request(`https://commonroot.test${path}`));

describe('web worker', () => {
  it('serves the home page', async () => {
    const response = await get('/');
    expect(response.status).toBe(200);
    expect(await response.text()).toContain(CORE_VERSION);
  });

  it('reports health with the core version it was built against', async () => {
    expect(await (await get('/api/health')).json()).toEqual({ ok: true, coreVersion: CORE_VERSION });
  });

  it('lists the pipeline stages from core', async () => {
    const body = (await (await get('/api/stages')).json()) as { stages: unknown[] };
    expect(body.stages).toHaveLength(10);
  });

  it('returns 404 for unknown paths', async () => {
    expect((await get('/nope')).status).toBe(404);
  });
});
