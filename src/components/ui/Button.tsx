import type { JSX } from 'preact';
import { cn } from '../../lib/cn';

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'warn';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[3px] border font-sans font-medium tracking-[0.01em] select-none cursor-pointer disabled:opacity-45 disabled:pointer-events-none',
        variant === 'primary' &&
          'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)] hover:opacity-92 active:opacity-85',
        variant === 'secondary' &&
          'bg-[var(--surface)] text-[var(--ink)] border-[var(--border)] hover:bg-[var(--surface-2)]',
        variant === 'ghost' &&
          'bg-transparent text-[var(--ink-muted)] border-transparent hover:text-[var(--ink)] hover:bg-[var(--surface)]',
        variant === 'warn' &&
          'bg-transparent text-[var(--warn)] border-[var(--warn)] hover:bg-[var(--warn)] hover:text-[var(--warn-ink)]',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        className as string | undefined
      )}
      {...props}
    >
      {children}
    </button>
  );
}
