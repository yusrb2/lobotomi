import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ComponentChildren } from 'preact';
import { X } from 'lucide-preact';
import { cn } from '../../lib/cn';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ComponentChildren;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#191614]/55 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg max-h-[88dvh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-[14px] border-[1.5px] border-[var(--border)] bg-[var(--bg)] p-6 text-[var(--ink)] shadow-[0_4px_0_var(--card-shadow)] focus:outline-none',
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-dashed border-[var(--border)] pb-4">
            <div className="space-y-1">
              <DialogPrimitive.Title className="font-serif text-2xl leading-tight tracking-tight text-[var(--ink)]">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="text-xs leading-relaxed text-[var(--ink-muted)]">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] shadow-[0_2px_0_var(--card-shadow)] hover:text-[var(--ink)] active:translate-y-[1px] active:shadow-none cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </DialogPrimitive.Close>
          </div>
          <div className="pt-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
