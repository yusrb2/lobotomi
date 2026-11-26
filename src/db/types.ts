export type Locale = 'en' | 'id';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AmbientNoise = 'off' | 'brown' | 'pink';

export type UrgeTrigger =
  | 'boredom'
  | 'mental_fatigue'
  | 'task_avoidance'
  | 'restlessness'
  | 'muscle_memory';

export type SessionType = 'urge' | 'fast';

export interface SessionRecord {
  id: string;
  type: SessionType;
  startedAt: number;
  endedAt: number;
  plannedSeconds: number;
  actualSeconds: number;
  completed: boolean;
  trigger?: UrgeTrigger;
  clarityBefore?: number;
  clarityAfter?: number;
}

export interface IfThenRule {
  id: string;
  trigger: string;
  action: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export type MenuDuration = 'short' | 'medium' | 'long';
export type MenuEnergy = 'low' | 'normal' | 'high';

export interface LowDopamineItem {
  id: string;
  title: string;
  duration: MenuDuration;
  energy: MenuEnergy;
  note?: string;
  createdAt: number;
}

export type LedgerPolarity = 'slow' | 'fast';

export interface LedgerEntry {
  id: string;
  polarity: LedgerPolarity;
  label: string;
  minutes: number;
  note?: string;
  createdAt: number;
}

export interface BrainDumpEntry {
  id: string;
  content: string;
  createdAt: number;
}

export interface AppSettings {
  locale: Locale;
  theme: ThemeMode;
  hapticsEnabled: boolean;
  defaultNoise: AmbientNoise;
  noiseVolume: number;
  chimeEnabled: boolean;
}

export interface ExportPayload {
  app: 'lobotomi';
  version: 1;
  exportedAt: number;
  settings: AppSettings;
  sessions: SessionRecord[];
  rules: IfThenRule[];
  menuItems: LowDopamineItem[];
  ledger: LedgerEntry[];
  dumps: BrainDumpEntry[];
}
