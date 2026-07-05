import { clsx, type ClassValue } from 'clsx';
import type { RiskLevel, AlertSeverity } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const riskColor: Record<RiskLevel, string> = {
  low: 'var(--color-culture)',
  moderate: 'var(--color-caution)',
  high: 'var(--color-hazard)',
};

export const riskLabel: Record<RiskLevel, string> = {
  low: 'Low risk',
  moderate: 'Moderate risk',
  high: 'High risk',
};

export const severityColor: Record<AlertSeverity, string> = {
  info: 'var(--color-info)',
  warning: 'var(--color-caution)',
  critical: 'var(--color-hazard)',
};

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
