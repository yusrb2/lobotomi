import { SteamingTeaDoodle } from '../../components/Doodles';
import { Button } from '../../components/ui/Button';
import { dict, todayQuietMinutes } from '../../state/store';

interface HomeViewProps {
  onStartUrge: () => void;
}

function getTimeGreeting(copy: ReturnType<typeof dict.peek>['home']): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return copy.greetingMorning;
  if (hour >= 12 && hour < 17) return copy.greetingMidday;
  if (hour >= 17 && hour < 22) return copy.greetingEvening;
  return copy.greetingNight;
}

export function HomeView({ onStartUrge }: HomeViewProps) {
  const copy = dict.value;
  const greeting = getTimeGreeting(copy.home);

  return (
    <section className="flex flex-1 flex-col justify-center py-8">
      <div className="space-y-8">
        <div className="space-y-3.5">
          <SteamingTeaDoodle className="h-14 w-14" />
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 font-mono text-xs uppercase tracking-[0.12em] text-[var(--ink-muted)] tabular-nums">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <span>
              {todayQuietMinutes.value} {copy.home.quietToday}
            </span>
          </p>
          <h1 className="font-serif text-4xl leading-[1.08] tracking-tight text-[var(--ink)] sm:text-5xl">
            {greeting}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">{copy.tagline}</p>
        </div>

        <div className="pt-1">
          <Button
            variant="primary"
            size="lg"
            onClick={onStartUrge}
            className="h-14 w-full justify-between px-6 text-base sm:w-auto sm:min-w-[290px]"
          >
            <span>{copy.home.interruptUrge}</span>
            <span className="font-mono text-xs opacity-85">3 / 5 MIN</span>
          </Button>
          <p className="mt-3 max-w-md text-xs leading-relaxed text-[var(--ink-muted)]">
            {copy.home.hint}
          </p>
        </div>
      </div>
    </section>
  );
}
