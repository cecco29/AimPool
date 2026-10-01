import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichText } from './RichText';

test('paragraphs, bold, bullet and numbered lists', () => {
  const { container } = render(<RichText md={'Hola **mundo**.\n\n- uno\n- dos\n\n1. a\n2. b'} />);
  expect(screen.getByText('mundo').tagName).toBe('STRONG');
  expect(container.querySelectorAll('ul li')).toHaveLength(2);
  expect(container.querySelectorAll('ol li')).toHaveLength(2);
});
