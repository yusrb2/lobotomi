import { useRef, useState } from 'preact/hooks';
import { Download, FileText, Upload } from 'lucide-preact';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Switch } from '../../components/ui/Switch';
import type { AmbientNoise, Locale, ThemeMode } from '../../db/types';
import { cn } from '../../lib/cn';
import {
  exportJsonFile,
  exportMarkdownFile,
  validateExportPayload,
} from '../../lib/portability';
import {
  dict,
  importAllData,
  resetAllData,
  settings,
  updateSettings,
} from '../../state/store';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const copy = dict.value;
  const s = settings.value;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleImportFile = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = validateExportPayload(JSON.parse(text));
      if (!parsed) {
        setStatusMsg({ text: copy.settings.importError, error: true });
        return;
      }
      await importAllData(parsed);
      setStatusMsg({ text: copy.settings.importSuccess });
    } catch {
      setStatusMsg({ text: copy.settings.importError, error: true });
    }
  };

  const handleReset = async () => {
    await resetAllData();
    setConfirmReset(false);
    setStatusMsg({ text: copy.settings.clearedNotice });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setStatusMsg(null);
          setConfirmReset(false);
        }
        onOpenChange(next);
      }}
      title={copy.settings.title}
      description={copy.settings.subtitle}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.settings.language}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['en', 'id'] as Locale[]).map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => void updateSettings({ locale: loc })}
                className={cn(
                  'h-9 rounded-[3px] border font-mono text-xs uppercase cursor-pointer',
                  s.locale === loc
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                )}
              >
                {loc === 'en' ? 'English' : 'Bahasa Indonesia'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.settings.theme}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => void updateSettings({ theme: mode })}
                className={cn(
                  'h-9 rounded-[3px] border font-mono text-xs cursor-pointer',
                  s.theme === mode
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
                )}
              >
                {copy.settings.themes[mode]}
              </button>
            ))}
          </div>
        </div>

        <div className="paper-card divide-y divide-dashed divide-[var(--border)]">
          <div className="flex items-center justify-between gap-4 p-3.5">
            <div className="space-y-0.5">
              <label htmlFor="set-haptics" className="text-sm font-medium text-[var(--ink)]">
                {copy.settings.haptics}
              </label>
              <p className="text-xs text-[var(--ink-muted)]">{copy.settings.hapticsDesc}</p>
            </div>
            <Switch
              id="set-haptics"
              checked={s.hapticsEnabled}
              onCheckedChange={(v) => void updateSettings({ hapticsEnabled: v })}
              ariaLabel={copy.settings.haptics}
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3.5">
            <div className="space-y-0.5">
              <label htmlFor="set-clicks" className="text-sm font-medium text-[var(--ink)]">
                {copy.settings.soundClicks}
              </label>
              <p className="text-xs text-[var(--ink-muted)]">{copy.settings.soundClicksDesc}</p>
            </div>
            <Switch
              id="set-clicks"
              checked={s.soundClicksEnabled}
              onCheckedChange={(v) => void updateSettings({ soundClicksEnabled: v })}
              ariaLabel={copy.settings.soundClicks}
            />
          </div>

          <div className="flex items-center justify-between gap-4 p-3.5">
            <label htmlFor="set-chime" className="text-sm font-medium text-[var(--ink)]">
              {copy.settings.chime}
            </label>
            <Switch
              id="set-chime"
              checked={s.chimeEnabled}
              onCheckedChange={(v) => void updateSettings({ chimeEnabled: v })}
              ariaLabel={copy.settings.chime}
            />
          </div>

          <div className="space-y-2 p-3.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
              {copy.settings.defaultNoise}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['off', 'brown', 'pink'] as AmbientNoise[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => void updateSettings({ defaultNoise: mode })}
                  className={cn(
                    'h-8 rounded-[3px] border font-mono text-xs cursor-pointer',
                    s.defaultNoise === mode
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)]'
                  )}
                >
                  {mode === 'off'
                    ? copy.urge.noiseOff
                    : mode === 'brown'
                      ? copy.urge.noiseBrown
                      : copy.urge.noisePink}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.settings.portability}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="secondary" size="sm" onClick={exportJsonFile}>
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{copy.settings.exportJson}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{copy.settings.importJson}</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={exportMarkdownFile}>
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>{copy.settings.exportMd}</span>
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void handleImportFile(e)}
          />
          {statusMsg && (
            <p
              className={cn(
                'font-mono text-xs',
                statusMsg.error ? 'text-[var(--warn)]' : 'text-[var(--accent)]'
              )}
            >
              {statusMsg.text}
            </p>
          )}
        </div>

        <div className="space-y-2 border-t border-[var(--border)] pt-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-muted)]">
            {copy.settings.dangerZone}
          </p>
          {!confirmReset ? (
            <Button
              variant="warn"
              size="sm"
              onClick={() => setConfirmReset(true)}
              className="w-full"
            >
              {copy.settings.clearData}
            </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmReset(false)}
              >
                {copy.settings.cancelClear}
              </Button>
              <Button variant="warn" size="sm" onClick={() => void handleReset()}>
                {copy.settings.confirmClear}
              </Button>
            </div>
          )}
        </div>

        <p className="border-t border-[var(--border)] pt-3 font-mono text-[11px] text-[var(--ink-muted)]">
          {copy.settings.licenseNote}
        </p>
      </div>
    </Dialog>
  );
}
