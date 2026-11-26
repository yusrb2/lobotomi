import type { ExportPayload } from '../db/types';
import { DEFAULT_SETTINGS } from '../db/seeds';
import { dumps, ledger, menuItems, rules, sessions, settings } from '../state/store';

function todaySlug(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function triggerDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildExportPayload(): ExportPayload {
  return {
    app: 'lobotomi',
    version: 1,
    exportedAt: Date.now(),
    settings: settings.value,
    sessions: sessions.value,
    rules: rules.value,
    menuItems: menuItems.value,
    ledger: ledger.value,
    dumps: dumps.value,
  };
}

export function validateExportPayload(raw: unknown): ExportPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (obj.app !== 'lobotomi' || obj.version !== 1) return null;
  if (
    !Array.isArray(obj.sessions) ||
    !Array.isArray(obj.rules) ||
    !Array.isArray(obj.menuItems) ||
    !Array.isArray(obj.ledger) ||
    !Array.isArray(obj.dumps)
  ) {
    return null;
  }

  const rawSettings =
    obj.settings && typeof obj.settings === 'object'
      ? (obj.settings as Record<string, unknown>)
      : {};

  return {
    app: 'lobotomi',
    version: 1,
    exportedAt: typeof obj.exportedAt === 'number' ? obj.exportedAt : Date.now(),
    settings: {
      locale: rawSettings.locale === 'id' ? 'id' : 'en',
      theme:
        rawSettings.theme === 'light' ||
        rawSettings.theme === 'dark' ||
        rawSettings.theme === 'system'
          ? rawSettings.theme
          : DEFAULT_SETTINGS.theme,
      hapticsEnabled:
        typeof rawSettings.hapticsEnabled === 'boolean'
          ? rawSettings.hapticsEnabled
          : DEFAULT_SETTINGS.hapticsEnabled,
      defaultNoise:
        rawSettings.defaultNoise === 'brown' ||
        rawSettings.defaultNoise === 'pink' ||
        rawSettings.defaultNoise === 'off'
          ? rawSettings.defaultNoise
          : DEFAULT_SETTINGS.defaultNoise,
      noiseVolume:
        typeof rawSettings.noiseVolume === 'number'
          ? Math.max(0.05, Math.min(1, rawSettings.noiseVolume))
          : DEFAULT_SETTINGS.noiseVolume,
      chimeEnabled:
        typeof rawSettings.chimeEnabled === 'boolean'
          ? rawSettings.chimeEnabled
          : DEFAULT_SETTINGS.chimeEnabled,
    },
    sessions: obj.sessions as ExportPayload['sessions'],
    rules: obj.rules as ExportPayload['rules'],
    menuItems: obj.menuItems as ExportPayload['menuItems'],
    ledger: obj.ledger as ExportPayload['ledger'],
    dumps: obj.dumps as ExportPayload['dumps'],
  };
}

export function exportJsonFile(): void {
  const payload = buildExportPayload();
  triggerDownload(
    `lobotomi-backup-${todaySlug()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json'
  );
}

export function buildMarkdownReport(): string {
  const totalQuietMin = Math.round(
    sessions.value.reduce((acc, s) => acc + s.actualSeconds, 0) / 60
  );
  const rated = sessions.value.filter(
    (s) => typeof s.clarityBefore === 'number' && typeof s.clarityAfter === 'number'
  );
  const meanBefore = rated.length
    ? (rated.reduce((sum, s) => sum + (s.clarityBefore ?? 0), 0) / rated.length).toFixed(1)
    : 'N/A';
  const meanAfter = rated.length
    ? (rated.reduce((sum, s) => sum + (s.clarityAfter ?? 0), 0) / rated.length).toFixed(1)
    : 'N/A';

  const lines: string[] = [
    `# Lobotomi — Local Record (${todaySlug()})`,
    '',
    '## Summary',
    `- Recorded stillness sessions: ${sessions.value.length}`,
    `- Total stillness duration: ${totalQuietMin} min`,
    `- Mean mental noise shift: ${meanBefore} -> ${meanAfter} (n = ${rated.length})`,
    `- Ledger entries: ${ledger.value.length}`,
    `- Archived brain dumps: ${dumps.value.length}`,
    '',
    '## Active Implementation Intentions',
  ];

  const activeRules = rules.value.filter((r) => r.active);
  if (activeRules.length === 0) {
    lines.push('- None');
  } else {
    for (const r of activeRules) {
      lines.push(`- **IF** ${r.trigger} **THEN** ${r.action}`);
    }
  }

  lines.push('', '## Recent Sessions');
  if (sessions.value.length === 0) {
    lines.push('- None');
  } else {
    for (const s of sessions.value.slice(0, 30)) {
      const date = new Date(s.startedAt).toISOString().slice(0, 16).replace('T', ' ');
      const mins = Math.max(1, Math.round(s.actualSeconds / 60));
      const triggerPart = s.trigger ? ` | trigger: ${s.trigger}` : '';
      const noisePart =
        typeof s.clarityBefore === 'number' && typeof s.clarityAfter === 'number'
          ? ` | noise: ${s.clarityBefore}->${s.clarityAfter}`
          : '';
      lines.push(`- [${date}] ${s.type.toUpperCase()} (${mins}m)${triggerPart}${noisePart}`);
    }
  }

  lines.push('', '## Stimulation Ledger');
  if (ledger.value.length === 0) {
    lines.push('- None');
  } else {
    for (const l of ledger.value.slice(0, 40)) {
      const date = new Date(l.createdAt).toISOString().slice(0, 16).replace('T', ' ');
      const notePart = l.note ? ` — ${l.note}` : '';
      lines.push(`- [${date}] ${l.polarity.toUpperCase()} · ${l.label} (${l.minutes}m)${notePart}`);
    }
  }

  lines.push('', '## Archived Brain Dumps');
  if (dumps.value.length === 0) {
    lines.push('- None');
  } else {
    for (const d of dumps.value) {
      const date = new Date(d.createdAt).toISOString().slice(0, 16).replace('T', ' ');
      lines.push(`- [${date}] ${d.content.replace(/\n+/g, ' ')}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

export function exportMarkdownFile(): void {
  triggerDownload(
    `lobotomi-journal-${todaySlug()}.md`,
    buildMarkdownReport(),
    'text/markdown;charset=utf-8'
  );
}
