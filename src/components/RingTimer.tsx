import { cn } from '../lib/cn';

interface RingTimerProps {
  progress: number; // 0 to 1
  timeText: string;
  caption?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function RingTimer({
  progress,
  timeText,
  caption,
  size = 220,
  strokeWidth = 8,
  className,
}: RingTimerProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const center = size / 2;
  const radius = center - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  // Orbiting progress particle angle (starting at 12 o'clock: -PI/2)
  const theta = -Math.PI / 2 + clamped * Math.PI * 2;
  const dotX = center + radius * Math.cos(theta);
  const dotY = center + radius * Math.sin(theta);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="var(--surface)"
          stroke="var(--border)"
          stroke-width={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          stroke-width={strokeWidth}
          stroke-linecap="round"
          stroke-dasharray={circumference}
          stroke-dashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: 'stroke-dashoffset 220ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
        <circle
          cx={dotX}
          cy={dotY}
          r={strokeWidth * 0.85}
          fill="var(--honey)"
          stroke="var(--border-card)"
          stroke-width="2"
        />
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span className="font-mono text-4xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">
          {timeText}
        </span>
        {caption && (
          <span className="mt-1.5 text-xs font-medium text-[var(--ink-muted)]">
            {caption}
          </span>
        )}
      </div>
    </div>
  );
}
