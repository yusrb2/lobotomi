import type { GatekeeperConfig, IfThenRule, LowDopamineItem, AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  locale: 'en',
  theme: 'system',
  hapticsEnabled: true,
  defaultNoise: 'off',
  noiseVolume: 0.35,
  chimeEnabled: true,
};

export const DEFAULT_GATEKEEPER_CONFIG: GatekeeperConfig = {
  apps: [],
  defaultDelaySeconds: 180,
  defaultGraceMinutes: 15,
  ambientSound: 'brown',
};

const BASE_TIME = 1700000000000;

export const SEED_RULES: IfThenRule[] = [
  {
    id: 'seed-rule-1',
    trigger: 'I reach for my phone in bed after 21:00',
    action: 'I will start a 10-minute Boredom Fast and place the phone face down.',
    active: true,
    createdAt: BASE_TIME,
    updatedAt: BASE_TIME,
  },
  {
    id: 'seed-rule-2',
    trigger: 'I hit a difficult paragraph or bug and feel the urge to switch tabs',
    action: 'I will run a 3-minute Urge Surf before touching another window.',
    active: true,
    createdAt: BASE_TIME + 1,
    updatedAt: BASE_TIME + 1,
  },
  {
    id: 'seed-rule-3',
    trigger: 'I am waiting in a queue or on transit for more than two minutes',
    action: 'I will leave the screen locked and observe the room.',
    active: true,
    createdAt: BASE_TIME + 2,
    updatedAt: BASE_TIME + 2,
  },
  {
    id: 'seed-rule-4',
    trigger: 'I wake up and my hand moves toward notifications automatically',
    action: 'I will drink a full glass of water before unlocking any feed.',
    active: false,
    createdAt: BASE_TIME + 3,
    updatedAt: BASE_TIME + 3,
  },
];

export const SEED_MENU_ITEMS: LowDopamineItem[] = [
  {
    id: 'seed-menu-1',
    title: 'Drink water slowly without looking at a screen',
    duration: 'short',
    energy: 'low',
    createdAt: BASE_TIME + 10,
  },
  {
    id: 'seed-menu-2',
    title: 'Look out a window at the furthest visible point',
    duration: 'short',
    energy: 'low',
    createdAt: BASE_TIME + 11,
  },
  {
    id: 'seed-menu-3',
    title: 'Wash face with cold water and dry with a towel',
    duration: 'short',
    energy: 'normal',
    createdAt: BASE_TIME + 12,
  },
  {
    id: 'seed-menu-4',
    title: 'Do 15 slow squats or thoracic mobility stretches',
    duration: 'short',
    energy: 'high',
    createdAt: BASE_TIME + 13,
  },
  {
    id: 'seed-menu-5',
    title: 'Lie flat on the floor with eyes open for 15 minutes',
    duration: 'medium',
    energy: 'low',
    createdAt: BASE_TIME + 14,
  },
  {
    id: 'seed-menu-6',
    title: 'Read 10 pages of a paper book with a pencil',
    duration: 'medium',
    energy: 'normal',
    createdAt: BASE_TIME + 15,
  },
  {
    id: 'seed-menu-7',
    title: 'Clear and wipe down one physical surface',
    duration: 'medium',
    energy: 'normal',
    createdAt: BASE_TIME + 16,
  },
  {
    id: 'seed-menu-8',
    title: 'Walk around the block without earbuds or phone',
    duration: 'medium',
    energy: 'high',
    createdAt: BASE_TIME + 17,
  },
  {
    id: 'seed-menu-9',
    title: 'Sit in a park or porch and listen to ambient sound',
    duration: 'long',
    energy: 'low',
    createdAt: BASE_TIME + 18,
  },
  {
    id: 'seed-menu-10',
    title: 'Cook a meal from raw ingredients without background media',
    duration: 'long',
    energy: 'normal',
    createdAt: BASE_TIME + 19,
  },
  {
    id: 'seed-menu-11',
    title: 'Practice an instrument or sketch on paper',
    duration: 'long',
    energy: 'normal',
    createdAt: BASE_TIME + 20,
  },
  {
    id: 'seed-menu-12',
    title: 'Long walk or run leaving the phone at home',
    duration: 'long',
    energy: 'high',
    createdAt: BASE_TIME + 21,
  },
];
