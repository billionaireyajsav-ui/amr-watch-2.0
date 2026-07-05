import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// ---- Card ---------------------------------------------------------------

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('glass rounded-2xl p-5', className)} {...rest}>
      {children}
    </div>
  );
}

// ---- Badge ---------------------------------------------------------------

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  variant?: 'solid' | 'soft';
}

export function Badge({ color = 'var(--color-info)', variant = 'soft', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', className)}
      style={
        variant === 'soft'
          ? { backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`, color }
          : { backgroundColor: color, color: '#08111f' }
      }
      {...rest}
    >
      {children}
    </span>
  );
}

// ---- Button ---------------------------------------------------------------

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({ variant = 'primary', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants: Record<string, string> = {
    primary: 'bg-[var(--color-culture)] text-[#06120F] hover:brightness-110 shadow-[0_0_0_1px_rgba(42,217,194,0.4),0_8px_24px_-8px_rgba(42,217,194,0.5)]',
    secondary: 'glass text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]',
    ghost: 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5',
    danger: 'bg-[var(--color-hazard)]/15 text-[var(--color-hazard)] border border-[var(--color-hazard)]/30 hover:bg-[var(--color-hazard)]/25',
  };
  return (
    <button className={cn(base, variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ---- Skeleton ---------------------------------------------------------------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-white/[0.06]', className)} />;
}

// ---- EmptyState ---------------------------------------------------------------

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && <div className="mb-4 text-[var(--color-text-faint)]">{icon}</div>}
      <h3 className="font-display text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-[var(--color-text-muted)] max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---- Input ---------------------------------------------------------------

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl bg-white/[0.04] border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-culture)] focus:outline-none transition-colors',
        className
      )}
      {...rest}
    />
  );
}

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-xl bg-white/[0.04] border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-culture)] focus:outline-none transition-colors',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Label({ className, children, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('block text-xs font-medium text-[var(--color-text-muted)] mb-1.5', className)} {...rest}>
      {children}
    </label>
  );
}
