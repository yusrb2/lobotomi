import { useEffect, useRef, useState } from 'preact/hooks';
import { FileText, Moon, Volume2, VolumeX } from 'lucide-preact';
import { LoboMascot } from '../../components/LoboMascot';
import { ZenStonesDoodle } from '../../components/Doodles';
import { triggerConfetti } from '../../components/PaperConfetti';
import { Button } from '../../components/ui/Button';
import { Slider } from '../../components/ui/Slider';
import { Switch } from '../../components/ui/Switch';
import { audioEngine } from '../../lib/audio';
import { cn } from '../../lib/cn';
import {
  acquireKeepAwake,
  hapticTap,
  releaseKeepAwake,
} from '../../lib/native';
import { playStampUnlock } from '../../lib/sound';
import type { AmbientNoise } from '../../db/types';
import {
  addSession,
  dict,
  makeId,
  saveDump,
  setOledActive,
  settings,
} from '../../state/store';

type FastPhase = 'setup' | 'active' | 'checkin';

const FAST_DURATIONS = [3, 5, 10, 15, 25, 45] as const;

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function BoredomFastView() {
  const copy = dict.value;
  const [phase, setPhase] = useState<FastPhase>('setup');
  const [durationMin, setDurationMin] = useState<number>(10);
  const [oledEnabled, setOledEnabled] = useState<boolean>(true);
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(settings.value.chimeEnabled);
  const [noise, setNoise] = useState<AmbientNoise>(settings.value.defaultNoise);
  const [volume, setVolume] = useState<number>(settings.value.noiseVolume);
  const [clarityBefore, setClarityBefore] = useState<number>(3);
  const [clarityAfter, setClarityAfter] = useState<number>(2);
  const [remainingSec, setRemainingSec] = useState<number>(600);
  const [controlsVisible, setControlsVisible] = useState<boolean>(true);
  const [scratchpadOpen, setScratchpadOpen] = useState<boolean>(false);
  const [scratchpad, setScratchpad] = useState<string>('');
  const [dumpChoice, setDumpChoice] = useState<'archive' | 'release'>('release');
  const [completedNaturally, setCompletedNaturally] = useState<boolean>(false);

  const startMsRef = useRef<number>(0);
  const plannedSecRef = useRef<number>(600);
  const timerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimers();
      audioEngine.stopNoise();
      setOledActive(false);
      void releaseKeepAwake();
    };
  }, []);

  const scheduleControlsAutoHide = (isOled: boolean) => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (!isOled) {
      setControlsVisible(true);
      return;
    }
    setControlsVisible(true);
    hideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false);
    }, 4000);
  };

  const beginFast = () => {
    const totalSec = durationMin * 60;
    plannedSecRef.current = totalSec;
    startMsRef.current = Date.now();
    setRemainingSec(totalSec);
    setCompletedNaturally(false);
    setPhase('active');
    setOledActive(oledEnabled);
    scheduleControlsAutoHide(oledEnabled);
    void acquireKeepAwake();
    void hapticTap(settings.value.hapticsEnabled, 'light');

    if (noise !== 'off') {
      audioEngine.startNoise(noise, volume);
    }

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startMsRef.current) / 1000;
      const rem = Math.max(0, totalSec - elapsed);
      setRemainingSec(rem);

      if (rem <= 0) {
        clearTimers();
        audioEngine.stopNoise();
        void releaseKeepAwake();
        setOledActive(false);
        if (chimeEnabled) {
          audioEngine.playSingingBowl();
        }
        triggerConfetti();
        playStampUnlock();
        setCompletedNaturally(true);
        setClarityAfter(Math.max(1, clarityBefore - 1));
        setPhase('checkin');
      }
    }, 200);
  };

  const endEarly = () => {
    clearTimers();
    audioEngine.stopNoise();
    void releaseKeepAwake();
    setOledActive(false);
    setCompletedNaturally(false);
    setClarityAfter(Math.max(1, clarityBefore - 1));
    setPhase('checkin');
  };

  const discardSession = () => {
    clearTimers();
    audioEngine.stopNoise();
    void releaseKeepAwake();
    setOledActive(false);
    setScratchpad('');
    setScratchpadOpen(false);
    setPhase('setup');
  };

  const toggleOledDuringActive = () => {
    const next = !oledEnabled;
    setOledEnabled(next);
    setOledActive(next);
    scheduleControlsAutoHide(next);
  };

  const handleNoiseSwitch = (next: AmbientNoise) => {
    setNoise(next);
    if (phase === 'active') {
      if (next === 'off') audioEngine.stopNoise();
      else audioEngine.startNoise(next, volume);
      scheduleControlsAutoHide(oledEnabled);
    }
  };

  const saveSession = async () => {
    const now = Date.now();
    const actualSeconds = Math.max(
      1,
      Math.min(plannedSecRef.current, Math.round((now - startMsRef.current) / 1000))
    );

    await addSession({
      id: makeId('fast'),
      type: 'fast',
      startedAt: startMsRef.current || now - actualSeconds * 1000,
      endedAt: now,
      plannedSeconds: plannedSecRef.current,
      actualSeconds,
      completed: completedNaturally || actualSeconds >= plannedSecRef.current - 1,
      clarityBefore,
      clarityAfter,
    });

    const trimmed = scratchpad.trim();
    if (trimmed && dumpChoice === 'archive') {
      await saveDump({
        id: makeId('dump'),
        content: trimmed,
        createdAt: now,
      });
    }

    setScratchpad('');
    setScratchpadOpen(false);
    setDumpChoice('release');
    setPhase('setup');
  };

  if (phase === 'active') {
    const progress =
      plannedSecRef.current > 0
        ? Math.min(1, Math.max(0, 1 - remainingSec / plannedSecRef.current))
        : 0;

    return (
      <section
        onClick={() => scheduleControlsAutoHide(oledEnabled)}
        className={cn(
          'flex flex-1 flex-col justify-between select-none',
          oledEnabled
            ? 'fixed inset-0 z-40 bg-black px-6 py-10 text-[var(--ink)]'
            : 'py-6'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-between transition-opacity duration-500 ease-tactile',
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-muted)]">
            {copy.fast.title}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleOledDuringActive();
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-2xl border px-2.5 py-1 font-mono text-[11px] cursor-pointer',
              oledEnabled
                ? 'border-[var(--border)] bg-transparent text-[var(--ink)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)]'
            )}
          >
            <Moon className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span>{copy.fast.oledToggle}</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-10 text-center">
          {!oledEnabled && <LoboMascot mood="fast" size="md" className="mb-4" />}
          <p
            className={cn(
              'font-mono tracking-tight tabular-nums',
              oledEnabled
                ? 'text-6xl text-[#78746B] sm:text-7xl'
                : 'text-6xl text-[var(--ink)] sm:text-7xl'
            )}
          >
            {formatClock(remainingSec)}
          </p>
          {oledEnabled && (
            <p
              className={cn(
                'mt-5 font-mono text-[11px] tracking-[0.08em] text-[#52504B] transition-opacity duration-500',
                controlsVisible ? 'opacity-100' : 'opacity-0'
              )}
            >
              {copy.fast.tapHint}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'space-y-4 transition-opacity duration-500 ease-tactile',
              controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {noise === 'off' ? (
                  <VolumeX className="h-4 w-4 text-[var(--ink-muted)]" strokeWidth={1.75} />
                ) : (
                  <Volume2 className="h-4 w-4 text-[var(--accent-strong)]" strokeWidth={1.75} />
                )}
                {(['off', 'brown', 'pink'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleNoiseSwitch(mode)}
                    className={cn(
                      'rounded-full border px-2 py-1 font-mono text-[11px] cursor-pointer',
                      noise === mode
                        ? 'border-[var(--accent)] text-[var(--ink)] bg-[var(--surface-2)]'
                        : 'border-[var(--border)] text-[var(--ink-muted)]'
                    )}
                  >
                    {mode === 'off'
                      ? copy.urge.noiseOff
                      : mode === 'brown'
                        ? copy.urge.noiseBrown
                        : copy.urge.noisePink}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setScratchpadOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>{copy.urge.scratchpadToggle}</span>
              </button>
            </div>

            {scratchpadOpen && (
              <textarea
                value={scratchpad}
                onInput={(e) => setScratchpad((e.target as HTMLTextAreaElement).value)}
                rows={3}
                placeholder={copy.urge.scratchpadPlaceholder}
                className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={discardSession}
                className="flex-1 border border-[var(--border)]"
              >
                {copy.urge.cancel}
              </Button>
              <Button variant="secondary" onClick={endEarly} className="flex-1">
                {copy.fast.endEarly}
              </Button>
            </div>
          </div>

          <div className="h-px w-full bg-[var(--border)]">
            <div
              className="h-full bg-[var(--accent)] transition-[width] duration-300 ease-tactile"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        </div>
      </section>
    );
  }

  if (phase === 'checkin') {
    return (
      <section className="mx-auto w-full max-w-lg space-y-6 py-4">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
          <div className="space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent-strong)]">
              {completedNaturally ? copy.fast.completedNotice : copy.fast.endEarly}
            </p>
            <h2 className="font-serif text-3xl tracking-tight text-[var(--ink)]">
              {copy.urge.checkinTitle}
            </h2>
            <p className="text-xs text-[var(--ink-muted)]">{copy.urge.checkinSubtitle}</p>
          </div>
          {completedNaturally && <LoboMascot mood="celebrate" size="sm" />}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.urge.clarityAfter}
            </span>
            <span className="font-mono text-xs text-[var(--ink)] tabular-nums">
              {clarityBefore} → {clarityAfter}
            </span>
          </div>
          <Slider
            value={clarityAfter}
            onValueChange={setClarityAfter}
            min={1}
            max={5}
            step={1}
            ariaLabel={copy.urge.clarityAfter}
          />
          <div className="flex justify-between font-mono text-[10px] text-[var(--ink-muted)]">
            <span>{copy.urge.clarityLow}</span>
            <span>{copy.urge.clarityHigh}</span>
          </div>
        </div>

        {scratchpad.trim().length > 0 && (
          <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {copy.urge.dumpActionLabel}
            </p>
            <p className="text-xs text-[var(--ink)]">{scratchpad.trim()}</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDumpChoice('release')}
                className={cn(
                  'h-8 rounded-full border text-xs cursor-pointer',
                  dumpChoice === 'release'
                    ? 'border-[var(--warn)] text-[var(--warn)] bg-[var(--bg)]'
                    : 'border-[var(--border)] text-[var(--ink-muted)]'
                )}
              >
                {copy.urge.dumpRelease}
              </button>
              <button
                type="button"
                onClick={() => setDumpChoice('archive')}
                className={cn(
                  'h-8 rounded-full border text-xs cursor-pointer',
                  dumpChoice === 'archive'
                    ? 'border-[var(--accent)] text-[var(--accent-strong)] bg-[var(--bg)]'
                    : 'border-[var(--border)] text-[var(--ink-muted)]'
                )}
              >
                {copy.urge.dumpArchive}
              </button>
            </div>
          </div>
        )}

        <Button variant="primary" size="lg" onClick={() => void saveSession()} className="w-full">
          {copy.urge.saveSession}
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-7 py-2">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="space-y-1.5">
          <h1 className="font-serif text-3xl tracking-tight text-[var(--ink)]">
            {copy.fast.title}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">{copy.fast.subtitle}</p>
        </div>
        <ZenStonesDoodle className="h-12 w-12 shrink-0" />
      </div>

      <div className="space-y-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {copy.fast.duration}
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          {FAST_DURATIONS.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => setDurationMin(min)}
              className={cn(
                'h-12 rounded-full border font-mono text-sm tabular-nums  active:translate-y-[1px] active:shadow-none cursor-pointer',
                durationMin === min
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]'
              )}
            >
              {min} {copy.urge.min}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.urge.clarityBefore}
          </span>
          <span className="font-mono text-xs text-[var(--ink)] tabular-nums">
            {clarityBefore} / 5
          </span>
        </div>
        <Slider
          value={clarityBefore}
          onValueChange={setClarityBefore}
          min={1}
          max={5}
          step={1}
          ariaLabel={copy.urge.clarityBefore}
        />
        <div className="flex justify-between font-mono text-[10px] text-[var(--ink-muted)]">
          <span>{copy.urge.clarityLow}</span>
          <span>{copy.urge.clarityHigh}</span>
        </div>
      </div>

      <div className="paper-card divide-y divide-[var(--border)]">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="space-y-0.5">
            <label htmlFor="fast-oled-switch" className="text-sm font-medium text-[var(--ink)]">
              {copy.fast.oledLabel}
            </label>
            <p className="text-xs text-[var(--ink-muted)]">{copy.fast.oledDesc}</p>
          </div>
          <Switch
            id="fast-oled-switch"
            checked={oledEnabled}
            onCheckedChange={setOledEnabled}
            ariaLabel={copy.fast.oledLabel}
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-4">
          <div className="space-y-0.5">
            <label htmlFor="fast-chime-switch" className="text-sm font-medium text-[var(--ink)]">
              {copy.fast.chimeLabel}
            </label>
            <p className="text-xs text-[var(--ink-muted)]">{copy.fast.chimeDesc}</p>
          </div>
          <Switch
            id="fast-chime-switch"
            checked={chimeEnabled}
            onCheckedChange={setChimeEnabled}
            ariaLabel={copy.fast.chimeLabel}
          />
        </div>

        <div className="space-y-2.5 p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.urge.noise}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['off', 'brown', 'pink'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleNoiseSwitch(mode)}
                className={cn(
                  'h-9 rounded-2xl border font-mono text-xs cursor-pointer',
                  noise === mode
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
                )}
              >
                {mode === 'off'
                  ? copy.urge.noiseOff
                  : mode === 'brown'
                    ? copy.urge.noiseBrown
                    : copy.urge.noisePink}
              </button>
            ))}
          </div>
          {noise !== 'off' && (
            <Slider
              value={Math.round(volume * 100)}
              onValueChange={(v) => setVolume(v / 100)}
              min={5}
              max={100}
              step={5}
              ariaLabel={copy.urge.volume}
            />
          )}
        </div>
      </div>

      <Button variant="primary" size="lg" onClick={beginFast} className="w-full">
        {copy.fast.begin}
      </Button>
    </section>
  );
}
