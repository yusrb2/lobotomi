import { useEffect, useRef, useState } from 'preact/hooks';
import { Volume2, VolumeX, FileText } from 'lucide-preact';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Slider } from '../../components/ui/Slider';
import { audioEngine } from '../../lib/audio';
import { hapticComplete, hapticTap } from '../../lib/native';
import { cn } from '../../lib/cn';
import type { AmbientNoise, UrgeTrigger } from '../../db/types';
import { addSession, dict, makeId, saveDump, settings } from '../../state/store';

interface UrgeSurfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = 'setup' | 'active' | 'checkin';
type BreathStage = 'inhale1' | 'inhale2' | 'exhale';

const CYCLE_SECONDS = 11; // 4s inhale + 1s top-up + 6s exhale

function getBreathStage(elapsedSec: number): BreathStage {
  const pos = elapsedSec % CYCLE_SECONDS;
  if (pos < 4) return 'inhale1';
  if (pos < 5) return 'inhale2';
  return 'exhale';
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

const TRIGGERS: UrgeTrigger[] = [
  'boredom',
  'mental_fatigue',
  'task_avoidance',
  'restlessness',
  'muscle_memory',
];

export function UrgeSurfDialog({ open, onOpenChange }: UrgeSurfDialogProps) {
  const copy = dict.value;
  const [phase, setPhase] = useState<Phase>('setup');
  const [durationMin, setDurationMin] = useState<3 | 5>(3);
  const [noise, setNoise] = useState<AmbientNoise>(settings.value.defaultNoise);
  const [volume, setVolume] = useState<number>(settings.value.noiseVolume);
  const [clarityBefore, setClarityBefore] = useState<number>(3);
  const [clarityAfter, setClarityAfter] = useState<number>(2);
  const [trigger, setTrigger] = useState<UrgeTrigger>('boredom');
  const [remainingSec, setRemainingSec] = useState<number>(180);
  const [breathStage, setBreathStage] = useState<BreathStage>('inhale1');
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [scratchpad, setScratchpad] = useState('');
  const [dumpChoice, setDumpChoice] = useState<'archive' | 'release'>('release');

  const startMsRef = useRef<number>(0);
  const plannedSecRef = useRef<number>(180);
  const lastBreathRef = useRef<BreathStage>('inhale1');
  const timerRef = useRef<number | null>(null);

  const resetModalState = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    audioEngine.stopNoise();
    setPhase('setup');
    setNoise(settings.value.defaultNoise);
    setVolume(settings.value.noiseVolume);
    setClarityBefore(3);
    setClarityAfter(2);
    setTrigger('boredom');
    setScratchpad('');
    setScratchpadOpen(false);
    setDumpChoice('release');
  };

  useEffect(() => {
    if (!open) {
      resetModalState();
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      audioEngine.stopNoise();
    };
  }, [open]);

  const startSession = () => {
    const totalSec = durationMin * 60;
    plannedSecRef.current = totalSec;
    startMsRef.current = Date.now();
    lastBreathRef.current = 'inhale1';
    setRemainingSec(totalSec);
    setBreathStage('inhale1');
    setPhase('active');
    void hapticTap(settings.value.hapticsEnabled, 'light');

    if (noise !== 'off') {
      audioEngine.startNoise(noise, volume);
    }

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startMsRef.current) / 1000;
      const rem = Math.max(0, totalSec - elapsed);
      setRemainingSec(rem);

      const stage = getBreathStage(elapsed);
      if (stage !== lastBreathRef.current) {
        lastBreathRef.current = stage;
        setBreathStage(stage);
        void hapticTap(
          settings.value.hapticsEnabled,
          stage === 'inhale2' ? 'medium' : 'light'
        );
      }

      if (rem <= 0) {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        audioEngine.stopNoise();
        void hapticComplete(settings.value.hapticsEnabled);
        setClarityAfter(Math.max(1, clarityBefore - 1));
        setPhase('checkin');
      }
    }, 150);
  };

  const handleNoiseSwitch = (next: AmbientNoise) => {
    setNoise(next);
    if (phase === 'active') {
      if (next === 'off') {
        audioEngine.stopNoise();
      } else {
        audioEngine.startNoise(next, volume);
      }
    }
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    if (phase === 'active' && noise !== 'off') {
      audioEngine.setVolume(nextVol);
    }
  };

  const finishEarly = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    audioEngine.stopNoise();
    setClarityAfter(Math.max(1, clarityBefore - 1));
    setPhase('checkin');
  };

  const saveAndClose = async () => {
    const now = Date.now();
    const actualSeconds = Math.max(
      1,
      Math.min(plannedSecRef.current, Math.round((now - startMsRef.current) / 1000))
    );
    const completed = actualSeconds >= plannedSecRef.current - 1;

    await addSession({
      id: makeId('urge'),
      type: 'urge',
      startedAt: startMsRef.current || now - actualSeconds * 1000,
      endedAt: now,
      plannedSeconds: plannedSecRef.current,
      actualSeconds,
      completed,
      trigger,
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

    onOpenChange(false);
  };

  const ringScale =
    breathStage === 'inhale1'
      ? 'scale-[0.86]'
      : breathStage === 'inhale2'
        ? 'scale-100'
        : 'scale-[0.62]';

  const ringDuration =
    breathStage === 'inhale1'
      ? 'duration-[3800ms]'
      : breathStage === 'inhale2'
        ? 'duration-[900ms]'
        : 'duration-[5600ms]';

  const breathText =
    breathStage === 'inhale1'
      ? copy.urge.breathInhale1
      : breathStage === 'inhale2'
        ? copy.urge.breathInhale2
        : copy.urge.breathExhale;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetModalState();
        onOpenChange(next);
      }}
      title={phase === 'checkin' ? copy.urge.checkinTitle : copy.urge.title}
      description={phase === 'checkin' ? copy.urge.checkinSubtitle : copy.urge.subtitle}
    >
      {phase === 'setup' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.urge.duration}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([3, 5] as const).map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDurationMin(min)}
                  className={cn(
                    'h-11 rounded-[3px] border font-mono text-sm tabular-nums cursor-pointer',
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

          <div className="space-y-2.5">
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
                    'h-9 rounded-[3px] border font-mono text-xs cursor-pointer',
                    noise === mode
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)]'
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
              <div className="pt-1">
                <Slider
                  value={Math.round(volume * 100)}
                  onValueChange={(v) => handleVolumeChange(v / 100)}
                  min={5}
                  max={100}
                  step={5}
                  ariaLabel={copy.urge.volume}
                />
              </div>
            )}
          </div>

          <Button variant="primary" size="lg" onClick={startSession} className="w-full">
            {copy.urge.begin}
          </Button>
        </div>
      )}

      {phase === 'active' && (
        <div className="space-y-6">
          <div className="flex flex-col items-center py-4">
            <div className="relative flex h-52 w-52 items-center justify-center">
              <div className="tea-ripple absolute inset-0 border-[1.5px] border-dashed border-[var(--border)]" />
              <div
                className={cn(
                  'tea-ripple h-48 w-48 border-2 border-[var(--accent)] bg-[var(--surface)] transition-transform ease-tactile',
                  ringScale,
                  ringDuration
                )}
              />
              <div className="relative z-10 text-center">
                <p className="font-mono text-3xl tracking-tight text-[var(--ink)] tabular-nums">
                  {formatClock(remainingSec)}
                </p>
                <p className="mt-1.5 text-xs tracking-wide text-[var(--ink-muted)]">
                  {breathText}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
            <div className="flex items-center gap-1.5">
              {noise === 'off' ? (
                <VolumeX className="h-4 w-4 text-[var(--ink-muted)]" strokeWidth={1.5} />
              ) : (
                <Volume2 className="h-4 w-4 text-[var(--accent)]" strokeWidth={1.5} />
              )}
              {(['off', 'brown', 'pink'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleNoiseSwitch(mode)}
                  className={cn(
                    'rounded-[2px] border px-2 py-1 font-mono text-[11px] cursor-pointer',
                    noise === mode
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)]'
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
              className="inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{copy.urge.scratchpadToggle}</span>
            </button>
          </div>

          {scratchpadOpen && (
            <textarea
              value={scratchpad}
              onInput={(e) => setScratchpad((e.target as HTMLTextAreaElement).value)}
              rows={3}
              placeholder={copy.urge.scratchpadPlaceholder}
              className="w-full resize-none rounded-[3px] border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          )}

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 border border-[var(--border)]"
            >
              {copy.urge.cancel}
            </Button>
            <Button variant="secondary" onClick={finishEarly} className="flex-1">
              {copy.urge.finishEarly}
            </Button>
          </div>
        </div>
      )}

      {phase === 'checkin' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.urge.triggerLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {TRIGGERS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTrigger(item)}
                  className={cn(
                    'rounded-[3px] border px-3 py-1.5 text-xs cursor-pointer',
                    trigger === item
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]'
                  )}
                >
                  {copy.urge.triggers[item]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
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
          </div>

          {scratchpad.trim().length > 0 && (
            <div className="space-y-2 rounded-[3px] border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
                {copy.urge.dumpActionLabel}
              </p>
              <p className="line-clamp-2 text-xs text-[var(--ink)]">{scratchpad.trim()}</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDumpChoice('release')}
                  className={cn(
                    'h-8 rounded-[2px] border text-xs cursor-pointer',
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
                    'h-8 rounded-[2px] border text-xs cursor-pointer',
                    dumpChoice === 'archive'
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg)]'
                      : 'border-[var(--border)] text-[var(--ink-muted)]'
                  )}
                >
                  {copy.urge.dumpArchive}
                </button>
              </div>
            </div>
          )}

          <Button variant="primary" size="lg" onClick={() => void saveAndClose()} className="w-full">
            {copy.urge.saveSession}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
