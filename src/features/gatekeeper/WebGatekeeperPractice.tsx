import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { Volume2, VolumeX } from 'lucide-preact';
import type { GatekeeperAudioMode } from '../../db/types';
import { audioEngine } from '../../lib/audio';
import { cn } from '../../lib/cn';
import { hapticComplete, hapticTap } from '../../lib/native';
import {
  addSession,
  dict,
  makeId,
  rules,
  settings,
  triggerSlowMenuRedirect,
} from '../../state/store';

interface WebGatekeeperPracticeProps {
  open: boolean;
  targetAppName: string;
  targetPackageName: string;
  delaySeconds: 180 | 300;
  ambientSound: GatekeeperAudioMode;
  onClose: () => void;
}

type BreathStage = 'inhale1' | 'inhale2' | 'exhale';

function getBreathStage(elapsedSec: number): BreathStage {
  const pos = elapsedSec % 11;
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

export function WebGatekeeperPractice({
  open,
  targetAppName,
  targetPackageName,
  delaySeconds,
  ambientSound,
  onClose,
}: WebGatekeeperPracticeProps) {
  const copy = dict.value;
  const [remainingSec, setRemainingSec] = useState<number>(delaySeconds);
  const [breathStage, setBreathStage] = useState<BreathStage>('inhale1');
  const [muted, setMuted] = useState<boolean>(ambientSound === 'silent');
  const [unlocked, setUnlocked] = useState<boolean>(false);

  const startMsRef = useRef<number>(0);
  const lastStageRef = useRef<BreathStage>('inhale1');
  const timerRef = useRef<number | null>(null);

  const promptText = useMemo(() => {
    const active = rules.value.filter((r) => r.active);
    if (active.length > 0) {
      const picked = active[Math.floor(Math.random() * active.length)];
      return settings.value.locale === 'id'
        ? `KALAU ${picked.trigger} — MAKA ${picked.action}`
        : `IF ${picked.trigger} — THEN ${picked.action}`;
    }
    const pool = copy.gatekeeper.reflections;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [open, rules.value, settings.value.locale]);

  useEffect(() => {
    if (!open) return;

    startMsRef.current = Date.now();
    lastStageRef.current = 'inhale1';
    setRemainingSec(delaySeconds);
    setBreathStage('inhale1');
    setUnlocked(false);
    setMuted(ambientSound === 'silent');

    if (ambientSound === 'brown' || ambientSound === 'drone') {
      audioEngine.startNoise(ambientSound, settings.value.noiseVolume);
    }

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startMsRef.current) / 1000;
      const rem = Math.max(0, delaySeconds - elapsed);
      setRemainingSec(rem);

      const stage = getBreathStage(elapsed);
      if (stage !== lastStageRef.current) {
        lastStageRef.current = stage;
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
        setUnlocked(true);
        void hapticComplete(settings.value.hapticsEnabled);
      }
    }, 150);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      audioEngine.stopNoise();
    };
  }, [open, delaySeconds, ambientSound]);

  if (!open) return null;

  const toggleMute = () => {
    if (ambientSound === 'silent') return;
    if (muted) {
      audioEngine.startNoise(ambientSound, settings.value.noiseVolume);
      setMuted(false);
    } else {
      audioEngine.stopNoise();
      setMuted(true);
    }
  };

  const recordOutcome = async (completed: boolean) => {
    const now = Date.now();
    const actualSeconds = Math.max(
      1,
      Math.min(delaySeconds, Math.round((now - startMsRef.current) / 1000))
    );
    await addSession({
      id: makeId('gk'),
      type: 'urge',
      startedAt: startMsRef.current || now - actualSeconds * 1000,
      endedAt: now,
      plannedSeconds: delaySeconds,
      actualSeconds,
      completed,
      trigger: 'muscle_memory',
      appPackage: targetPackageName,
      appName: targetAppName,
    });
  };

  const handlePutItDown = async () => {
    audioEngine.stopNoise();
    await recordOutcome(false);
    onClose();
    triggerSlowMenuRedirect();
  };

  const handleContinue = async () => {
    if (!unlocked) return;
    audioEngine.stopNoise();
    await recordOutcome(true);
    onClose();
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${copy.gatekeeper.pauseBefore} ${targetAppName}`}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#191614] px-6 py-8 text-[#EDE4D7]"
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#A69A8D]">
          LOBOTOMI · TEA BREAK
        </span>
        <button
          type="button"
          onClick={toggleMute}
          disabled={ambientSound === 'silent'}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#36302B] bg-[#231F1C] px-3 font-mono text-[11px] uppercase text-[#EDE4D7] disabled:opacity-50 cursor-pointer"
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5 text-[#A69A8D]" strokeWidth={1.75} />
          ) : (
            <Volume2 className="h-3.5 w-3.5 text-[#84A98C]" strokeWidth={1.75} />
          )}
          <span>
            {ambientSound === 'silent'
              ? copy.gatekeeper.silentBtn
              : muted
                ? copy.gatekeeper.unmuteBtn
                : copy.gatekeeper.muteBtn}
          </span>
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-between py-6">
        <h2 className="font-serif text-3xl leading-[1.1] tracking-tight text-[#EDE4D7]">
          {copy.gatekeeper.pauseBefore} {targetAppName}
        </h2>

        <div className="flex flex-col items-center justify-center py-6">
          <div className="relative flex h-56 w-56 items-center justify-center">
            <div className="tea-ripple absolute inset-0 border border-[#36302B]" />
            <div
              className={cn(
                'tea-ripple h-52 w-52 border-2 border-[#84A98C] bg-[#231F1C] transition-transform ease-tactile',
                ringScale,
                ringDuration
              )}
            />
            <div className="relative z-10 text-center">
              <p className="font-mono text-3xl tracking-tight text-[#EDE4D7] tabular-nums">
                {formatClock(remainingSec)}
              </p>
              <p className="mt-1.5 text-xs text-[#A69A8D]">{breathText}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-[#36302B] bg-[#231F1C] p-4 space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#84A98C]">
              {copy.gatekeeper.observationLabel}
            </p>
            <p className="text-sm leading-relaxed text-[#EDE4D7]">{promptText}</p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => void handlePutItDown()}
              className="min-h-12 h-auto w-full rounded-full bg-[#84A98C] px-4 py-3 text-sm font-semibold leading-snug whitespace-normal text-[#191614] shadow-[0_3px_0_#0F0D0C] active:translate-y-[2px] active:shadow-none cursor-pointer"
            >
              {copy.gatekeeper.putDownBtn}
            </button>
            <button
              type="button"
              disabled={!unlocked}
              onClick={() => void handleContinue()}
              className={cn(
                'min-h-12 h-auto w-full rounded-full border px-4 py-3 text-sm font-mono leading-snug whitespace-normal tabular-nums',
                unlocked
                  ? 'border-[#84A98C] bg-[#231F1C] text-[#EDE4D7] cursor-pointer'
                  : 'border-[#36302B] bg-[#191614] text-[#6E6257] cursor-not-allowed'
              )}
            >
              {copy.gatekeeper.continueBtn} {targetAppName}
              {!unlocked ? ` (${formatClock(remainingSec)})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
