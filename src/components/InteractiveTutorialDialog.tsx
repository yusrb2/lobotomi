import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Bell, RefreshCw, Shuffle, Shield, Hand } from 'lucide-preact';
import { LoboMascot } from './LoboMascot';
import { triggerConfetti } from './PaperConfetti';
import { Button } from './ui/Button';
import { audioEngine } from '../lib/audio';
import { cn } from '../lib/cn';
import { hapticComplete, hapticTap } from '../lib/native';
import { playClick, playRoll, playStampUnlock } from '../lib/sound';
import {
  activeTab,
  dict,
  markOnboardingCompleted,
  menuItems,
  settings,
} from '../state/store';

interface InteractiveTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Direction = 'next' | 'prev';
type BreathPhase = 'idle' | 'inhale1' | 'inhale2' | 'exhale' | 'done';

const TOTAL_STEPS = 5;

export function InteractiveTutorialDialog({
  open,
  onOpenChange,
}: InteractiveTutorialDialogProps) {
  const copy = dict.value;
  const tut = copy.tutorial;

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<Direction>('next');

  // Step 1 sandbox state
  const [tapCount, setTapCount] = useState(0);

  // Step 2 breath sandbox state
  const [breathPhase, setBreathPhase] = useState<BreathPhase>('idle');
  const [breathClock, setBreathClock] = useState('11s');
  const breathTimerRef = useRef<number | null>(null);
  const breathStartRef = useRef<number>(0);
  const lastPhaseRef = useRef<BreathPhase>('idle');

  // Step 3 bowl chime state
  const [chimeActive, setChimeActive] = useState(false);
  const chimeTimerRef = useRef<number | null>(null);

  // Step 4 flip + shuffle state
  const [flippedToPlan, setFlippedToPlan] = useState(false);
  const [shuffledActivity, setShuffledActivity] = useState<string | null>(null);

  // Step 5 preview toggle state
  const [previewAppIdx, setPreviewAppIdx] = useState(0);

  // Touch swipe tracking
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const stopBreathCycle = (resetToIdle = true) => {
    if (breathTimerRef.current !== null) {
      window.clearInterval(breathTimerRef.current);
      breathTimerRef.current = null;
    }
    if (resetToIdle) {
      lastPhaseRef.current = 'idle';
      setBreathPhase('idle');
      setBreathClock('11s');
    }
  };

  useEffect(() => {
    if (!open) {
      stopBreathCycle();
      if (chimeTimerRef.current !== null) {
        window.clearTimeout(chimeTimerRef.current);
        chimeTimerRef.current = null;
      }
      setChimeActive(false);
      setStep(0);
      setDirection('next');
      setTapCount(0);
      setFlippedToPlan(false);
      setShuffledActivity(null);
    }
    return () => {
      stopBreathCycle(false);
      if (chimeTimerRef.current !== null) {
        window.clearTimeout(chimeTimerRef.current);
      }
    };
  }, [open]);

  useEffect(() => {
    if (step !== 1) {
      stopBreathCycle();
    }
  }, [step]);

  const goToStep = (nextIdx: number) => {
    const clamped = Math.max(0, Math.min(TOTAL_STEPS - 1, nextIdx));
    if (clamped === step) return;
    setDirection(clamped > step ? 'next' : 'prev');
    setStep(clamped);
    playClick();
  };

  const finishAndClose = (goToGatekeeper = false, celebrate = false) => {
    stopBreathCycle();
    markOnboardingCompleted();
    if (celebrate) {
      triggerConfetti();
      playStampUnlock();
    }
    onOpenChange(false);
    if (goToGatekeeper) {
      activeTab.value = 'guard';
    }
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (step < TOTAL_STEPS - 1) goToStep(step + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (step > 0) goToStep(step - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, step]);

  const startBreathCycle = () => {
    if (breathPhase !== 'idle' && breathPhase !== 'done') {
      stopBreathCycle();
      return;
    }
    stopBreathCycle(false);
    breathStartRef.current = Date.now();
    lastPhaseRef.current = 'inhale1';
    setBreathPhase('inhale1');
    setBreathClock('4s');
    void hapticTap(settings.value.hapticsEnabled, 'light');

    breathTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - breathStartRef.current) / 1000;
      if (elapsed >= 11) {
        stopBreathCycle(false);
        lastPhaseRef.current = 'done';
        setBreathPhase('done');
        setBreathClock('0s');
        void hapticComplete(settings.value.hapticsEnabled);
        return;
      }

      let nextPhase: BreathPhase;
      let secsLeft: number;
      if (elapsed < 4) {
        nextPhase = 'inhale1';
        secsLeft = Math.ceil(4 - elapsed);
      } else if (elapsed < 5) {
        nextPhase = 'inhale2';
        secsLeft = Math.ceil(5 - elapsed);
      } else {
        nextPhase = 'exhale';
        secsLeft = Math.ceil(11 - elapsed);
      }

      setBreathClock(`${Math.max(1, secsLeft)}s`);
      if (nextPhase !== lastPhaseRef.current) {
        lastPhaseRef.current = nextPhase;
        setBreathPhase(nextPhase);
        void hapticTap(
          settings.value.hapticsEnabled,
          nextPhase === 'inhale2' ? 'medium' : 'light'
        );
      }
    }, 100);
  };

  const handleTactileTest = () => {
    setTapCount((c) => c + 1);
    audioEngine.playWoodTap();
    void hapticTap(settings.value.hapticsEnabled, 'medium');
  };

  const handleRingBowl = () => {
    audioEngine.playSingingBowl();
    void hapticComplete(settings.value.hapticsEnabled);
    setChimeActive(true);
    if (chimeTimerRef.current !== null) {
      window.clearTimeout(chimeTimerRef.current);
    }
    chimeTimerRef.current = window.setTimeout(() => {
      setChimeActive(false);
    }, 3600);
  };

  const handleShuffleSlow = () => {
    const items = menuItems.value;
    if (items.length === 0) return;
    playRoll();
    const pool =
      items.length > 1 && shuffledActivity
        ? items.filter((item) => item.title !== shuffledActivity)
        : items;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setShuffledActivity(pick.title);
  };

  const onTouchStart = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    if (t) touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartRef.current;
    const end = e.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !end) return;
    const dx = end.clientX - start.x;
    const dy = end.clientY - start.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0 && step < TOTAL_STEPS - 1) {
        goToStep(step + 1);
      } else if (dx > 0 && step > 0) {
        goToStep(step - 1);
      }
    }
  };

  const breathScale =
    breathPhase === 'inhale1'
      ? 'scale-[0.86]'
      : breathPhase === 'inhale2'
        ? 'scale-100'
        : breathPhase === 'exhale'
          ? 'scale-[0.62]'
          : 'scale-[0.72]';

  const breathDuration =
    breathPhase === 'inhale1'
      ? 'duration-[3800ms]'
      : breathPhase === 'inhale2'
        ? 'duration-[900ms]'
        : breathPhase === 'exhale'
          ? 'duration-[5600ms]'
          : 'duration-400';

  const breathCaption =
    breathPhase === 'inhale1'
      ? copy.urge.breathInhale1
      : breathPhase === 'inhale2'
        ? copy.urge.breathInhale2
        : breathPhase === 'exhale'
          ? copy.urge.breathExhale
          : breathPhase === 'done'
            ? tut.step2.doneLabel
            : tut.step2.readyLabel;

  const previewApp =
    previewAppIdx === 0 ? tut.step5.previewTarget : tut.step5.previewAlt;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          markOnboardingCompleted();
        }
        onOpenChange(next);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#161514]/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="fixed left-1/2 top-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg max-h-[90dvh] flex-col -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border-2 border-[var(--border-card)] bg-[var(--bg)] text-[var(--ink)] shadow-[0_5px_0_var(--card-shadow-soft)] focus:outline-none"
        >
          {/* Top bar: Progress capsules + Skip */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-[var(--border)] px-5 py-3.5">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Tutorial steps">
              {Array.from({ length: TOTAL_STEPS }).map((_, idx) => {
                const active = idx === step;
                return (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-label={`${tut.stepPrefix} ${idx + 1}`}
                    onClick={() => goToStep(idx)}
                    className={cn(
                      'h-2 rounded-full transition-[width,background-color] duration-240 ease-out cursor-pointer',
                      active
                        ? 'w-7 bg-[var(--accent)]'
                        : idx < step
                          ? 'w-2.5 bg-[var(--accent)]/55'
                          : 'w-2.5 bg-[var(--border)] hover:bg-[var(--ink-muted)]'
                    )}
                  />
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px] text-[var(--ink-muted)] tabular-nums">
                {step + 1} / {TOTAL_STEPS}
              </span>
              <button
                type="button"
                onClick={() => finishAndClose(false)}
                className="rounded-full px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
              >
                {tut.skip}
              </button>
            </div>
          </div>

          {/* Animated step body */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div
              key={step}
              className={cn(
                'space-y-4',
                direction === 'next' ? 'animate-tutorial-next' : 'animate-tutorial-prev'
              )}
            >
              {step === 0 && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {tut.step1.subtitle}
                      </p>
                      <DialogPrimitive.Title className="font-serif text-3xl leading-tight text-[var(--ink)]">
                        {tut.step1.title}
                      </DialogPrimitive.Title>
                    </div>
                    <LoboMascot mood="idle" pokeable size="sm" className="shrink-0" />
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                    {tut.step1.body}
                  </p>

                  <div className="paper-card p-4 space-y-3 text-center">
                    <Button
                      variant="primary"
                      onClick={handleTactileTest}
                      className="w-full"
                    >
                      <Hand className="h-4 w-4" strokeWidth={1.75} />
                      <span>{tut.step1.testBtn}</span>
                    </Button>
                    <p className="font-mono text-xs text-[var(--ink-muted)] tabular-nums min-h-[1rem]">
                      {tapCount > 0 ? `${tut.step1.tappedLabel} × ${tapCount}` : ' '}
                    </p>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {tut.step2.subtitle}
                      </p>
                      <DialogPrimitive.Title className="font-serif text-3xl leading-tight text-[var(--ink)]">
                        {tut.step2.title}
                      </DialogPrimitive.Title>
                    </div>
                    <LoboMascot
                      mood={breathPhase === 'done' ? 'celebrate' : 'urge'}
                      size="sm"
                      className="shrink-0"
                    />
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                    {tut.step2.body}
                  </p>

                  <div className="paper-card flex flex-col items-center gap-4 p-4">
                    <div className="relative flex h-36 w-36 items-center justify-center">
                      <div className="tea-ripple absolute inset-0 border border-[var(--border)]" />
                      <div
                        className={cn(
                          'tea-ripple h-32 w-32 border-2 border-[var(--accent)] bg-[var(--bg)] transition-transform ease-tactile',
                          breathScale,
                          breathDuration
                        )}
                      />
                      <div className="relative z-10 text-center">
                        <p className="font-mono text-lg text-[var(--ink)] tabular-nums">
                          {breathClock}
                        </p>
                        <p className="mt-0.5 px-2 text-[11px] leading-tight text-[var(--ink-muted)]">
                          {breathCaption}
                        </p>
                      </div>
                    </div>

                    <Button variant="secondary" size="sm" onClick={startBreathCycle}>
                      <span>
                        {breathPhase === 'idle' || breathPhase === 'done'
                          ? tut.step2.tryBtn
                          : tut.step2.stopBtn}
                      </span>
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {tut.step3.subtitle}
                      </p>
                      <DialogPrimitive.Title className="font-serif text-3xl leading-tight text-[var(--ink)]">
                        {tut.step3.title}
                      </DialogPrimitive.Title>
                    </div>
                    <LoboMascot mood="fast" size="sm" className="shrink-0" />
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                    {tut.step3.body}
                  </p>

                  <div className="rounded-2xl border border-[#36302B] bg-black p-5 text-center space-y-3">
                    <p
                      className={cn(
                        'font-mono text-4xl tracking-tight tabular-nums transition-colors duration-300',
                        chimeActive ? 'text-[#84A98C]' : 'text-[#8C8276]'
                      )}
                    >
                      10:00
                    </p>
                    <p className="font-mono text-[11px] text-[#5C544B]">
                      {chimeActive ? tut.step3.ringingLabel : tut.step3.oledCaption}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRingBowl}
                      className="border-[#36302B] bg-[#191614] text-[#EDE4D7] shadow-none hover:bg-[#231F1C]"
                    >
                      <Bell className="h-3.5 w-3.5 text-[#84A98C]" strokeWidth={1.75} />
                      <span>{tut.step3.ringBtn}</span>
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {tut.step4.subtitle}
                      </p>
                      <DialogPrimitive.Title className="font-serif text-3xl leading-tight text-[var(--ink)]">
                        {tut.step4.title}
                      </DialogPrimitive.Title>
                    </div>
                    <LoboMascot mood="idle" size="sm" className="shrink-0" />
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                    {tut.step4.body}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setFlippedToPlan((v) => !v);
                      if (settings.value.soundClicksEnabled) {
                        audioEngine.playWoodTap();
                      }
                    }}
                    className={cn(
                      'paper-note w-full p-4 text-left space-y-2 cursor-pointer transition-colors',
                      flippedToPlan && 'border-[var(--accent)]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'font-mono text-[10px] font-bold uppercase tracking-[0.14em]',
                          flippedToPlan ? 'text-[var(--accent-strong)]' : 'text-[var(--warn)]'
                        )}
                      >
                        {flippedToPlan ? tut.step4.planBadge : tut.step4.autopilotBadge}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--ink-muted)]">
                        <RefreshCw className="h-3 w-3" strokeWidth={1.75} />
                        {tut.step4.flipHint}
                      </span>
                    </div>
                    <p className="text-sm leading-snug text-[var(--ink)]">
                      {flippedToPlan ? tut.step4.planText : tut.step4.autopilotText}
                    </p>
                  </button>

                  <div className="paper-card p-3.5 space-y-2.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleShuffleSlow}
                      className="w-full"
                    >
                      <Shuffle className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span>{tut.step4.shuffleBtn}</span>
                    </Button>
                    {shuffledActivity && (
                      <p className="font-serif text-lg leading-snug text-[var(--ink)] text-center">
                        {shuffledActivity}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent-strong)]">
                        {tut.step5.subtitle}
                      </p>
                      <DialogPrimitive.Title className="font-serif text-3xl leading-tight text-[var(--ink)]">
                        {tut.step5.title}
                      </DialogPrimitive.Title>
                    </div>
                    <LoboMascot mood="gatekeeper" size="sm" className="shrink-0" />
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--ink-muted)]">
                    {tut.step5.body}
                  </p>

                  <div className="rounded-2xl border border-[#36302B] bg-[#191614] p-4 text-[#EDE4D7] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#A69A8D]">
                        LOBOTOMI · TEA BREAK
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewAppIdx((i) => (i === 0 ? 1 : 0))}
                        className="rounded-full border border-[#36302B] bg-[#231F1C] px-2 py-0.5 font-mono text-[10px] text-[#EDE4D7] cursor-pointer"
                      >
                        {previewApp} ↻
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="font-serif text-xl text-[#EDE4D7]">
                        {copy.gatekeeper.pauseBefore} {previewApp}
                      </p>
                      <span className="font-mono text-lg text-[#84A98C] tabular-nums">
                        03:00
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded-full bg-[#84A98C] px-2.5 py-2 text-center text-[11px] font-semibold text-[#191614]">
                        {copy.gatekeeper.putDownBtn}
                      </div>
                      <div className="rounded-full border border-[#36302B] bg-[#191614] px-2.5 py-2 text-center font-mono text-[11px] text-[#6E6257]">
                        {tut.step5.previewLocked}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => finishAndClose(true)}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 text-[var(--accent-strong)]" strokeWidth={1.75} />
                    <span>{tut.step5.setupGatekeeperBtn}</span>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--surface)]/60 px-5 py-3.5">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => goToStep(step - 1)}>
                {tut.back}
              </Button>
            ) : (
              <span />
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Button variant="primary" onClick={() => goToStep(step + 1)}>
                {tut.next}
              </Button>
            ) : (
              <Button variant="primary" onClick={() => finishAndClose(false, true)}>
                {tut.start}
              </Button>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
