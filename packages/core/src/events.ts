export type RunEvent =
  | { type: "run-start"; runId: string; at: string }
  | { type: "stage-start"; stage: string; at: string }
  | {
      type: "stage-progress";
      stage: string;
      done: number;
      total: number;
      note?: string;
    }
  | { type: "stage-end"; stage: string; ms: number; cached: boolean }
  | { type: "warning"; stage?: string; message: string }
  | { type: "run-end"; runId: string; at: string; ok: boolean; error?: string };

// Single consumer async queue, producers push events and the consumer iterates them.
// Events pushed before iteration starts are buffered.
export class EventChannel<TEvent> implements AsyncIterable<TEvent> {
  private buffer: TEvent[] = [];
  private waiting: ((result: IteratorResult<TEvent>) => void) | undefined;
  private closed = false;

  push(value: TEvent): void {
    if (this.closed) return;
    if (this.waiting) {
      const resolve = this.waiting;
      this.waiting = undefined;
      resolve({ value, done: false });
    } else {
      this.buffer.push(value);
    }
  }

  close(): void {
    this.closed = true;
    if (this.waiting) {
      const resolve = this.waiting;
      this.waiting = undefined;
      resolve({ value: undefined, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<TEvent> {
    return {
      next: () => {
        const value = this.buffer.shift();
        if (value !== undefined) return Promise.resolve({ value, done: false });
        if (this.closed)
          return Promise.resolve({ value: undefined, done: true });
        return new Promise((resolve) => {
          this.waiting = resolve;
        });
      },
      return: () => {
        this.close();
        return Promise.resolve({ value: undefined, done: true });
      },
    };
  }
}
