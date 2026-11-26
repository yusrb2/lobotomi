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
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] border-[var(--border)] bg-[var(--surface-2)] p-0.5 data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]',
        className
      )}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-4 w-4 translate-x-0 rounded-full bg-[var(--bg)] border border-[var(--border)] shadow-[0_1px_0_var(--card-shadow)] transition-transform duration-350 ease-tactile data-[state=checked]:translate-x-5 data-[state=checked]:border-transparent" />
    </SwitchPrimitive.Root>
  );
}
