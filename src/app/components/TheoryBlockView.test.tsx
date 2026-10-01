import { expect, test } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TheoryBlockView } from './TheoryBlockView';
import { DEFAULT_PARAMS } from '../../physics/params';
import { buildTable, DEFAULT_TABLE_SPEC } from '../../table/geometry';

const props = { geometry: buildTable(DEFAULT_TABLE_SPEC, DEFAULT_PARAMS.R), params: DEFAULT_PARAMS, tableSpec: DEFAULT_TABLE_SPEC, showGuides: true };

test('image block shows the image and its credit', () => {
  render(<TheoryBlockView {...props} block={{ kind: 'image', src: 'illustrations/puente-abierto.svg', alt: 'Puente abierto', caption: 'El puente', credit: { author: 'Fulano', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/x' } }} />);
  expect(screen.getByAltText('Puente abierto')).toHaveAttribute('src', 'illustrations/puente-abierto.svg');
  expect(screen.getByRole('link', { name: /Fulano · CC BY-SA 4.0/ })).toHaveAttribute('href', 'https://commons.wikimedia.org/x');
});

test('image error: shows the alt text instead of a hole', () => {
  render(<TheoryBlockView {...props} block={{ kind: 'image', src: 'illustrations/nope.png', alt: 'Agarre del taco', caption: 'c' }} />);
  fireEvent.error(screen.getByAltText('Agarre del taco'));
  expect(screen.queryByRole('img', { name: 'Agarre del taco' })).toBeNull();
  expect(screen.getByText('Agarre del taco')).toBeInTheDocument();
});
