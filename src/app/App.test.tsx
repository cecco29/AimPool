import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { createMemoryStore } from '../progress/store';

const factory = async () => createMemoryStore();

describe('App', () => {
  test('home: continue card, and a warning when progress is not persistent', async () => {
    window.location.hash = '#/';
    render(<App storeFactory={factory} />);
    expect(await screen.findByTestId('continue-lesson')).toHaveAttribute('href', '#/lesson/ghost-ball');
    expect(screen.getByRole('alert')).toHaveTextContent(/no se está guardando/);
  });
  test('lesson screen shows the title and the start button', async () => {
    window.location.hash = '#/lesson/ghost-ball';
    render(<App storeFactory={factory} />);
    expect(await screen.findByTestId('start-exercises')).toHaveAttribute('href', '#/lesson/ghost-ball/ex/0');
    expect(screen.getByRole('heading', { level: 1, name: /Bola fantasma/ })).toBeInTheDocument();
  });
  test('unknown lesson shows a not-found message', async () => {
    window.location.hash = '#/lesson/nope';
    render(<App storeFactory={factory} />);
    expect(await screen.findByText(/No encontramos/)).toBeInTheDocument();
  });
});
