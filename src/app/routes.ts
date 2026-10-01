import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'lesson'; id: string }
  | { name: 'exercise'; id: string; index: number }
  | { name: 'stats' }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'map') return { name: 'map' };
  if (parts[0] === 'stats') return { name: 'stats' };
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'lesson' && parts[1]) {
    if (parts[2] === 'ex' && /^\d+$/.test(parts[3] ?? '')) return { name: 'exercise', id: parts[1], index: Number(parts[3]) };
    return { name: 'lesson', id: parts[1] };
  }
  return { name: 'home' };
}

export function href(r: Route): string {
  switch (r.name) {
    case 'home': return '#/';
    case 'map': return '#/map';
    case 'stats': return '#/stats';
    case 'settings': return '#/settings';
    case 'lesson': return `#/lesson/${encodeURIComponent(r.id)}`;
    case 'exercise': return `#/lesson/${encodeURIComponent(r.id)}/ex/${r.index}`;
  }
}

export function navigate(r: Route): void {
  window.location.hash = href(r);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
