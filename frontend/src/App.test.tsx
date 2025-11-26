import { render, screen } from '@testing-library/react';
import App from './app/App';

describe('App', () => {
  it('рендерит корневой layout', () => {
    render(<App />);
    expect(screen.getByTestId('app-root')).toBeInTheDocument();
  });
});
