import { useEffect, useState } from 'preact/hooks';
import {
  BookOpen,
  Clock,
  Compass,
  Pause,
  Settings,
  Shield,
  SunMedium,
  Moon,
} from 'lucide-preact';
import {
  activeTab,
  consumeNativeGatekeeperData,
  cycleTheme,
  dict,
  initStore,
  oledOverride,
  ready,
  resolvedTheme,
  settings,
  toggleLocale,
  triggerSlowMenuRedirect,
  type NavTab,
} from './state/store';
import { cn } from './lib/cn';
import { onGatekeeperRoute } from './lib/gatekeeper';
import { HomeView } from './features/home/HomeView';
import { UrgeSurfDialog } from './features/urge/UrgeSurfDialog';
import { BoredomFastView } from './features/fast/BoredomFastView';
import { GatekeeperView } from './features/gatekeeper/GatekeeperView';
import { PlanView } from './features/plan/PlanView';
import { LedgerView } from './features/ledger/LedgerView';
import { SettingsDialog } from './features/settings/SettingsDialog';

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [urgeOpen, setUrgeOpen] = useState(false);

  useEffect(() => {
    void initStore();

    let removeRouteListener: (() => Promise<void>) | null = null;
    void onGatekeeperRoute((route) => {
      void consumeNativeGatekeeperData();
      if (route === 'slow_menu') {
        triggerSlowMenuRedirect();
      }
    }).then((fn) => {
      removeRouteListener = fn;
    });

    const onResume = () => {
      if (document.visibilityState === 'visible') {
        void consumeNativeGatekeeperData();
      }
    };
    document.addEventListener('visibilitychange', onResume);

    return () => {
      document.removeEventListener('visibilitychange', onResume);
      if (removeRouteListener) {
        void removeRouteListener();
      }
    };
  }, []);

  if (!ready.value) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
          Lobotomi
        </p>
      </main>
    );
  }

  const copy = dict.value;
  const tab = activeTab.value;
  const theme = resolvedTheme.value;

  const navItems: { id: NavTab; label: string; icon: typeof Pause }[] = [
    { id: 'pause', label: copy.nav.pause, icon: Pause },
    { id: 'fast', label: copy.nav.fast, icon: Clock },
    { id: 'guard', label: copy.nav.guard, icon: Shield },
    { id: 'plan', label: copy.nav.plan, icon: Compass },
    { id: 'ledger', label: copy.nav.ledger, icon: BookOpen },
  ];

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      {!oledOverride.value && (
        <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3.5">
          <div className="flex items-baseline gap-2.5">
            <span className="font-serif text-xl tracking-tight text-[var(--ink)]">
              {copy.appName}
            </span>
            <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-muted)] sm:inline">
              {settings.value.locale.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleLocale}
              aria-label="Toggle language"
              className="inline-flex h-8 items-center justify-center rounded-[3px] border border-[var(--border)] bg-[var(--surface)] px-2.5 font-mono text-[11px] tracking-[0.1em] text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              {settings.value.locale === 'en' ? 'EN / ID' : 'ID / EN'}
            </button>
            <button
              type="button"
              onClick={cycleTheme}
              aria-label={copy.header.toggleTheme}
              title={copy.settings.themes[settings.value.theme]}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              {theme === 'dark' ? (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <SunMedium className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label={copy.header.settings}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <Settings className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </header>
      )}

      <main className="flex flex-1 flex-col px-5 py-6">
        {tab === 'pause' && <HomeView onStartUrge={() => setUrgeOpen(true)} />}
        {tab === 'fast' && <BoredomFastView />}
        {tab === 'guard' && <GatekeeperView />}
        {tab === 'plan' && <PlanView />}
        {tab === 'ledger' && <LedgerView />}
      </main>

      {!oledOverride.value && (
        <nav
          aria-label="Primary"
          className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-[2px]"
        >
          <div className="mx-auto grid max-w-2xl grid-cols-5">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    activeTab.value = id;
                  }}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium tracking-wide cursor-pointer',
                    active ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]'
                  )}
                >
                  <Icon
                    className={cn('h-4 w-4', active && 'text-[var(--accent)]')}
                    strokeWidth={1.5}
                  />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <UrgeSurfDialog open={urgeOpen} onOpenChange={setUrgeOpen} />

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
