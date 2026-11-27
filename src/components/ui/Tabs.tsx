import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentChildren } from 'preact';
import { cn } from '../../lib/cn';

export interface TabOption {
  value: string;
  label: string;
}

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  options: TabOption[];
  children: ComponentChildren;
  className?: string;
}

export function Tabs({ value, onValueChange, options, children, className }: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <TabsPrimitive.List className="grid w-full grid-cols-2 gap-1 rounded-2xl border-2 border-[var(--border-card)] bg-[var(--surface)] p-1 shadow-[0_3px_0_var(--card-shadow-soft)]">
        {options.map((opt) => (
          <TabsPrimitive.Trigger
            key={opt.value}
            value={opt.value}
            className="rounded-xl px-3 py-2 text-xs font-bold tracking-wide text-[var(--ink-muted)] cursor-pointer data-[state=active]:bg-[var(--accent)] data-[state=active]:text-[var(--accent-ink)]"
          >
            {opt.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabPanel({
  value,
  children,
  className,
}: {
  value: string;
  children: ComponentChildren;
  className?: string;
}) {
  return (
    <TabsPrimitive.Content value={value} className={cn('mt-5 focus:outline-none', className)}>
      {children}
    </TabsPrimitive.Content>
  );
}
