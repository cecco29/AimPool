import { expect, test } from 'vitest';
import { PLACEMENT, scorePlacement, type PlacementItem } from './placement';

const item = (lessonId: string): PlacementItem => ({ ...PLACEMENT[0], lessonId });

test('a lesson passes only if all of its items are correct', () => {
  const items = [item('a'), item('a'), item('b'), item('b')];
  expect(scorePlacement(items, [true, true, true, false])).toEqual(['a']);
  expect(scorePlacement(items, [true, true, true, true]).sort()).toEqual(['a', 'b']);
});
test('unanswered items count as wrong', () => {
  expect(scorePlacement([item('a'), item('a')], [true])).toEqual([]);
});
test('ships at least two Ghost ball items', () => {
  expect(PLACEMENT.filter((i) => i.lessonId === 'ghost-ball').length).toBeGreaterThanOrEqual(2);
});
