import type { IfThenRule, Locale, SessionRecord } from '../db/types';

export type StampTone = 'sage' | 'terracotta' | 'amber' | 'cobalt';

export interface PassportStamp {
  id: string;
  code: string;
  tone: StampTone;
  rotation: number;
  title: Record<Locale, string>;
  criteria: Record<Locale, string>;
  unlocked: boolean;
}

export interface StampMetrics {
  sessions: SessionRecord[];
  rules: IfThenRule[];
  challengesCompleted: number;
  guardedAppsCount: number;
}

export function computePassportStamps(metrics: StampMetrics): PassportStamp[] {
  const { sessions, rules, challengesCompleted, guardedAppsCount } = metrics;
  const totalMinutes = Math.round(
    sessions.reduce((acc, s) => acc + s.actualSeconds, 0) / 60
  );
  const urgeCount = sessions.filter((s) => s.type === 'urge').length;
  const fastCount = sessions.filter((s) => s.type === 'fast').length;
  const activeRules = rules.filter((r) => r.active).length;

  return [
    {
      id: 'first_pause',
      code: '01 · PAUSE',
      tone: 'sage',
      rotation: -4,
      title: { en: 'First Buffer', id: 'Jeda Pertama' },
      criteria: {
        en: 'Complete 1 pause or stillness session',
        id: 'Selesaikan 1 sesi jeda atau hening',
      },
      unlocked: sessions.length >= 1,
    },
    {
      id: 'wave_rider',
      code: '02 · WAVE',
      tone: 'terracotta',
      rotation: 3,
      title: { en: 'Wave Surfer', id: 'Penunggang Ombak' },
      criteria: {
        en: 'Survive 3 urge-surfing waves',
        id: 'Lewati 3 gelombang dorongan',
      },
      unlocked: urgeCount >= 3,
    },
    {
      id: 'zen_potato',
      code: '03 · STILL',
      tone: 'amber',
      rotation: -3,
      title: { en: 'Boredom Chef', id: 'Ahli Rebahan Sunyi' },
      criteria: {
        en: 'Finish 2 Boredom Fasts or Daily Challenges',
        id: 'Selesaikan 2 Puasa Bosan atau Tantangan Harian',
      },
      unlocked: fastCount + challengesCompleted >= 2,
    },
    {
      id: 'quiet_hour',
      code: '04 · 60M',
      tone: 'cobalt',
      rotation: 5,
      title: { en: 'Quiet Hour', id: 'Sejam Tenang' },
      criteria: {
        en: 'Reclaim 60 cumulative quiet minutes',
        id: 'Kumpulkan total 60 menit tenang',
      },
      unlocked: totalMinutes >= 60,
    },
    {
      id: 'architect',
      code: '05 · PLAN',
      tone: 'sage',
      rotation: -2,
      title: { en: 'Trap Setter', id: 'Perancang Jebakan' },
      criteria: {
        en: 'Keep at least 3 active If-Then notes',
        id: 'Punya minimal 3 catatan If-Then aktif',
      },
      unlocked: activeRules >= 3,
    },
    {
      id: 'gate_bouncer',
      code: '06 · GUARD',
      tone: 'terracotta',
      rotation: 4,
      title: { en: 'Door Bouncer', id: 'Penjaga Pintu' },
      criteria: {
        en: 'Guard at least 1 noisy app (or test Gatekeeper)',
        id: 'Jaga minimal 1 aplikasi berisik (atau uji Gatekeeper)',
      },
      unlocked:
        guardedAppsCount >= 1 || sessions.some((s) => Boolean(s.appName)),
    },
  ];
}
