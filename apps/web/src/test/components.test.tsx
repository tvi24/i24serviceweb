import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CsatForm } from '../components/CsatForm';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui';

describe('CsatForm', () => {
  it('rejects submit with no rating selected', async () => {
    const onSubmit = vi.fn();
    render(<CsatForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: /submit rating/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/1 to 5/i);
  });

  it('submits a valid rating (1-5)', async () => {
    const onSubmit = vi.fn();
    render(<CsatForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    await userEvent.click(screen.getByRole('button', { name: /submit rating/i }));
    expect(onSubmit).toHaveBeenCalledWith(4, undefined);
  });
});

describe('state components', () => {
  it('renders empty state', () => {
    render(<EmptyState title="Nothing here" message="No data" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
  it('renders error state with role=alert', () => {
    render(<ErrorState message="Boom" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Boom');
  });
  it('renders loading skeleton with aria-busy', () => {
    const { container } = render(<LoadingSkeleton rows={3} />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });
});
