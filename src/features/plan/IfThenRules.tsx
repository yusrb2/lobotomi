import { useState } from 'preact/hooks';
import { Pencil, Plus, Trash2 } from 'lucide-preact';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Switch } from '../../components/ui/Switch';
import type { IfThenRule } from '../../db/types';
import { cn } from '../../lib/cn';
import { dict, makeId, removeRule, rules, saveRule } from '../../state/store';

export function IfThenRules() {
  const copy = dict.value;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<IfThenRule | null>(null);
  const [trigger, setTrigger] = useState('');
  const [action, setAction] = useState('');

  const openNew = () => {
    setEditing(null);
    setTrigger('');
    setAction('');
    setDialogOpen(true);
  };

  const openEdit = (rule: IfThenRule) => {
    setEditing(rule);
    setTrigger(rule.trigger);
    setAction(rule.action);
    setDialogOpen(true);
  };

  const handleSave = async (e: Event) => {
    e.preventDefault();
    const t = trigger.trim();
    const a = action.trim();
    if (!t || !a) return;
    const now = Date.now();
    await saveRule({
      id: editing?.id ?? makeId('rule'),
      trigger: t,
      action: a,
      active: editing?.active ?? true,
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    });
    setDialogOpen(false);
  };

  const toggleActive = (rule: IfThenRule, next: boolean) => {
    void saveRule({
      ...rule,
      active: next,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
            {copy.plan.rulesTitle}
          </h2>
          <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
            {copy.plan.rulesSubtitle}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openNew} className="shrink-0">
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{copy.plan.newRule}</span>
        </Button>
      </div>

      {rules.value.length === 0 ? (
        <div className="paper-note p-6 text-center text-xs text-[var(--ink-muted)]">
          {copy.plan.emptyRules}
        </div>
      ) : (
        <div className="space-y-3">
          {rules.value.map((rule) => (
            <article
              key={rule.id}
              className={cn(
                'paper-note p-4 space-y-3 transition-opacity',
                !rule.active && 'opacity-60'
              )}
            >
              <div className="space-y-2">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
                    {copy.plan.ifLabel}
                  </span>
                  <p className="mt-0.5 text-sm leading-snug text-[var(--ink)]">{rule.trigger}</p>
                </div>
                <div className="border-t border-dashed border-[var(--border)] pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
                    {copy.plan.thenLabel}
                  </span>
                  <p className="mt-0.5 text-sm leading-snug text-[var(--ink)]">{rule.action}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-dashed border-[var(--border)] pt-2.5">
                <div className="flex items-center gap-2.5">
                  <Switch
                    checked={rule.active}
                    onCheckedChange={(checked) => toggleActive(rule, checked)}
                    ariaLabel={`${rule.trigger} status`}
                  />
                  <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                    {rule.active ? copy.plan.active : copy.plan.paused}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(rule)}
                    aria-label={copy.plan.edit}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeRule(rule.id)}
                    aria-label={copy.plan.delete}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-[var(--ink-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--warn)] cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? copy.plan.editRule : copy.plan.newRule}
      >
        <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="rule-trigger"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
            >
              {copy.plan.ifLabel}
            </label>
            <textarea
              id="rule-trigger"
              required
              rows={2}
              value={trigger}
              onInput={(e) => setTrigger((e.target as HTMLTextAreaElement).value)}
              placeholder={copy.plan.ifPlaceholder}
              className="w-full resize-none rounded-[3px] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="rule-action"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]"
            >
              {copy.plan.thenLabel}
            </label>
            <textarea
              id="rule-action"
              required
              rows={2}
              value={action}
              onInput={(e) => setAction((e.target as HTMLTextAreaElement).value)}
              placeholder={copy.plan.thenPlaceholder}
              className="w-full resize-none rounded-[3px] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setDialogOpen(false)}
              className="flex-1"
            >
              {copy.plan.cancel}
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              {copy.plan.save}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
