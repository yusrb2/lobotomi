import { useMemo, useState } from 'preact/hooks';
import { Award, Check, Dices } from 'lucide-preact';
import { LoboMascot } from '../../components/LoboMascot';
import { triggerConfetti } from '../../components/PaperConfetti';
import { Button } from '../../components/ui/Button';
import { getChallengeForToday, getChallengeText } from '../../lib/challenges';
import { cn } from '../../lib/cn';
import { playRoll, playStampUnlock } from '../../lib/sound';
import { computePassportStamps } from '../../lib/stamps';
import {
  activeTab,
  challengesCompleted,
  completeDailyChallenge,
  dict,
  gatekeeperConfig,
  rules,
  sessions,
  settings,
  todayQuietMinutes,
} from '../../state/store';

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
  const locale = settings.value.locale;
  const greeting = getTimeGreeting(copy.home);

  const [challengeOffset, setChallengeOffset] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [completedChallengeId, setCompletedChallengeId] = useState<string | null>(null);

  const currentChallenge = useMemo(
    () => getChallengeForToday(challengeOffset),
    [challengeOffset]
  );

  const stats = useMemo(() => {
    const savedMinutes = Math.round(
      sessions.value.reduce((acc, s) => acc + s.actualSeconds, 0) / 60
    );
    const urgesPassed = sessions.value.filter((s) => s.type === 'urge').length;
    const stamps = computePassportStamps({
      sessions: sessions.value,
      rules: rules.value,
      challengesCompleted: challengesCompleted.value,
      guardedAppsCount: gatekeeperConfig.value.apps.length,
    });
    const unlockedStamps = stamps.filter((s) => s.unlocked);
    return { savedMinutes, urgesPassed, stamps, unlockedStamps };
  }, [
    sessions.value,
    rules.value,
    challengesCompleted.value,
    gatekeeperConfig.value.apps.length,
  ]);

  const handleReroll = () => {
    playRoll();
    setCompletedChallengeId(null);
    setChallengeOffset((o) => o + 1);
    setShaking(true);
    window.setTimeout(() => setShaking(false), 360);
  };

  const handleCompleteChallenge = async () => {
    if (completedChallengeId === currentChallenge.id) return;
    setCompletedChallengeId(currentChallenge.id);
    await completeDailyChallenge(currentChallenge);
    triggerConfetti();
    playStampUnlock();
  };

  const challengeDone = completedChallengeId === currentChallenge.id;

  return (
    <section className="flex flex-1 flex-col justify-between gap-6 py-4">
      <div className="space-y-6">
        <div className="space-y-3.5">
          <div className="flex items-end justify-between gap-4">
            <p className="badge-sage inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs uppercase tracking-[0.08em] tabular-nums">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-strong)]" aria-hidden="true" />
              <span>
                {todayQuietMinutes.value} {copy.home.quietToday}
              </span>
            </p>
            <LoboMascot mood="idle" pokeable size="md" />
          </div>
          <h1 className="font-serif text-3xl leading-[1.1] tracking-tight text-[var(--ink)] sm:text-4xl">
            {greeting}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">{copy.tagline}</p>
        </div>

        <div>
          <Button
            variant="primary"
            size="lg"
            onClick={onStartUrge}
            className="h-14 w-full justify-between px-6 text-base"
          >
            <span>{copy.home.interruptUrge}</span>
            <span className="font-mono text-xs opacity-85">3 / 5 MIN</span>
          </Button>
          <p className="mt-2.5 text-xs leading-relaxed text-[var(--ink-muted)]">
            {copy.home.hint}
          </p>
        </div>
      </div>

      {/* Brain Rot Resistance Card */}
      <div className="paper-card p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[var(--ink)]">
            {copy.home.resistanceTitle}
          </h2>
          <button
            type="button"
            onClick={() => {
              activeTab.value = 'ledger';
            }}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--accent-strong)] hover:bg-[var(--surface-2)] cursor-pointer"
          >
            <Award className="h-3.5 w-3.5" strokeWidth={2} />
            <span>{copy.home.viewStamps}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[var(--bg)] p-2.5 border border-[var(--border)]">
            <p className="font-mono text-xl font-semibold text-[var(--ink)] tabular-nums">
              {stats.savedMinutes}
            </p>
            <p className="text-[11px] text-[var(--ink-muted)]">{copy.home.savedMinutes}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg)] p-2.5 border border-[var(--border)]">
            <p className="font-mono text-xl font-semibold text-[var(--warn)] tabular-nums">
              {stats.urgesPassed}
            </p>
            <p className="text-[11px] text-[var(--ink-muted)]">{copy.home.urgesPassed}</p>
          </div>
          <div className="rounded-xl bg-[var(--bg)] p-2.5 border border-[var(--border)]">
            <p className="font-mono text-xl font-semibold text-[var(--cobalt)] tabular-nums">
              {stats.unlockedStamps.length}/{stats.stamps.length}
            </p>
            <p className="text-[11px] text-[var(--ink-muted)]">{copy.home.stampsCount}</p>
          </div>
        </div>

        {stats.unlockedStamps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {stats.unlockedStamps.slice(0, 4).map((stamp) => (
              <button
                key={stamp.id}
                type="button"
                onClick={() => {
                  activeTab.value = 'ledger';
                }}
                className="badge-amber rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold cursor-pointer"
              >
                {stamp.title[locale]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Daily Boredom Challenge */}
      <div
        className={cn(
          'paper-note p-4 space-y-3',
          shaking && 'animate-card-shake'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="badge-cobalt rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">
            {copy.home.challengeTitle}
          </span>
          <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
            {currentChallenge.minutes}m
          </span>
        </div>

        <p className="text-sm font-medium leading-snug text-[var(--ink)]">
          {getChallengeText(currentChallenge, locale)}
        </p>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleReroll} className="flex-1">
            <Dices className="h-3.5 w-3.5" strokeWidth={2} />
            <span>{copy.home.rerollBtn}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={challengeDone}
            onClick={() => void handleCompleteChallenge()}
            className="flex-1"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2} />
            <span>{challengeDone ? copy.home.completedBadge : copy.home.doneBtn}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}
