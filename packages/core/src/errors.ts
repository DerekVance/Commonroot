export class CommonrootError extends Error {
  constructor(message: string, readonly code: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'CommonrootError';
  }
}

export class StageNotImplementedError extends CommonrootError {
  constructor(readonly stage: string) {
    super(`Stage "${stage}" is not implemented yet`, 'STAGE_NOT_IMPLEMENTED');
    this.name = 'StageNotImplementedError';
  }
}

export class StageOutputInvalidError extends CommonrootError {
  constructor(readonly stage: string, readonly issues: unknown) {
    super(`Stage "${stage}" produced output that failed validation`, 'STAGE_OUTPUT_INVALID');
    this.name = 'StageOutputInvalidError';
  }
}

export class ArticleTextLeakError extends CommonrootError {
  constructor(readonly articleId: string) {
    super(`Output contains a run of text copied from article ${articleId}`, 'ARTICLE_TEXT_LEAK');
    this.name = 'ArticleTextLeakError';
  }
}
