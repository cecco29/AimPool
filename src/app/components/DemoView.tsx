import { useEffect, useMemo, useState } from 'react';
import type { TheoryBlock } from '../../content/types';
import { layoutToBalls } from '../../content/layout';
import { resolveShotSpec } from '../../content/shotSpec';
import type { PhysicsParams } from '../../physics/params';
import type { Timeline } from '../../physics/types';
import { TableCanvas } from '../../render/TableCanvas';
import { type GuideDraw, samplePath } from '../../render/guides';
import { usePlayback } from '../../render/usePlayback';
import { SpinPad } from '../../input/SpinPad';
import { simulateAsync } from '../../sim/client';
import type { TableGeometry, TableSpec } from '../../table/geometry';

type DemoBlock = Extract<TheoryBlock, { kind: 'demo' }>;

const PRESETS = [
  { label: 'Centro', a: 0, b: 0 },
  { label: 'Arriba (follow)', a: 0, b: 0.4 },
  { label: 'Abajo (draw)', a: 0, b: -0.4 },
  { label: 'Izquierda', a: -0.3, b: 0 },
  { label: 'Derecha', a: 0.3, b: 0 },
];
const TRACE_COLORS = ['rgba(255,255,255,0.8)', 'rgba(255,209,102,0.85)', 'rgba(60,207,142,0.85)'];

export function DemoView({ block, geometry, params, tableSpec }: {
  block: DemoBlock; geometry: TableGeometry; params: PhysicsParams; tableSpec: TableSpec;
}) {
  const R = params.R;
  const balls = useMemo(() => layoutToBalls(block.setup, geometry, R), [block.setup, geometry, R]);
  const [spin, setSpin] = useState(block.shot.spin ?? { a: 0, b: 0 });
  const shot = useMemo(() => resolveShotSpec({ ...block.shot, spin }, balls, geometry, R), [block.shot, spin, balls, geometry, R]);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    simulateAsync(balls, shot, tableSpec, params)
      .then((tl) => { if (alive) setTimeline(tl); })
      .catch((err) => {
        console.error('[DemoView]', err);
        if (alive) setFailed(true);
      });
    return () => { alive = false; };
  }, [balls, shot, tableSpec, params, attempt]);

  const playback = usePlayback(timeline, params);
  const traces = block.trace ?? ['cue'];
  const guides = useMemo<GuideDraw[]>(
    () => (timeline && !playback.playing
      ? traces.map((id, i) => ({ kind: 'path' as const, points: samplePath(timeline, id, params), color: TRACE_COLORS[i % TRACE_COLORS.length] }))
      : []),
    [timeline, playback.playing, traces, params],
  );

  return (
    <figure className="demo">
      <TableCanvas geometry={geometry} balls={playback.balls ?? balls} R={R} guides={guides} label={block.caption} />
      <figcaption>{block.caption}</figcaption>
      {failed ? (
        <p className="warn" role="alert">
          No se pudo simular la demo.{' '}
          <button type="button" onClick={() => setAttempt((a) => a + 1)} data-testid="demo-retry">Reintentar</button>
        </p>
      ) : (
        <div className="row">
          <button type="button" disabled={!timeline} onClick={() => timeline && setTimeline({ ...timeline })} data-testid="demo-replay">Repetir</button>
          {playback.playing && <button type="button" onClick={playback.skip}>Saltar</button>}
        </div>
      )}
      {block.interactive === 'spin' && (
        <div className="demo-spin">
          <SpinPad a={spin.a} b={spin.b} size={84} onChange={(a, b) => setSpin({ a, b })} />
          <div className="row">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" aria-pressed={spin.a === p.a && spin.b === p.b} onClick={() => setSpin({ a: p.a, b: p.b })}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}
