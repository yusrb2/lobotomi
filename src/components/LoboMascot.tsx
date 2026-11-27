import { useEffect, useRef, useState } from 'preact/hooks';
import { cn } from '../lib/cn';
import { playPoke } from '../lib/sound';
import { settings } from '../state/store';

export type LoboMood = 'idle' | 'urge' | 'fast' | 'gatekeeper' | 'celebrate';

interface LoboMascotProps {
  mood?: LoboMood;
  pokeable?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BANTER_EN = [
  'Oh, you tapped me instead of Instagram. Growth.',
  'My two brain cells are currently on a union break.',
  'Nothing urgent happened on your timeline. I checked.',
  'Put me down? No, put the feed down.',
  'Scrolling burns thumb calories, not real ones.',
  'I am legally obligated to remind you to blink.',
  'Zero notifications. Just two quiet cortex halves.',
  'Look at you, tolerating 4 seconds of silence.',
];

const BANTER_ID = [
  'Eh, nyolek aku alih-alih buka Instagram. Kemajuan.',
  'Dua sel otakku lagi izin istirahat sebentar.',
  'Nggak ada hal mendesak di lini masa. Sudah kucek.',
  'Jangan sentuh feed—colek aku aja kalau gabut.',
  'Scroll cuma bakar kalori jempol, bukan kalori badan.',
  'Pengingat resmi: jangan lupa berkedip, ya.',
  'Nol notifikasi. Cuma dua belahan otak yang rebahan.',
  'Tuh kan, kuat juga nahan sunyi 4 detik.',
];

export function LoboMascot({
  mood = 'idle',
  pokeable = false,
  size = 'md',
  className,
}: LoboMascotProps) {
  const [blinking, setBlinking] = useState(false);
  const [poked, setPoked] = useState(false);
  const [banter, setBanter] = useState<string | null>(null);
  const lastIdxRef = useRef(-1);
  const pokeTimerRef = useRef<number | null>(null);
  const banterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (mood !== 'idle') return;
    let blinkTimeout: number | null = null;
    const interval = window.setInterval(() => {
      setBlinking(true);
      blinkTimeout = window.setTimeout(() => setBlinking(false), 160);
    }, 3800);
    return () => {
      window.clearInterval(interval);
      if (blinkTimeout !== null) window.clearTimeout(blinkTimeout);
    };
  }, [mood]);

  useEffect(() => {
    return () => {
      if (pokeTimerRef.current !== null) window.clearTimeout(pokeTimerRef.current);
      if (banterTimerRef.current !== null) window.clearTimeout(banterTimerRef.current);
    };
  }, []);

  const handlePoke = () => {
    if (!pokeable) return;
    playPoke();
    setPoked(true);
    if (pokeTimerRef.current !== null) window.clearTimeout(pokeTimerRef.current);
    pokeTimerRef.current = window.setTimeout(() => setPoked(false), 320);

    const pool = settings.value.locale === 'id' ? BANTER_ID : BANTER_EN;
    let idx = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && idx === lastIdxRef.current) {
      idx = (idx + 1) % pool.length;
    }
    lastIdxRef.current = idx;
    setBanter(pool[idx]);

    if (banterTimerRef.current !== null) window.clearTimeout(banterTimerRef.current);
    banterTimerRef.current = window.setTimeout(() => setBanter(null), 3600);
  };

  const dims =
    size === 'sm' ? 'h-16 w-16' : size === 'lg' ? 'h-28 w-28' : 'h-22 w-22';

  const bodyFill =
    mood === 'celebrate'
      ? 'var(--accent-soft)'
      : mood === 'urge'
        ? 'var(--warn-soft)'
        : mood === 'fast'
          ? 'var(--cobalt-soft)'
          : 'var(--amber-soft)';

  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      {banter && (
        <div
          role="status"
          className="paper-card animate-tab-enter mb-2 max-w-[260px] px-3.5 py-2 text-center text-xs font-semibold leading-snug text-[var(--ink)]"
        >
          {banter}
        </div>
      )}

      <button
        type="button"
        onClick={handlePoke}
        disabled={!pokeable}
        aria-label={pokeable ? 'Lobo mascot — tap for comment' : undefined}
        className={cn(
          'relative inline-flex items-center justify-center bg-transparent border-0 p-0 focus-visible:outline-none',
          pokeable ? 'cursor-pointer' : 'cursor-default pointer-events-none',
          poked && 'scale-x-110 scale-y-90',
          !poked && mood === 'fast' && '-translate-y-1',
          'transition-transform duration-300 ease-spring'
        )}
      >
        <svg
          viewBox="0 0 120 110"
          fill="none"
          aria-hidden="true"
          className={dims}
        >
          {/* Floating orbit dots for Boredom Fast */}
          {mood === 'fast' && (
            <g>
              <circle cx="16" cy="28" r="3" fill="var(--honey)" />
              <circle cx="104" cy="24" r="2.5" fill="var(--cobalt)" />
              <circle cx="96" cy="86" r="2.5" fill="var(--accent)" />
            </g>
          )}

          {/* Celebration confetti sparks */}
          {mood === 'celebrate' && (
            <g stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round">
              <path d="M16 24l6 4M104 22l-6 5M22 14l2 6M96 12l-2 6" stroke="var(--warn)" />
              <circle cx="14" cy="48" r="3" fill="var(--honey)" stroke="none" />
              <circle cx="106" cy="46" r="3" fill="var(--cobalt)" stroke="none" />
            </g>
          )}

          {/* Arms */}
          {mood === 'celebrate' ? (
            <g stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round">
              <path d="M24 62c-8-10-10-20-6-26" />
              <path d="M96 62c8-10 10-20 6-26" />
            </g>
          ) : mood === 'gatekeeper' ? (
            <g stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round">
              <path d="M26 68c4 10 18 12 34 10" />
              <path d="M94 68c-4 10-18 12-34 10" />
            </g>
          ) : mood === 'urge' ? (
            <g>
              {/* Cozy pillow hugged during Urge Surfing */}
              <rect
                x="33"
                y="62"
                width="54"
                height="28"
                rx="11"
                fill="var(--surface)"
                stroke="var(--ink)"
                stroke-width="2.4"
              />
              <path
                d="M27 65c2 8 10 12 18 12M93 65c-2 8-10 12-18 12"
                stroke="var(--ink)"
                stroke-width="2.6"
                stroke-linecap="round"
              />
            </g>
          ) : (
            <g stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round">
              <path d="M26 65c-7 4-9 12-4 17" />
              <path d="M94 65c7 4 9 12 4 17" />
            </g>
          )}

          {/* Feet */}
          <path
            d="M44 90c0 6-2 9-6 9M76 90c0 6 2 9 6 9"
            stroke="var(--ink)"
            stroke-width="2.6"
            stroke-linecap="round"
          />

          {/* Main squiggly brain/cloud body */}
          <path
            d="M34 32c-10 2-15 11-12 21-6 6-4 17 4 23 2 10 12 15 24 14 7 4 15 4 22 0 12 1 22-4 24-14 8-6 10-17 4-23 3-10-2-19-12-21-5-9-17-12-27-8-10-4-22-1-27 8Z"
            fill={bodyFill}
            stroke="var(--ink)"
            stroke-width="2.6"
            stroke-linejoin="round"
          />

          {/* Brain fold crease */}
          <path
            d="M59 24c-2 7 2 13 0 19"
            stroke="var(--ink)"
            stroke-width="2.2"
            stroke-linecap="round"
          />

          {/* Sweat drop during urge */}
          {mood === 'urge' && (
            <path
              d="M89 36c3 4 4 7 4 9a4 4 0 1 1-8 0c0-2 1-5 4-9Z"
              fill="var(--cobalt-soft)"
              stroke="var(--cobalt)"
              stroke-width="1.8"
            />
          )}

          {/* Eyes */}
          {mood === 'gatekeeper' ? (
            <g>
              {/* Bouncer sunglasses */}
              <rect x="35" y="46" width="21" height="12" rx="4" fill="#1F1C18" />
              <rect x="64" y="46" width="21" height="12" rx="4" fill="#1F1C18" />
              <path
                d="M56 50h8M30 48l5 1M85 49l5-1"
                stroke="#1F1C18"
                stroke-width="2.5"
                stroke-linecap="round"
              />
              <path d="M40 49h5M69 49h5" stroke="#FAF7F2" stroke-width="1.6" stroke-linecap="round" />
            </g>
          ) : mood === 'celebrate' ? (
            <g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round">
              <path d="M41 53c2-4 7-4 9 0" />
              <path d="M70 53c2-4 7-4 9 0" />
            </g>
          ) : mood === 'fast' || blinking ? (
            <g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round">
              <path d="M41 53h9" />
              <path d="M70 53h9" />
            </g>
          ) : (
            <g>
              <circle cx="45.5" cy="52" r="3.4" fill="var(--ink)" />
              <circle cx="74.5" cy="52" r="3.4" fill="var(--ink)" />
              <circle cx="44.3" cy="50.7" r="1" fill="#F6F2EA" />
              <circle cx="73.3" cy="50.7" r="1" fill="#F6F2EA" />
            </g>
          )}

          {/* Mouth */}
          {mood === 'celebrate' ? (
            <path
              d="M53 62c4 5 10 5 14 0"
              stroke="var(--ink)"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          ) : mood === 'gatekeeper' ? (
            <path
              d="M54 65h12"
              stroke="var(--ink)"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          ) : mood === 'urge' ? (
            <path
              d="M55 60c2-2 4 2 6 0s4 2 6 0"
              stroke="var(--ink)"
              stroke-width="2.2"
              stroke-linecap="round"
            />
          ) : (
            <path
              d="M55 63c3 2.5 7 2.5 10 0"
              stroke="var(--ink)"
              stroke-width="2.4"
              stroke-linecap="round"
            />
          )}
        </svg>
      </button>
    </div>
  );
}
