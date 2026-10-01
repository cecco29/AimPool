import { useEffect, useRef, useState } from 'react';
import type { Ball, Timeline } from '../physics/types';
import type { PhysicsParams } from '../physics/params';
import { stateAt } from '../physics/simulate';

/** Reproduce un Timeline en tiempo real. Para repetirlo, pasar un objeto Timeline nuevo. */
export function usePlayback(timeline: Timeline | null, p: PhysicsParams) {
  const [balls, setBalls] = useState<Ball[] | null>(null);
  const [playing, setPlaying] = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    if (!timeline) {
      setBalls(null);
      setPlaying(false);
      return;
    }
    skipRef.current = false;
    setPlaying(true);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = skipRef.current ? timeline.duration : (now - start) / 1000;
      setBalls(stateAt(timeline, t, p));
      if (t >= timeline.duration) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [timeline, p]);

  return { balls, playing, skip: () => { skipRef.current = true; } };
}
