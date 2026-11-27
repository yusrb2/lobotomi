import type { Locale } from '../db/types';

export interface BoredomChallenge {
  id: string;
  text: Record<Locale, string>;
  minutes: number;
}

export const DAILY_CHALLENGES: BoredomChallenge[] = [
  {
    id: 'ch-ceiling',
    text: {
      en: 'Stare at the ceiling for 3 minutes without touching a screen.',
      id: 'Tatap langit-langit selama 3 menit tanpa menyentuh layar.',
    },
    minutes: 3,
  },
  {
    id: 'ch-window',
    text: {
      en: 'Look out a window and count five distant objects in silence.',
      id: 'Lihat ke luar jendela dan amati lima benda terjauh dalam diam.',
    },
    minutes: 3,
  },
  {
    id: 'ch-water',
    text: {
      en: 'Drink a full glass of water slowly with your phone in another room.',
      id: 'Minum segelas penuh air pelan-pelan saat ponsel ada di ruangan lain.',
    },
    minutes: 2,
  },
  {
    id: 'ch-hands',
    text: {
      en: 'Sit for 3 minutes with your hands resting flat on your knees.',
      id: 'Duduk 3 menit dengan kedua tangan diletakkan santai di lutut.',
    },
    minutes: 3,
  },
  {
    id: 'ch-desk',
    text: {
      en: 'Put away five stray items on your desk without opening any app.',
      id: 'Rapikan lima barang berserakan di mejamu tanpa membuka aplikasi apa pun.',
    },
    minutes: 3,
  },
  {
    id: 'ch-floor',
    text: {
      en: 'Lie flat on the floor for 3 minutes and listen to room sounds.',
      id: 'Berbaring rata di lantai selama 3 menit dan dengarkan suara ruangan.',
    },
    minutes: 3,
  },
  {
    id: 'ch-breath',
    text: {
      en: 'Take six slow physiological sighs before checking any message.',
      id: 'Ambil enam tarikan napas fisiologis sebelum mengecek pesan apa pun.',
    },
    minutes: 2,
  },
  {
    id: 'ch-doodle',
    text: {
      en: 'Draw three terrible spirals on scrap paper with a pen.',
      id: 'Gambar tiga spiral seadanya di kertas bekas pakai pulpen.',
    },
    minutes: 3,
  },
  {
    id: 'ch-walk',
    text: {
      en: 'Walk around your room or hallway for 3 minutes leaving your phone behind.',
      id: 'Jalan pelan keliling kamar atau teras selama 3 menit tanpa membawa ponsel.',
    },
    minutes: 3,
  },
  {
    id: 'ch-tea',
    text: {
      en: 'Brew tea or warm water and watch the steam without reaching for a feed.',
      id: 'Seduh teh atau air hangat lalu tunggu uapnya tanpa membuka feed.',
    },
    minutes: 4,
  },
  {
    id: 'ch-stretch',
    text: {
      en: 'Roll your neck and shoulders slowly for 2 minutes away from screens.',
      id: 'Putar leher dan bahu pelan-pelan selama 2 menit jauh dari layar.',
    },
    minutes: 2,
  },
  {
    id: 'ch-pocket',
    text: {
      en: 'Keep your phone upside down and untouched for the next 5 minutes.',
      id: 'Biarkan ponselmu telungkup dan tidak disentuh selama 5 menit ke depan.',
    },
    minutes: 5,
  },
];

export function getChallengeForToday(offset = 0): BoredomChallenge {
  const now = new Date();
  const daySeed =
    now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate() + offset;
  const idx =
    ((daySeed % DAILY_CHALLENGES.length) + DAILY_CHALLENGES.length) %
    DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}

export function getChallengeText(challenge: BoredomChallenge, locale: Locale): string {
  return challenge.text[locale];
}
