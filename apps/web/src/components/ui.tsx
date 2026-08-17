import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Inbox,
  ShieldAlert,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { STATUS_LABELS, type IncidentStatus, type Priority, type SlaState } from '@incident/shared';
import './ui.css';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export function Button({
  variant = 'primary',
  block,
  size,
  children,
  ...rest
}: { variant?: BtnVariant; block?: boolean; size?: 'sm' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = ['btn', `btn--${variant}`, block ? 'btn--block' : '', size === 'sm' ? 'btn--sm' : ''].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, hover, className }: { children: ReactNode; hover?: boolean; className?: string }) {
  return <div className={['card', hover ? 'card--hover' : '', className ?? ''].filter(Boolean).join(' ')}>{children}</div>;
}

const PRIORITY_ICON: Record<Priority, LucideIcon> = {
  P1: ShieldAlert,
  P2: AlertTriangle,
  P3: Clock,
  P4: Inbox,
};

export function PriorityBadge({ priority }: { priority?: Priority | null }) {
  if (!priority) return <span className="badge badge--status">Unset</span>;
  const Icon = PRIORITY_ICON[priority];
  return (
    <span className={`badge badge--${priority.toLowerCase()}`}>
      <Icon size={13} aria-hidden="true" />
      {priority}
    </span>
  );
}

const SLA_ICON: Record<SlaState, LucideIcon> = {
  within_target: CheckCircle2,
  at_risk: Clock,
  breached: XCircle,
};
const SLA_LABEL: Record<SlaState, string> = {
  within_target: 'On track',
  at_risk: 'At risk',
  breached: 'Breached',
};

export function SlaBadge({ state }: { state?: SlaState | null }) {
  if (!state) return <span className="badge badge--status">No SLA</span>;
  const Icon = SLA_ICON[state];
  return (
    <span className={`badge badge--${state}`}>
      <Icon size={13} aria-hidden="true" />
      {SLA_LABEL[state]}
    </span>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className="badge badge--status">{STATUS_LABELS[status]}</span>;
}

export function EmptyState({ title, message, icon: Icon = Inbox }: { title: string; message?: string; icon?: LucideIcon }) {
  return (
    <div className="state-block">
      <Icon size={32} aria-hidden="true" />
      <strong>{title}</strong>
      {message && <span>{message}</span>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="state-block state-block--error" role="alert">
      <XCircle size={32} aria-hidden="true" />
      <strong>Something went wrong</strong>
      <span>{message}</span>
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ width: `${90 - i * 8}%` }} />
      ))}
    </div>
  );
}
