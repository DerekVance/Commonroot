import type { ArticleText } from './schema/article.js';
import { ArticleTextLeakError } from './errors.js';

const WS = /\s+/g;

function normalise(text: string): string {
  return text.replace(WS, ' ').trim().toLowerCase();
}

// Engineering control for "link and summarise only", finds any run of `minChars`
// characters copied verbatim from an article body into the serialised output.
// Short quotes under the limit pass. Returns the id of the first leaking article.
export function findArticleTextLeak(
  output: unknown,
  texts: readonly ArticleText[],
  opts: { minChars?: number; step?: number } = {},
): string | undefined {
  const minChars = opts.minChars ?? 120;
  const step = opts.step ?? 40;
  const haystack = normalise(typeof output === 'string' ? output : JSON.stringify(output));
  for (const article of texts) {
    const body = normalise(article.text);
    if (body.length < minChars) continue;
    for (let offset = 0; offset + minChars <= body.length; offset += step) {
      if (haystack.includes(body.slice(offset, offset + minChars))) return article.ref.id;
    }
  }
  return undefined;
}

export function assertNoArticleText(output: unknown, texts: readonly ArticleText[]): void {
  const leaked = findArticleTextLeak(output, texts);
  if (leaked) throw new ArticleTextLeakError(leaked);
}
