import type { JSX } from 'preact';
import { cn } from '../../lib/cn';
import { playClick } from '../../lib/sound';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'warn';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  onClick,
  children,
  ...props
}: ButtonProps) {
  const handleClick: JSX.MouseEventHandler<HTMLButtonElement> = (e) => {
    playClick();
    if (typeof onClick === 'function') {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl border-2 font-sans font-bold tracking-[0.01em] select-none cursor-pointer disabled:opacity-45 disabled:pointer-events-none ease-spring',
        variant === 'primary' &&
          'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--border-card)] shadow-[0_3px_0_var(--card-shadow)] hover:brightness-105 active:translate-y-[3px] active:shadow-none',
        variant === 'secondary' &&
          'bg-[var(--surface)] text-[var(--ink)] border-[var(--border-card)] shadow-[0_3px_0_var(--card-shadow-soft)] hover:bg-[var(--surface-2)] active:translate-y-[3px] active:shadow-none',
        variant === 'ghost' &&
          'bg-transparent text-[var(--ink-muted)] border-transparent shadow-none hover:text-[var(--ink)] hover:bg-[var(--surface)] active:scale-[0.97]',
        variant === 'warn' &&
          'bg-[var(--warn-soft)] text-[var(--warn)] border-[var(--warn)] shadow-[0_3px_0_var(--card-shadow-soft)] hover:bg-[var(--warn)] hover:text-[var(--warn-ink)] active:translate-y-[3px] active:shadow-none',
        size === 'sm' && 'h-9 px-3.5 text-xs',
        size === 'md' && 'h-11 px-5 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        className as string | undefined
      )}
      {...props}
    >
      {children}
    </button>
  );
}
