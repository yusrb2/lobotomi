import { useMemo, useState } from 'preact/hooks';
import { Plus, Trash2 } from 'lucide-preact';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import type { LedgerEntry, LedgerPolarity, SessionRecord } from '../../db/types';
import { cn } from '../../lib/cn';
import {
  dict,
  ledger,
  makeId,
  removeLedgerEntry,
  removeSession,
  saveLedgerEntry,
  sessions,
} from '../../state/store';

type TimelineRow =
  | { kind: 'session'; ts: number; data: SessionRecord }
  | { kind: 'ledger'; ts: number; data: LedgerEntry };

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${m}-${day} ${h}:${min}`;
}

export function StimulationLedger() {
  const copy = dict.value;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [polarity, setPolarity] = useState<LedgerPolarity>('slow');
  const [label, setLabel] = useState('');
  const [minutes, setMinutes] = useState('20');
  const [note, setNote] = useState('');

  const sevenDayStats = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let slow = 0;
    let fast = 0;

    for (const s of sessions.value) {
      if (s.startedAt >= cutoff) {
        slow += Math.round(s.actualSeconds / 60);
      }
    }
    for (const entry of ledger.value) {
      if (entry.createdAt >= cutoff) {
        if (entry.polarity === 'slow') slow += entry.minutes;
        else fast += entry.minutes;
      }
    }
    const total = slow + fast;
    const slowPct = total > 0 ? Math.round((slow / total) * 100) : 50;
    return { slow, fast, total, slowPct };
  }, [sessions.value, ledger.value]);

  const clarityStats = useMemo(() => {
    const rated = sessions.value.filter(
      (s) => typeof s.clarityBefore === 'number' && typeof s.clarityAfter === 'number'
    );
    if (rated.length === 0) return null;
    const beforeAvg =
      rated.reduce((sum, s) => sum + (s.clarityBefore ?? 0), 0) / rated.length;
    const afterAvg =
      rated.reduce((sum, s) => sum + (s.clarityAfter ?? 0), 0) / rated.length;
    return {
      count: rated.length,
      before: beforeAvg.toFixed(1),
      after: afterAvg.toFixed(1),
    };
  }, [sessions.value]);

  const timeline = useMemo<TimelineRow[]>(() => {
    const rows: TimelineRow[] = [
      ...sessions.value.map((s) => ({ kind: 'session' as const, ts: s.startedAt, data: s })),
      ...ledger.value.map((l) => ({ kind: 'ledger' as const, ts: l.createdAt, data: l })),
    ];
    return rows.sort((a, b) => b.ts - a.ts).slice(0, 40);
  }, [sessions.value, ledger.value]);

  const presets =
    polarity === 'slow' ? copy.ledger.presetsSlow : copy.ledger.presetsFast;

  const openModal = (initialPolarity: LedgerPolarity = 'slow') => {
    setPolarity(initialPolarity);
    setLabel('');
    setMinutes('20');
    setNote('');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const cleanLabel = label.trim();
    const mins = Math.max(1, Math.min(720, parseInt(minutes, 10) || 1));
    if (!cleanLabel) return;

    await saveLedgerEntry({
      id: makeId('led'),
      polarity,
      label: cleanLabel,
      minutes: mins,
      note: note.trim() || undefined,
      createdAt: Date.now(),
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="paper-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.ledger.ratioTitle}
            </p>
            <span className="font-mono text-xs text-[var(--ink)] tabular-nums">
              {sevenDayStats.total > 0 ? `${sevenDayStats.slowPct}%` : '—'}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            {sevenDayStats.total > 0 && (
              <div className="flex h-full w-full">
                <div
                  className="h-full bg-[var(--accent)] transition-[width] duration-500 ease-tactile"
                  style={{ width: `${sevenDayStats.slowPct}%` }}
                />
                <div
                  className="h-full bg-[var(--warn)] transition-[width] duration-500 ease-tactile"
                  style={{ width: `${100 - sevenDayStats.slowPct}%` }}
                />
              </div>
            )}
          </div>
          <div className="flex justify-between font-mono text-[11px] tabular-nums">
            <span className="text-[var(--accent-strong)]">
              {copy.ledger.slowLabel}: {sevenDayStats.slow}m
            </span>
            <span className="text-[var(--warn)]">
              {copy.ledger.fastLabel}: {sevenDayStats.fast}m
            </span>
          </div>
        </div>

        <div className="paper-card p-4 space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.ledger.clarityAvgTitle}
          </p>
          {clarityStats ? (
            <div className="flex items-baseline justify-between pt-1">
              <p className="font-mono text-2xl text-[var(--ink)] tabular-nums">
                {clarityStats.before} → {clarityStats.after}
              </p>
              <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                n = {clarityStats.count}
              </span>
            </div>
          ) : (
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              {copy.ledger.clarityNoData}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h3 className="font-serif text-xl tracking-tight text-[var(--ink)]">
          {copy.ledger.recentTitle}
        </h3>
        <Button variant="primary" size="sm" onClick={() => openModal('slow')}>
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span>{copy.ledger.logEntry}</span>
        </Button>
      </div>

      {timeline.length === 0 ? (
        <div className="paper-note p-6 text-center text-xs text-[var(--ink-muted)]">
          {copy.ledger.emptyEntries}
        </div>
      ) : (
        <ul className="paper-card divide-y divide-[var(--border)]">
          {timeline.map((row) => {
            if (row.kind === 'session') {
              const s = row.data;
              const mins = Math.max(1, Math.round(s.actualSeconds / 60));
              const hasDelta =
                typeof s.clarityBefore === 'number' && typeof s.clarityAfter === 'number';
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {s.type === 'urge'
                          ? copy.ledger.sessionUrge
                          : copy.ledger.sessionFast}
                      </span>
                      <span className="font-mono text-xs text-[var(--ink)] tabular-nums">
                        {mins}m
                      </span>
                      {s.trigger && (
                        <span className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--ink-muted)]">
                          {copy.urge.triggers[s.trigger]}
                        </span>
                      )}
                      {hasDelta && (
                        <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                          {s.clarityBefore}→{s.clarityAfter}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums">
                      {formatDateTime(s.startedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeSession(s.id)}
                    aria-label={copy.plan.delete}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-[var(--ink-muted)] hover:bg-[var(--bg)] hover:text-[var(--warn)] cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </li>
              );
            }

            const entry = row.data;
            return (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'font-mono text-[10px] uppercase tracking-[0.12em]',
                        entry.polarity === 'slow'
                          ? 'text-[var(--accent-strong)]'
                          : 'text-[var(--warn)]'
                      )}
                    >
                      {entry.polarity === 'slow' ? 'SLOW' : 'FAST'}
                    </span>
                    <span className="text-sm text-[var(--ink)]">{entry.label}</span>
                    <span className="font-mono text-xs text-[var(--ink-muted)] tabular-nums">
                      {entry.minutes}m
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-[var(--ink-muted)]">{entry.note}</p>
                  )}
                  <p className="font-mono text-[10px] text-[var(--ink-muted)] tabular-nums">
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeLedgerEntry(entry.id)}
                  aria-label={copy.plan.delete}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-[var(--ink-muted)] hover:bg-[var(--bg)] hover:text-[var(--warn)] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title={copy.ledger.logEntry}>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.ledger.polarity}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPolarity('slow')}
                className={cn(
                  'h-10 rounded-2xl border font-mono text-xs cursor-pointer',
                  polarity === 'slow'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                )}
              >
                {copy.ledger.slowLabel}
              </button>
              <button
                type="button"
                onClick={() => setPolarity('fast')}
                className={cn(
                  'h-10 rounded-2xl border font-mono text-xs cursor-pointer',
                  polarity === 'fast'
                    ? 'border-[var(--warn)] bg-[var(--warn)] text-[var(--warn-ink)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                )}
              >
                {copy.ledger.fastLabel}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setLabel(preset)}
                className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-1.5">
              <label
                htmlFor="ledger-label"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
              >
                {copy.ledger.activityLabel}
              </label>
              <input
                id="ledger-label"
                type="text"
                required
                value={label}
                onInput={(e) => setLabel((e.target as HTMLInputElement).value)}
                className="h-10 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="ledger-minutes"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
              >
                {copy.ledger.minutesLabel}
              </label>
              <input
                id="ledger-minutes"
                type="number"
                min={1}
                max={720}
                required
                value={minutes}
                onInput={(e) => setMinutes((e.target as HTMLInputElement).value)}
                className="h-10 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 font-mono text-sm text-[var(--ink)] tabular-nums focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="ledger-note"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
            >
              {copy.ledger.noteLabel}
            </label>
            <input
              id="ledger-note"
              type="text"
              value={note}
              onInput={(e) => setNote((e.target as HTMLInputElement).value)}
              className="h-10 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
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
