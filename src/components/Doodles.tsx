export function SteamingTeaDoodle({
  className = 'h-12 w-12',
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M22 17c-2-3 2-6 0-9"
        stroke="var(--accent)"
        stroke-width="1.6"
        stroke-linecap="round"
        className={animated ? 'animate-steam' : undefined}
      />
      <path
        d="M31 15c-2-3 2-6 0-9"
        stroke="var(--accent)"
        stroke-width="1.6"
        stroke-linecap="round"
        className={animated ? 'animate-steam' : undefined}
        style={animated ? { animationDelay: '0.45s' } : undefined}
      />
      <path
        d="M40 17c-2-3 2-6 0-9"
        stroke="var(--accent)"
        stroke-width="1.6"
        stroke-linecap="round"
        className={animated ? 'animate-steam' : undefined}
        style={animated ? { animationDelay: '0.9s' } : undefined}
      />
      <path
        d="M14 25h30c0 12-5 21-15 21s-15-9-15-21Z"
        stroke="var(--ink)"
        stroke-width="1.6"
        stroke-linejoin="round"
        fill="var(--surface)"
      />
      <path
        d="M44 28c5 0 8 2.5 8 6.5S49 41 43 41"
        stroke="var(--ink)"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <path
        d="M11 49c6 1.8 30 1.8 36 0"
        stroke="var(--ink-muted)"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  );
}

export function ZenStonesDoodle({ className = 'h-11 w-11' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <ellipse
        cx="32"
        cy="47"
        rx="20"
        ry="7"
        fill="var(--surface)"
        stroke="var(--ink)"
        stroke-width="1.6"
      />
      <ellipse
        cx="32"
        cy="34"
        rx="14"
        ry="6"
        fill="var(--surface-2)"
        stroke="var(--ink)"
        stroke-width="1.6"
      />
      <ellipse
        cx="31"
        cy="22"
        rx="9"
        ry="5"
        fill="var(--surface)"
        stroke="var(--accent)"
        stroke-width="1.6"
      />
    </svg>
  );
}

export function SproutDoodle({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M24 40V21"
        stroke="var(--ink)"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <path
        d="M24 25c-9 0-13-5-13-11 7 0 13 4 13 11Z"
        fill="var(--surface-2)"
        stroke="var(--accent)"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <path
        d="M24 21c9 0 13-5 13-11-7 0-13 4-13 11Z"
        fill="var(--surface)"
        stroke="var(--accent)"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <path
        d="M15 41c5-1.4 13-1.4 18 0"
        stroke="var(--ink-muted)"
        stroke-width="1.6"
        stroke-linecap="round"
      />
    </svg>
  );
}

export function WoodenLatchDoodle({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect
        x="11"
        y="9"
        width="26"
        height="30"
        rx="4"
        fill="var(--surface)"
        stroke="var(--ink)"
        stroke-width="1.6"
      />
      <path
        d="M17 24h14"
        stroke="var(--accent)"
        stroke-width="2"
        stroke-linecap="round"
      />
      <circle cx="31" cy="24" r="3" fill="var(--honey)" stroke="var(--ink)" stroke-width="1.4" />
    </svg>
  );
}
