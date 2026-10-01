import { runRequest, type SimRequest, type SimResponse } from './client';

const scope = self as unknown as {
  onmessage: ((e: MessageEvent<SimRequest>) => void) | null;
  postMessage: (m: SimResponse) => void;
};

scope.onmessage = (e) => {
  const { id, ...req } = e.data;
  try {
    scope.postMessage({ id, ok: true, timeline: runRequest(req) });
  } catch (err) {
    console.error('[sim worker]', err);
    scope.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
