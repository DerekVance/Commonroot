import { describe, expect, it } from 'vitest';
import { ArticleTextLeakError, assertNoArticleText, findArticleTextLeak, type ArticleText } from '../src/index.js';

const body =
  'The ministry said on Tuesday that patrol vessels had entered the area for the third time this month, ' +
  'prompting a formal protest delivered through diplomatic channels late in the evening, according to officials ' +
  'who spoke on condition of anonymity because they were not authorised to brief reporters.';

const article = {
  ref: { id: 'aaaaaaaaaaaaaaaa' },
  text: body,
  segments: [],
} as unknown as ArticleText;

describe('article text guard', () => {
  it('passes paraphrase and short quotes', () => {
    const output = {
      claim: 'Officials say patrol ships entered the area again, the third time this month.',
      quote: 'a formal protest',
    };
    expect(findArticleTextLeak(output, [article])).toBeUndefined();
  });

  it('catches copied body text even with whitespace changes', () => {
    const copied = body.slice(20, 220).replace(/ /g, '  ');
    expect(findArticleTextLeak({ summary: copied }, [article])).toBe('aaaaaaaaaaaaaaaa');
    expect(() => assertNoArticleText({ summary: copied }, [article])).toThrow(ArticleTextLeakError);
  });
});
