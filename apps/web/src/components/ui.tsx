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
import { type IncidentStatus, type Priority, type SlaState } from '@incident/shared';
import { useT } from '../i18n/I18nContext';
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
  const t = useT();
  if (!priority) return <span className="badge badge--status">{t('badge.unset')}</span>;
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

export function SlaBadge({ state }: { state?: SlaState | null }) {
  const t = useT();
  if (!state) return <span className="badge badge--status">{t('badge.noSla')}</span>;
  const Icon = SLA_ICON[state];
  return (
    <span className={`badge badge--${state}`}>
      <Icon size={13} aria-hidden="true" />
      {t(`sla.${state}`)}
    </span>
  );
}

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const t = useT();
  return <span className="badge badge--status">{t(`status.${status}`)}</span>;
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
  const t = useT();
  return (
    <div className="state-block state-block--error" role="alert">
      <XCircle size={32} aria-hidden="true" />
      <strong>{t('error.title')}</strong>
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
