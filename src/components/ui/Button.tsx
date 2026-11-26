import type { JSX } from 'preact';
import { audioEngine } from '../../lib/audio';
import { cn } from '../../lib/cn';
import { settings } from '../../state/store';

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
    if (settings.value.soundClicksEnabled) {
      audioEngine.playWoodTap();
    }
    if (typeof onClick === 'function') {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] font-sans font-semibold tracking-[0.01em] select-none cursor-pointer disabled:opacity-45 disabled:pointer-events-none active:translate-y-[2px] active:shadow-none',
        variant === 'primary' &&
          'bg-[var(--accent)] text-[var(--accent-ink)] border-[var(--accent)] shadow-[0_3px_0_var(--card-shadow)] hover:opacity-95',
        variant === 'secondary' &&
          'bg-[var(--surface)] text-[var(--ink)] border-[var(--border)] shadow-[0_3px_0_var(--card-shadow)] hover:bg-[var(--surface-2)]',
        variant === 'ghost' &&
          'bg-transparent text-[var(--ink-muted)] border-transparent shadow-none hover:text-[var(--ink)] hover:bg-[var(--surface)] active:translate-y-0',
        variant === 'warn' &&
          'bg-[var(--surface)] text-[var(--warn)] border-[var(--warn)] shadow-[0_3px_0_var(--card-shadow)] hover:bg-[var(--warn)] hover:text-[var(--warn-ink)]',
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
