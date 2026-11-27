import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../../lib/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
  id?: string;
  className?: string;
}

export function Switch({ checked, onCheckedChange, ariaLabel, id, className }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-[var(--border-card)] bg-[var(--surface-2)] p-0.5 data-[state=checked]:bg-[var(--accent)]',
        className
      )}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0 rounded-full bg-[var(--bg)] border-2 border-[var(--border-card)] transition-transform duration-300 ease-spring data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
}
