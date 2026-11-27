import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';

export const confettiBurstNonce = signal(0);

export function triggerConfetti(): void {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  confettiBurstNonce.value += 1;
}

interface Scrap {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  angle: number;
  spin: number;
  color: string;
  alpha: number;
}

const SCRAP_COLORS = ['#4E7A5B', '#C95F42', '#D99626', '#2C528C', '#EFE9DC'];

export function PaperConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nonce = confettiBurstNonce.value;

  useEffect(() => {
    if (nonce === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const originX = width * 0.5;
    const originY = height * 0.44;
    const scraps: Scrap[] = Array.from({ length: 28 }).map((_, i) => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      const speed = 4.2 + Math.random() * 6.5;
      return {
        x: originX + (Math.random() - 0.5) * 32,
        y: originY + (Math.random() - 0.5) * 18,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        w: 7 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.24,
        color: SCRAP_COLORS[i % SCRAP_COLORS.length],
        alpha: 1,
      };
    });

    let rafId = 0;
    const start = performance.now();

    const frame = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);

      let alive = 0;
      for (const s of scraps) {
        s.vx *= 0.985;
        s.vy += 0.26;
        s.x += s.vx;
        s.y += s.vy;
        s.angle += s.spin;
        if (elapsed > 1100) {
          s.alpha = Math.max(0, 1 - (elapsed - 1100) / 700);
        }
        if (s.alpha <= 0 || s.y > height + 30) continue;
        alive += 1;

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.fillStyle = s.color;
        ctx.strokeStyle = '#1F1C18';
        ctx.lineWidth = 1;
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.restore();
      }

      if (alive > 0 && elapsed < 1900) {
        rafId = window.requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    rafId = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, width, height);
    };
  }, [nonce]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
    />
  );
}
