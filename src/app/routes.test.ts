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
    ['#/nope', { name: 'home' }],
  ])('parse %s', (hash, route) => {
    expect(parseHash(hash)).toEqual(route);
  });
  test('href round trip', () => {
    const r = { name: 'exercise' as const, id: 'ghost-ball', index: 2 };
    expect(parseHash(href(r))).toEqual(r);
  });
});
