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
      <TabsPrimitive.List className="grid w-full grid-cols-2 rounded-[3px] border border-[var(--border)] bg-[var(--surface)] p-1">
        {options.map((opt) => (
          <TabsPrimitive.Trigger
            key={opt.value}
            value={opt.value}
            className="rounded-[2px] px-3 py-2 text-xs font-medium tracking-wide text-[var(--ink-muted)] cursor-pointer data-[state=active]:bg-[var(--bg)] data-[state=active]:text-[var(--ink)] data-[state=active]:border data-[state=active]:border-[var(--border)]"
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
