import { describe, expect, test } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import { createMemoryStore } from '../progress/store';
import { DEFAULT_SETTINGS, type Settings } from '../progress/types';

const factory = (patch: Partial<Settings> = { onboardingDone: true }) => async () => {
  const s = createMemoryStore();
  await s.saveSettings({ ...DEFAULT_SETTINGS, ...patch });
  return s;
};

describe('App', () => {
  test('home: continue card, and a warning when progress is not persistent', async () => {
    window.location.hash = '#/';
    render(<App storeFactory={factory()} />);
    expect(await screen.findByTestId('continue-lesson')).toHaveAttribute('href', '#/lesson/ghost-ball');
    expect(screen.getByRole('alert')).toHaveTextContent(/no se está guardando/);
  });
  test('first run: welcome → no table → skip placement → home', async () => {
    window.location.hash = '#/';
    render(<App storeFactory={factory({})} />);
    fireEvent.click(await screen.findByTestId('welcome-no'));
    fireEvent.click(screen.getByTestId('welcome-skip'));
    expect(await screen.findByTestId('continue-lesson')).toBeInTheDocument();
  });
  test('lesson screen shows the title and the start button', async () => {
    window.location.hash = '#/lesson/ghost-ball';
    render(<App storeFactory={factory()} />);
    expect(await screen.findByTestId('start-exercises')).toHaveAttribute('href', '#/lesson/ghost-ball/ex/0');
    expect(screen.getByRole('heading', { level: 1, name: /Bola fantasma/ })).toBeInTheDocument();
  });
  test('without a table, real-table exercises are not counted', async () => {
    window.location.hash = '#/lesson/ghost-ball/ex/4';
    render(<App storeFactory={factory({ onboardingDone: true, hasTable: 'no' })} />);
    expect(await screen.findByRole('heading', { level: 1, name: /5\/5/ })).toBeInTheDocument();
  });
  test('hidden exercise deep link redirects to the lesson', async () => {
    window.location.hash = '#/lesson/ghost-ball/ex/5';
    render(<App storeFactory={factory({ onboardingDone: true, hasTable: 'no' })} />);
    await waitFor(() => expect(window.location.hash).toBe('#/lesson/ghost-ball'));
  });
  test('unknown lesson shows a not-found message', async () => {
    window.location.hash = '#/lesson/nope';
    render(<App storeFactory={factory()} />);
    expect(await screen.findByText(/No encontramos/)).toBeInTheDocument();
  });
});

describe('final review regressions (2a)', () => {
  test('cold deep link to a hidden exercise never paints it while settings load', async () => {
    window.location.hash = '#/lesson/ghost-ball/ex/5';
    const slow = async () => {
      const s = createMemoryStore();
      await s.saveSettings({ ...DEFAULT_SETTINGS, onboardingDone: true, hasTable: 'no' });
      await new Promise((r) => setTimeout(r, 30));
      return s;
    };
    render(<App storeFactory={slow} />);
    expect(screen.queryByTestId('real-hit')).toBeNull();
    await waitFor(() => expect(window.location.hash).toBe('#/lesson/ghost-ball'));
  });
  test('the app still loads if saving the migrated settings fails', async () => {
    window.location.hash = '#/';
    const broken = async () => {
      const s = createMemoryStore();
      await s.addAttempt({ id: 'x', schemaVersion: 1, lessonId: 'ghost-ball', exerciseIndex: 0, kind: 'simShot', success: true, createdAt: Date.now() });
      s.saveSettings = async () => { throw new Error('quota'); };
      return s;
    };
    render(<App storeFactory={broken} />);
    expect(await screen.findByTestId('continue-lesson')).toBeInTheDocument();
  });
});
