import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AppSettings,
  BrainDumpEntry,
  ExportPayload,
  GatekeeperConfig,
  IfThenRule,
  LedgerEntry,
  LowDopamineItem,
  SessionRecord,
} from './types';
import { DEFAULT_GATEKEEPER_CONFIG, DEFAULT_SETTINGS, SEED_MENU_ITEMS, SEED_RULES } from './seeds';

interface LobotomiDB extends DBSchema {
  sessions: {
    key: string;
    value: SessionRecord;
    indexes: { 'by-startedAt': number };
  };
  rules: {
    key: string;
    value: IfThenRule;
  };
  menuItems: {
    key: string;
    value: LowDopamineItem;
  };
  ledger: {
    key: string;
    value: LedgerEntry;
    indexes: { 'by-createdAt': number };
  };
  dumps: {
    key: string;
    value: BrainDumpEntry;
    indexes: { 'by-createdAt': number };
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'lobotomi-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<LobotomiDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<LobotomiDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LobotomiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
          sessions.createIndex('by-startedAt', 'startedAt');
        }
        if (!db.objectStoreNames.contains('rules')) {
          db.createObjectStore('rules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('menuItems')) {
          db.createObjectStore('menuItems', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('ledger')) {
          const ledger = db.createObjectStore('ledger', { keyPath: 'id' });
          ledger.createIndex('by-createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('dumps')) {
          const dumps = db.createObjectStore('dumps', { keyPath: 'id' });
          dumps.createIndex('by-createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

export async function seedIfNeeded(): Promise<void> {
  const db = await getDB();
  const seeded = await db.get('meta', 'seeded');
  if (seeded) return;

  const tx = db.transaction(['rules', 'menuItems', 'meta'], 'readwrite');
  for (const rule of SEED_RULES) {
    await tx.objectStore('rules').put(rule);
  }
  for (const item of SEED_MENU_ITEMS) {
    await tx.objectStore('menuItems').put(item);
  }
  await tx.objectStore('meta').put(DEFAULT_SETTINGS, 'settings');
  await tx.objectStore('meta').put(DEFAULT_GATEKEEPER_CONFIG, 'gatekeeper');
  await tx.objectStore('meta').put(true, 'seeded');
  await tx.done;
}

export async function loadAllData(): Promise<{
  settings: AppSettings;
  gatekeeper: GatekeeperConfig;
  onboardingCompleted: boolean;
  challengesCompleted: number;
  sessions: SessionRecord[];
  rules: IfThenRule[];
  menuItems: LowDopamineItem[];
  ledger: LedgerEntry[];
  dumps: BrainDumpEntry[];
}> {
  await seedIfNeeded();
  const db = await getDB();
  const [
    rawSettings,
    rawGatekeeper,
    rawOnboarding,
    rawChallenges,
    sessions,
    rules,
    menuItems,
    ledger,
    dumps,
  ] = await Promise.all([
    db.get('meta', 'settings') as Promise<Partial<AppSettings> | undefined>,
    db.get('meta', 'gatekeeper') as Promise<Partial<GatekeeperConfig> | undefined>,
    db.get('meta', 'lobotomi_onboarding_completed') as Promise<boolean | undefined>,
    db.get('meta', 'lobotomi_challenges_completed') as Promise<number | undefined>,
    db.getAllFromIndex('sessions', 'by-startedAt'),
    db.getAll('rules'),
    db.getAll('menuItems'),
    db.getAllFromIndex('ledger', 'by-createdAt'),
    db.getAllFromIndex('dumps', 'by-createdAt'),
  ]);

  let lsOnboarding = false;
  try {
    lsOnboarding =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('lobotomi_onboarding_completed') === 'true';
  } catch {
    lsOnboarding = false;
  }

  return {
    settings: { ...DEFAULT_SETTINGS, ...(rawSettings ?? {}) },
    gatekeeper: {
      ...DEFAULT_GATEKEEPER_CONFIG,
      ...(rawGatekeeper ?? {}),
      apps: Array.isArray(rawGatekeeper?.apps) ? rawGatekeeper.apps : [],
    },
    onboardingCompleted: Boolean(rawOnboarding) || lsOnboarding,
    challengesCompleted: typeof rawChallenges === 'number' ? rawChallenges : 0,
    sessions: sessions.sort((a, b) => b.startedAt - a.startedAt),
    rules: rules.sort((a, b) => b.createdAt - a.createdAt),
    menuItems: menuItems.sort((a, b) => a.createdAt - b.createdAt),
    ledger: ledger.sort((a, b) => b.createdAt - a.createdAt),
    dumps: dumps.sort((a, b) => b.createdAt - a.createdAt),
  };
}

export async function saveSettingsDB(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('meta', settings, 'settings');
}

export async function saveGatekeeperDB(gatekeeper: GatekeeperConfig): Promise<void> {
  const db = await getDB();
  await db.put('meta', gatekeeper, 'gatekeeper');
}

export async function saveOnboardingCompletedDB(): Promise<void> {
  const db = await getDB();
  await db.put('meta', true, 'lobotomi_onboarding_completed');
}

export async function saveChallengesCompletedDB(count: number): Promise<void> {
  const db = await getDB();
  await db.put('meta', count, 'lobotomi_challenges_completed');
}

export async function putSessionDB(session: SessionRecord): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function deleteSessionDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function putRuleDB(rule: IfThenRule): Promise<void> {
  const db = await getDB();
  await db.put('rules', rule);
}

export async function deleteRuleDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('rules', id);
}

export async function putMenuItemDB(item: LowDopamineItem): Promise<void> {
  const db = await getDB();
  await db.put('menuItems', item);
}

export async function deleteMenuItemDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('menuItems', id);
}

export async function putLedgerEntryDB(entry: LedgerEntry): Promise<void> {
  const db = await getDB();
  await db.put('ledger', entry);
}

export async function deleteLedgerEntryDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('ledger', id);
}

export async function putDumpDB(dump: BrainDumpEntry): Promise<void> {
  const db = await getDB();
  await db.put('dumps', dump);
}

export async function deleteDumpDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('dumps', id);
}

export async function replaceAllDataDB(payload: ExportPayload): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['sessions', 'rules', 'menuItems', 'ledger', 'dumps', 'meta'],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('rules').clear(),
    tx.objectStore('menuItems').clear(),
    tx.objectStore('ledger').clear(),
    tx.objectStore('dumps').clear(),
  ]);
  for (const s of payload.sessions) await tx.objectStore('sessions').put(s);
  for (const r of payload.rules) await tx.objectStore('rules').put(r);
  for (const m of payload.menuItems) await tx.objectStore('menuItems').put(m);
  for (const l of payload.ledger) await tx.objectStore('ledger').put(l);
  for (const d of payload.dumps) await tx.objectStore('dumps').put(d);
  await tx.objectStore('meta').put({ ...DEFAULT_SETTINGS, ...payload.settings }, 'settings');
  await tx.objectStore('meta').put(
    payload.gatekeeper
      ? { ...DEFAULT_GATEKEEPER_CONFIG, ...payload.gatekeeper }
      : DEFAULT_GATEKEEPER_CONFIG,
    'gatekeeper'
  );
  await tx.objectStore('meta').put(true, 'seeded');
  await tx.done;
}

export async function resetAllDataDB(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['sessions', 'rules', 'menuItems', 'ledger', 'dumps', 'meta'],
    'readwrite'
  );
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('rules').clear(),
    tx.objectStore('menuItems').clear(),
    tx.objectStore('ledger').clear(),
    tx.objectStore('dumps').clear(),
    tx.objectStore('meta').clear(),
  ]);
  await tx.done;
  await seedIfNeeded();
}
