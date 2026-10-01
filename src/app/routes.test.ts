import { describe, expect, test } from 'vitest';
import { href, parseHash } from './routes';

describe('routes', () => {
  test.each([
    ['', { name: 'home' }],
    ['#/', { name: 'home' }],
    ['#/map', { name: 'map' }],
    ['#/stats', { name: 'stats' }],
    ['#/settings', { name: 'settings' }],
    ['#/lesson/ghost-ball', { name: 'lesson', id: 'ghost-ball' }],
    ['#/lesson/ghost-ball/ex/3', { name: 'exercise', id: 'ghost-ball', index: 3 }],
    ['#/lesson/ghost-ball/ex/x', { name: 'lesson', id: 'ghost-ball' }],
    ['#/welcome', { name: 'welcome' }],
    ['#/placement', { name: 'placement' }],
    ['#/nope', { name: 'home' }],
  ])('parse %s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });
  test('href round trip', () => {
    const r = { name: 'exercise' as const, id: 'ghost-ball', index: 2 };
    expect(parseHash(href(r))).toEqual(r);
  });
});

import { navigate } from './routes';
test('redirects replace the history entry instead of pushing one', () => {
  window.location.hash = '#/map';
  const before = window.history.length;
  let fired = 0;
  const on = () => { fired++; };
  window.addEventListener('hashchange', on);
  navigate({ name: 'stats' }, { replace: true });
  window.removeEventListener('hashchange', on);
  expect(window.location.hash).toBe('#/stats');
  expect(window.history.length).toBe(before);
  expect(fired).toBe(1);
});
