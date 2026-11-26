import { useMemo, useState } from 'preact/hooks';
import { cn } from '../../lib/cn';
import { dict, ledger, sessions } from '../../state/store';

interface DayBucket {
  dateKey: string;
  label: string;
  minutes: number;
}

function toLocalDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function CalmDotMatrix() {
  const copy = dict.value;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const days = useMemo<DayBucket[]>(() => {
    const map = new Map<string, number>();

    for (const s of sessions.value) {
      const k = toLocalDateKey(s.startedAt);
      map.set(k, (map.get(k) ?? 0) + Math.round(s.actualSeconds / 60));
    }
    for (const l of ledger.value) {
      if (l.polarity === 'slow') {
        const k = toLocalDateKey(l.createdAt);
        map.set(k, (map.get(k) ?? 0) + l.minutes);
      }
    }

    const list: DayBucket[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for (let i = 89; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(todayStart.getDate() - i);
      const key = toLocalDateKey(d.getTime());
      list.push({
        dateKey: key,
        label: key,
        minutes: map.get(key) ?? 0,
      });
    }
    return list;
  }, [sessions.value, ledger.value]);

  const total90 = useMemo(() => days.reduce((acc, d) => acc + d.minutes, 0), [days]);
  const quietDays = useMemo(() => days.filter((d) => d.minutes > 0).length, [days]);
  const selectedDay = useMemo(
    () => days.find((d) => d.dateKey === selectedKey) ?? null,
    [days, selectedKey]
  );

  const getDotColor = (mins: number): string => {
    if (mins <= 0) return 'bg-[var(--dot-0)]';
    if (mins < 10) return 'bg-[var(--dot-1)]';
    if (mins < 30) return 'bg-[var(--dot-2)]';
    return 'bg-[var(--dot-3)]';
  };

  return (
    <section className="space-y-4 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="font-serif text-xl tracking-tight text-[var(--ink)]">
            {copy.ledger.matrixTitle}
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">{copy.ledger.matrixSubtitle}</p>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-[var(--ink-muted)] tabular-nums">
          <span>
            <strong className="font-medium text-[var(--ink)]">{total90}</strong>m · {copy.ledger.total90}
          </span>
          <span>
            <strong className="font-medium text-[var(--ink)]">{quietDays}</strong>/90 · {copy.ledger.quietDays}
          </span>
        </div>
      </div>

      <div
        role="grid"
        aria-label={copy.ledger.matrixTitle}
        className="grid grid-cols-15 gap-1.5 sm:grid-cols-18"
      >
        {days.map((day) => {
          const isSelected = selectedKey === day.dateKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              onClick={() => setSelectedKey(day.dateKey)}
              aria-label={`${day.dateKey}: ${day.minutes} ${copy.ledger.inspectValue}`}
              title={`${day.dateKey}: ${day.minutes}m`}
              className={cn(
                'aspect-square w-full rounded-full cursor-pointer transition-transform duration-300 ease-tactile',
                getDotColor(day.minutes),
                isSelected && 'ring-1 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]'
              )}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--border)] pt-2.5 font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
        <span>
          {selectedDay
            ? `${selectedDay.dateKey} — ${selectedDay.minutes} ${copy.ledger.inspectValue}`
            : copy.ledger.inspectEmpty}
        </span>
        <div className="flex items-center gap-1" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-[var(--dot-0)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--dot-1)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--dot-2)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--dot-3)]" />
        </div>
      </div>
    </section>
  );
}
