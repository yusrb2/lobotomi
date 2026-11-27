import { useMemo, useState } from 'preact/hooks';
import { Award, Lock } from 'lucide-preact';
import { cn } from '../lib/cn';
import { playClick } from '../lib/sound';
import { computePassportStamps, type StampTone } from '../lib/stamps';
import {
  challengesCompleted,
  dict,
  gatekeeperConfig,
  rules,
  sessions,
  settings,
} from '../state/store';

function toneClass(tone: StampTone, unlocked: boolean): string {
  if (!unlocked) {
    return 'border-2 border-dashed border-[var(--border-soft)] bg-[var(--bg)] text-[var(--ink-muted)] opacity-65';
  }
  switch (tone) {
    case 'sage':
      return 'badge-sage';
    case 'terracotta':
      return 'badge-terracotta';
    case 'amber':
      return 'badge-amber';
    case 'cobalt':
      return 'badge-cobalt';
  }
}

export function PassportStamps() {
  const copy = dict.value;
  const locale = settings.value.locale;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stamps = useMemo(
    () =>
      computePassportStamps({
        sessions: sessions.value,
        rules: rules.value,
        challengesCompleted: challengesCompleted.value,
        guardedAppsCount: gatekeeperConfig.value.apps.length,
      }),
    [
      sessions.value,
      rules.value,
      challengesCompleted.value,
      gatekeeperConfig.value.apps.length,
    ]
  );

  const unlockedCount = stamps.filter((s) => s.unlocked).length;
  const activeStamp = stamps.find((s) => s.id === selectedId) ?? stamps[0];

  return (
    <section className="paper-card p-4 space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight text-[var(--ink)]">
            {copy.ledger.stampsTitle}
          </h2>
          <p className="text-xs text-[var(--ink-muted)]">{copy.ledger.stampsSubtitle}</p>
        </div>
        <span className="badge-amber rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums">
          {unlockedCount}/{stamps.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stamps.map((stamp) => (
          <button
            key={stamp.id}
            type="button"
            onClick={() => {
              playClick();
              setSelectedId(stamp.id);
            }}
            style={{ transform: `rotate(${stamp.rotation}deg)` }}
            className={cn(
              'flex flex-col items-start justify-between gap-2 rounded-2xl p-3 text-left cursor-pointer hover:scale-[1.03] active:scale-[0.97]',
              toneClass(stamp.tone, stamp.unlocked),
              activeStamp?.id === stamp.id && 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--surface)]'
            )}
          >
            <div className="flex w-full items-center justify-between gap-1">
              <span className="font-mono text-[10px] font-semibold tracking-wider">
                {stamp.code}
              </span>
              {stamp.unlocked ? (
                <Award className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              ) : (
                <Lock className="h-3 w-3 shrink-0" strokeWidth={2} />
              )}
            </div>
            <p className="text-xs font-bold leading-snug">{stamp.title[locale]}</p>
          </button>
        ))}
      </div>

      {activeStamp && (
        <div className="paper-note flex items-center justify-between gap-3 px-3.5 py-2.5">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-[var(--ink)]">
              {activeStamp.title[locale]}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              {activeStamp.criteria[locale]}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase',
              activeStamp.unlocked ? 'badge-sage' : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
            )}
          >
            {activeStamp.unlocked ? copy.ledger.unlockedLabel : copy.ledger.lockedLabel}
          </span>
        </div>
      )}
    </section>
  );
}
