import { expect, it } from 'vitest';

it('loads DOM matchers for web tests', () => {
  const element = document.createElement('div');
  element.textContent = 'ready';
  expect(element).toHaveTextContent('ready');
});
