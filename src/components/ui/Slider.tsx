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
      className={cn('relative flex h-6 w-full touch-none select-none items-center', className)}
    >
      <SliderPrimitive.Track className="relative h-[2px] w-full grow bg-[var(--border)]">
        <SliderPrimitive.Range className="absolute h-full bg-[var(--accent)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-[var(--accent)] bg-[var(--bg)] cursor-grab active:cursor-grabbing focus-visible:outline-none" />
    </SliderPrimitive.Root>
  );
}
