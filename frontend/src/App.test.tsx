import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Smart POS app', () => {
  render(<App />);
  const heading = screen.getByText(/Smart POS/i);
  expect(heading).toBeInTheDocument();
});
