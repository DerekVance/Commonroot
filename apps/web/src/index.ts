// Commonroot web app entry (Cloudflare Worker). AGPL-3.0.
// Depends on @commonroot/core through the pnpm workspace; core never depends on this app.
import { CORE_VERSION, STAGE_PLAN } from '@commonroot/core';

const HOME_PAGE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Commonroot</title>
</head>
<body>
  <h1>Commonroot</h1>
  <p>Same story, other side. Work in progress.</p>
  <p>Engine: @commonroot/core ${CORE_VERSION}. See <a href="/api/stages">/api/stages</a>.</p>
</body>
</html>`;

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  switch (url.pathname) {
    case '/':
      return new Response(HOME_PAGE, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    case '/api/health':
      return Response.json({ ok: true, coreVersion: CORE_VERSION });
    case '/api/stages':
      return Response.json({ coreVersion: CORE_VERSION, stages: STAGE_PLAN });
    default:
      return new Response('Not found', { status: 404 });
  }
}

export default { fetch: handleRequest };
