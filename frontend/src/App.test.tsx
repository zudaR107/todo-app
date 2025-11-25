import { render, screen } from '@testing-library/react';
import App from './App';

it('renders hello button', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /hello/i })).toBeInTheDocument();
});
