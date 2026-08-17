import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PriorityBadge, SlaBadge, StatusBadge } from '../components/ui';

describe('UI badges', () => {
  it('renders a priority badge with label', () => {
    render(<PriorityBadge priority="P1" />);
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('renders SLA state with a text label (not color-only)', () => {
    render(<SlaBadge state="breached" />);
    expect(screen.getByText('Breached')).toBeInTheDocument();
  });

  it('renders a human status label', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });
});
