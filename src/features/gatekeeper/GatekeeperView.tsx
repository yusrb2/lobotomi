import { useEffect, useMemo, useState } from 'preact/hooks';
import { Play, RefreshCw, Search } from 'lucide-preact';
import { LoboMascot } from '../../components/LoboMascot';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import type { GatekeeperAudioMode, GuardedAppConfig } from '../../db/types';
import { cn } from '../../lib/cn';
import {
  getDetailedPermissionStatus,
  getInstalledApps,
  isAndroidNative,
  onAppResume,
  type DetailedPermissionStatus,
  type InstalledAppInfo,
} from '../../lib/gatekeeper';
import { dict, gatekeeperConfig, updateGatekeeperConfig } from '../../state/store';
import { PermissionSetupWizard } from './PermissionSetupWizard';
import { WebGatekeeperPractice } from './WebGatekeeperPractice';

const WEB_PRESETS = ['YouTube', 'Instagram', 'TikTok', 'X', 'Reddit'] as const;

export function GatekeeperView() {
  const copy = dict.value;
  const cfg = gatekeeperConfig.value;
  const nativeAndroid = isAndroidNative();

  const [perms, setPerms] = useState<DetailedPermissionStatus>({
    accessibilityEnabled: false,
    overlayEnabled: false,
    batteryOptimizationIgnored: false,
    androidSdkVersion: 34,
  });
  const [apps, setApps] = useState<InstalledAppInfo[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [search, setSearch] = useState('');

  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceTarget, setPracticeTarget] = useState('YouTube');

  const refreshPermissions = async () => {
    if (!nativeAndroid) return;
    const status = await getDetailedPermissionStatus();
    setPerms(status);
  };

  useEffect(() => {
    if (!nativeAndroid) return;

    void refreshPermissions();
    setLoadingApps(true);
    void getInstalledApps()
      .then((list) => setApps(list))
      .finally(() => setLoadingApps(false));

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshPermissions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    let removeResume: (() => Promise<void>) | null = null;
    void onAppResume(() => {
      void refreshPermissions();
    }).then((fn) => {
      removeResume = fn;
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      if (removeResume) void removeResume();
    };
  }, [nativeAndroid]);

  const guardedMap = useMemo(() => {
    const map = new Map<string, GuardedAppConfig>();
    for (const item of cfg.apps) {
      map.set(item.packageName, item);
    }
    return map;
  }, [cfg.apps]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? apps.filter(
          (a) =>
            a.appName.toLowerCase().includes(q) ||
            a.packageName.toLowerCase().includes(q)
        )
      : apps;

    return [...list].sort((a, b) => {
      const aGuarded = guardedMap.has(a.packageName) ? 0 : 1;
      const bGuarded = guardedMap.has(b.packageName) ? 0 : 1;
      if (aGuarded !== bGuarded) return aGuarded - bGuarded;
      return a.appName.localeCompare(b.appName);
    });
  }, [apps, search, guardedMap]);

  const toggleAppGuard = (app: InstalledAppInfo, enabled: boolean) => {
    const nextApps = enabled
      ? [
          ...cfg.apps.filter((a) => a.packageName !== app.packageName),
          {
            packageName: app.packageName,
            appName: app.appName,
            delaySeconds: cfg.defaultDelaySeconds,
            graceMinutes: cfg.defaultGraceMinutes,
          },
        ]
      : cfg.apps.filter((a) => a.packageName !== app.packageName);

    void updateGatekeeperConfig({ apps: nextApps });
  };

  const updateAppEntry = (
    packageName: string,
    patch: Partial<Pick<GuardedAppConfig, 'delaySeconds' | 'graceMinutes'>>
  ) => {
    const nextApps = cfg.apps.map((a) =>
      a.packageName === packageName ? { ...a, ...patch } : a
    );
    void updateGatekeeperConfig({ apps: nextApps });
  };

  return (
    <section className="space-y-6 py-2">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <h1 className="font-serif text-3xl tracking-tight text-[var(--ink)]">
            {copy.gatekeeper.title}
          </h1>
          <p className="text-sm text-[var(--ink-muted)]">{copy.gatekeeper.subtitle}</p>
        </div>
        <LoboMascot mood="gatekeeper" size="sm" className="shrink-0" />
      </div>

      {nativeAndroid ? (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void refreshPermissions()}
              className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" strokeWidth={1.75} />
              <span>{copy.gatekeeper.refreshStatus}</span>
            </button>
          </div>
          <PermissionSetupWizard status={perms} />
          <Button
            variant="secondary"
            onClick={() => {
              setPracticeTarget(cfg.apps[0]?.appName || 'Instagram');
              setPracticeOpen(true);
            }}
            className="w-full"
          >
            <Play className="h-4 w-4" strokeWidth={1.75} />
            <span>{copy.gatekeeper.previewScreen}</span>
          </Button>
        </div>
      ) : (
        <div className="paper-card space-y-4 p-4 sm:p-5">
          <div className="space-y-1">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
              {copy.gatekeeper.webModeTitle}
            </p>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
              {copy.gatekeeper.webModeNote}
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="gk-web-target"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-muted)]"
            >
              {copy.gatekeeper.webTargetLabel}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WEB_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPracticeTarget(preset)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 font-mono text-[11px] cursor-pointer',
                    practiceTarget === preset
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)]'
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              id="gk-web-target"
              type="text"
              value={practiceTarget}
              onInput={(e) => setPracticeTarget((e.target as HTMLInputElement).value)}
              className="h-10 w-full rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--ink)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setPracticeOpen(true)}
            disabled={!practiceTarget.trim()}
            className="w-full"
          >
            <Play className="h-4 w-4" strokeWidth={1.75} />
            <span>{copy.gatekeeper.launchPractice}</span>
          </Button>
        </div>
      )}

      <div className="paper-card space-y-4 p-4 sm:p-5">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {copy.gatekeeper.defaultsTitle}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {copy.gatekeeper.delayLabel}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([180, 300] as const).map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => void updateGatekeeperConfig({ defaultDelaySeconds: sec })}
                  className={cn(
                    'min-h-10 h-auto rounded-full border px-2 py-2 font-mono text-xs text-center leading-tight whitespace-normal tabular-nums cursor-pointer',
                    cfg.defaultDelaySeconds === sec
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink)]'
                  )}
                >
                  {sec / 60} {copy.urge.min}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
              {copy.gatekeeper.graceLabel}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {([5, 15, 30] as const).map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => void updateGatekeeperConfig({ defaultGraceMinutes: min })}
                  className={cn(
                    'min-h-10 h-auto rounded-full border px-2 py-2 font-mono text-xs text-center leading-tight whitespace-normal tabular-nums cursor-pointer',
                    cfg.defaultGraceMinutes === min
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink)]'
                  )}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-muted)]">
            {copy.gatekeeper.soundLabel}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['brown', copy.gatekeeper.soundBrown],
                ['drone', copy.gatekeeper.soundDrone],
                ['silent', copy.gatekeeper.soundSilent],
              ] as [GatekeeperAudioMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => void updateGatekeeperConfig({ ambientSound: mode })}
                className={cn(
                  'min-h-10 h-auto rounded-full border px-2 py-2 font-mono text-xs text-center leading-tight whitespace-normal cursor-pointer',
                  cfg.ambientSound === mode
                    ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                    : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {nativeAndroid && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <h2 className="font-serif text-2xl tracking-tight text-[var(--ink)]">
                {copy.gatekeeper.appsTitle}
              </h2>
              <p className="text-xs text-[var(--ink-muted)]">{copy.gatekeeper.appsSubtitle}</p>
            </div>
            <span className="shrink-0 font-mono text-xs font-bold text-[var(--accent-strong)] tabular-nums">
              {cfg.apps.length} {copy.gatekeeper.guardedCount}
            </span>
          </div>

          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]"
              strokeWidth={1.75}
            />
            <input
              type="search"
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              placeholder={copy.gatekeeper.searchPlaceholder}
              className="h-10 w-full rounded-full border border-[var(--border)] bg-[var(--surface)] pl-9 pr-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {loadingApps ? (
            <div className="paper-card p-6 text-center font-mono text-xs text-[var(--ink-muted)]">
              {copy.gatekeeper.loadingApps}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="paper-card p-6 text-center text-xs text-[var(--ink-muted)]">
              {copy.gatekeeper.emptyApps}
            </div>
          ) : (
            <ul className="paper-card divide-y divide-[var(--border)]">
              {filteredApps.map((app) => {
                const guarded = guardedMap.get(app.packageName);
                const enabled = Boolean(guarded);
                return (
                  <li key={app.packageName} className="space-y-2.5 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {app.icon ? (
                          <img
                            src={app.icon}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full border border-[var(--border)] grayscale opacity-85"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-2)]" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">
                            {app.appName}
                          </p>
                          <p className="truncate font-mono text-[10px] text-[var(--ink-muted)]">
                            {app.packageName}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(v) => toggleAppGuard(app, v)}
                        ariaLabel={app.appName}
                      />
                    </div>

                    {guarded && (
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
                        <div className="flex items-center gap-1.5">
                          {([180, 300] as const).map((sec) => (
                            <button
                              key={sec}
                              type="button"
                              onClick={() =>
                                updateAppEntry(app.packageName, { delaySeconds: sec })
                              }
                              className={cn(
                                'rounded-full border px-2 py-0.5 font-mono text-[10px] tabular-nums cursor-pointer',
                                guarded.delaySeconds === sec
                                  ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                                  : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)]'
                              )}
                            >
                              {sec / 60}m
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {([5, 15, 30] as const).map((min) => (
                            <button
                              key={min}
                              type="button"
                              onClick={() =>
                                updateAppEntry(app.packageName, { graceMinutes: min })
                              }
                              className={cn(
                                'rounded-full border px-2 py-0.5 font-mono text-[10px] tabular-nums cursor-pointer',
                                guarded.graceMinutes === min
                                  ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--bg)]'
                                  : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)]'
                              )}
                            >
                              +{min}m
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <WebGatekeeperPractice
        open={practiceOpen}
        targetAppName={practiceTarget.trim() || 'App'}
        targetPackageName={`practice.${practiceTarget.trim().toLowerCase().replace(/\s+/g, '-')}`}
        delaySeconds={cfg.defaultDelaySeconds}
        ambientSound={cfg.ambientSound}
        onClose={() => setPracticeOpen(false)}
      />
    </section>
  );
}
