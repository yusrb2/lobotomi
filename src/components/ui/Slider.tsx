import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../../lib/cn';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel: string;
  className?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 1,
  max = 5,
  step = 1,
  ariaLabel,
  className,
}: SliderProps) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      onValueChange={(vals: number[]) => {
        if (typeof vals[0] === 'number') onValueChange(vals[0]);
      }}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
      className={cn('relative flex h-7 w-full touch-none select-none items-center', className)}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-[var(--surface-2)] border-2 border-[var(--border-card)]">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-[var(--accent)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-[var(--border-card)] bg-[var(--bg)] shadow-[0_2px_0_var(--card-shadow)] cursor-grab active:cursor-grabbing focus-visible:outline-none" />
    </SliderPrimitive.Root>
  );
}
