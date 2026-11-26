import { computed, signal } from '@preact/signals';
import type {
  AppSettings,
  BrainDumpEntry,
  ExportPayload,
  IfThenRule,
  LedgerEntry,
  Locale,
  LowDopamineItem,
  SessionRecord,
  ThemeMode,
} from '../db/types';
import { DEFAULT_SETTINGS } from '../db/seeds';
import {
  deleteDumpDB,
  deleteLedgerEntryDB,
  deleteMenuItemDB,
  deleteRuleDB,
  deleteSessionDB,
  loadAllData,
  putDumpDB,
  putLedgerEntryDB,
  putMenuItemDB,
  putRuleDB,
  putSessionDB,
  replaceAllDataDB,
  resetAllDataDB,
  saveSettingsDB,
} from '../db/client';
import { getDict } from '../i18n';
import { syncStatusBar } from '../lib/native';

export type NavTab = 'pause' | 'fast' | 'plan' | 'ledger';

export const ready = signal(false);
export const activeTab = signal<NavTab>('pause');
export const settings = signal<AppSettings>(DEFAULT_SETTINGS);
export const sessions = signal<SessionRecord[]>([]);
export const rules = signal<IfThenRule[]>([]);
export const menuItems = signal<LowDopamineItem[]>([]);
export const ledger = signal<LedgerEntry[]>([]);
export const dumps = signal<BrainDumpEntry[]>([]);
export const oledOverride = signal(false);
export const systemPrefersDark = signal(
  typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
);

export const dict = computed(() => getDict(settings.value.locale));

export const resolvedTheme = computed<'light' | 'dark'>(() => {
  const mode = settings.value.theme;
  if (mode === 'dark') return 'dark';
  if (mode === 'light') return 'light';
  return systemPrefersDark.value ? 'dark' : 'light';
});

export const todayQuietMinutes = computed(() => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let seconds = 0;
  for (const s of sessions.value) {
    if (s.startedAt >= startOfDay) {
      seconds += s.actualSeconds;
    }
  }
  let slowMins = 0;
  for (const l of ledger.value) {
    if (l.polarity === 'slow' && l.createdAt >= startOfDay) {
      slowMins += l.minutes;
    }
  }
  return Math.round(seconds / 60) + slowMins;
});

function applyDocumentTheme(theme: 'light' | 'dark' | 'oled') {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme;
  }
  void syncStatusBar(theme);
}

export function setOledActive(active: boolean) {
  oledOverride.value = active;
  applyDocumentTheme(active ? 'oled' : resolvedTheme.value);
}

export async function initStore(): Promise<void> {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
      if (!oledOverride.value) {
        applyDocumentTheme(resolvedTheme.value);
      }
    });
  }

  const data = await loadAllData();
  settings.value = data.settings;
  sessions.value = data.sessions;
  rules.value = data.rules;
  menuItems.value = data.menuItems;
  ledger.value = data.ledger;
  dumps.value = data.dumps;

  try {
    localStorage.setItem('lobotomi-theme', data.settings.theme);
  } catch {
    // Ignore storage quota issues.
  }

  applyDocumentTheme(resolvedTheme.value);
  ready.value = true;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<void> {
  const next = { ...settings.value, ...patch };
  settings.value = next;
  if (patch.theme) {
    try {
      localStorage.setItem('lobotomi-theme', patch.theme);
    } catch {
      // Ignore storage quota issues.
    }
    if (!oledOverride.value) {
      applyDocumentTheme(resolvedTheme.value);
    }
  }
  await saveSettingsDB(next);
}

export function toggleLocale(): void {
  const next: Locale = settings.value.locale === 'en' ? 'id' : 'en';
  void updateSettings({ locale: next });
}

export function cycleTheme(): void {
  const order: ThemeMode[] = ['light', 'dark', 'system'];
  const currentIdx = order.indexOf(settings.value.theme);
  const next = order[(currentIdx + 1) % order.length];
  void updateSettings({ theme: next });
}

export async function addSession(session: SessionRecord): Promise<void> {
  await putSessionDB(session);
  sessions.value = [session, ...sessions.value.filter((s) => s.id !== session.id)].sort(
    (a, b) => b.startedAt - a.startedAt
  );
}

export async function removeSession(id: string): Promise<void> {
  await deleteSessionDB(id);
  sessions.value = sessions.value.filter((s) => s.id !== id);
}

export async function saveRule(rule: IfThenRule): Promise<void> {
  await putRuleDB(rule);
  rules.value = [rule, ...rules.value.filter((r) => r.id !== rule.id)].sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function removeRule(id: string): Promise<void> {
  await deleteRuleDB(id);
  rules.value = rules.value.filter((r) => r.id !== id);
}

export async function saveMenuItem(item: LowDopamineItem): Promise<void> {
  await putMenuItemDB(item);
  const exists = menuItems.value.some((m) => m.id === item.id);
  menuItems.value = exists
    ? menuItems.value.map((m) => (m.id === item.id ? item : m))
    : [...menuItems.value, item];
}

export async function removeMenuItem(id: string): Promise<void> {
  await deleteMenuItemDB(id);
  menuItems.value = menuItems.value.filter((m) => m.id !== id);
}

export async function saveLedgerEntry(entry: LedgerEntry): Promise<void> {
  await putLedgerEntryDB(entry);
  ledger.value = [entry, ...ledger.value.filter((l) => l.id !== entry.id)].sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function removeLedgerEntry(id: string): Promise<void> {
  await deleteLedgerEntryDB(id);
  ledger.value = ledger.value.filter((l) => l.id !== id);
}

export async function saveDump(dump: BrainDumpEntry): Promise<void> {
  await putDumpDB(dump);
  dumps.value = [dump, ...dumps.value.filter((d) => d.id !== dump.id)].sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export async function removeDump(id: string): Promise<void> {
  await deleteDumpDB(id);
  dumps.value = dumps.value.filter((d) => d.id !== id);
}

export async function importAllData(payload: ExportPayload): Promise<void> {
  await replaceAllDataDB(payload);
  await initStore();
}

export async function resetAllData(): Promise<void> {
  await resetAllDataDB();
  await initStore();
}

export function makeId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
