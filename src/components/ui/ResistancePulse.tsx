import { riskColor } from '@/lib/utils';
import type { RiskLevel } from '@/types';

interface ResistancePulseProps {
  score: number; // 0-100
  risk: RiskLevel;
  size?: number;
  label?: string;
  animate?: boolean;
}

/**
 * The "resistance pulse" ring is this app's signature visual mark: a culture
 * growth ring whose fill and pulsation communicate AMR pressure at a glance.
 * It appears on the dashboard, hospital cards, hospital profile, and patient
 * reports so the same visual language ties the whole product together.
 */
export function ResistancePulse({ score, risk, size = 96, label, animate = true }: ResistancePulseProps) {
  const stroke = size * 0.09;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color = riskColor[risk];

  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,178,224,0.12)"
          strokeWidth={stroke}
        />
        {animate && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            opacity={0.25}
          >
            <animate attributeName="r" values={`${radius};${radius + 4};${radius}`} dur="2.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.25;0;0.25" dur="2.6s" repeatCount="indefinite" />
          </circle>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-semibold" style={{ fontSize: size * 0.26, color }}>
          {Math.round(score)}
        </span>
        {label && <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-faint)]">{label}</span>}
      </div>
    </div>
  );
}
