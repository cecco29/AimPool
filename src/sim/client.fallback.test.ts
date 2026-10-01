import { expect, test, vi } from 'vitest';
import { DEFAULT_PARAMS as p } from '../physics/params';
import { DEFAULT_TABLE_SPEC } from '../table/geometry';
import type { Ball, Shot } from '../physics/types';

class BrokenWorker {
  static created = 0;
  onmessage: unknown = null;
  onerror: ((e: { message: string }) => void) | null = null;
  constructor() { BrokenWorker.created++; }
  postMessage() { setTimeout(() => this.onerror?.({ message: 'boom' }), 0); }
  terminate() {}
}

test('a worker that fails to load falls back to the main thread, once and for all', async () => {
  vi.stubGlobal('Worker', BrokenWorker);
  const { simulateAsync } = await import('./client');
  const balls: Ball[] = [{ id: 'cue', r: [0.6, 0.6, p.R], v: [0, 0, 0], w: [0, 0, 0], motion: 'stationary' }];
  const shot: Shot = { cueBallId: 'cue', azimuth: 0, elevation: 0, a: 0, b: 0, cueSpeed: 1 };
  const run = () => simulateAsync(balls, shot, DEFAULT_TABLE_SPEC, p);
  const tl = await run();
  expect(tl.events[0].kind).toBe('strike');
  await run();
  expect(BrokenWorker.created).toBe(1);
  vi.unstubAllGlobals();
});
