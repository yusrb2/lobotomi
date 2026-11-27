import { CheckCircle2, Circle, ExternalLink, ShieldCheck } from 'lucide-preact';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import {
  openAccessibilitySettings,
  openAppDetailsSettings,
  openOverlaySettings,
  requestIgnoreBatteryOptimization,
  type DetailedPermissionStatus,
} from '../../lib/gatekeeper';
import { dict } from '../../state/store';

interface PermissionSetupWizardProps {
  status: DetailedPermissionStatus;
}

export function PermissionSetupWizard({ status }: PermissionSetupWizardProps) {
  const copy = dict.value;
  const w = copy.gatekeeper.wizard;
  const needsRestrictedStep = status.androidSdkVersion === 0 || status.androidSdkVersion >= 33;
  const allCoreReady = status.accessibilityEnabled && status.overlayEnabled;

  if (allCoreReady) {
    return (
      <div className="paper-card p-4 space-y-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-strong)]"
              strokeWidth={1.75}
            />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold leading-snug text-[var(--ink)]">{w.allSetTitle}</p>
              <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{w.allSetDesc}</p>
            </div>
          </div>
          <span className="badge-sage inline-flex self-start shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase">
            <CheckCircle2 className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span>{copy.gatekeeper.activeBadge}</span>
          </span>
        </div>

        {!status.batteryOptimizationIgnored && (
          <div className="paper-note flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-semibold leading-snug text-[var(--ink)]">
                {w.batteryTitle}
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
                {w.batteryDesc}
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto min-h-[44px] shrink-0"
              onClick={() => void requestIgnoreBatteryOptimization()}
            >
              <span>{w.batteryBtn}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const completedCount =
    (status.accessibilityEnabled ? 1 : 0) + (status.overlayEnabled ? 1 : 0);

  return (
    <div className="paper-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-2.5 border-b border-[var(--border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-0.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            {w.badge}
          </span>
          <h2 className="font-serif text-xl leading-snug text-[var(--ink)]">
            {copy.gatekeeper.permissionsTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span
            className={cn(
              'rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums',
              completedCount > 0 ? 'badge-sage' : 'badge-amber'
            )}
          >
            {completedCount}/2
          </span>
          <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            {[
              { num: 1, done: status.accessibilityEnabled, current: !status.accessibilityEnabled },
              {
                num: 2,
                done: status.overlayEnabled,
                current: status.accessibilityEnabled && !status.overlayEnabled,
              },
            ].map(({ num, done, current }) => (
              <span
                key={num}
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold',
                  done
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                    : current
                      ? 'border-[var(--honey)] bg-[var(--bg)] text-[var(--ink)]'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)]'
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} /> : num}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        {copy.gatekeeper.permissionsPrivacy}
      </p>

      <div className="space-y-3">
        {needsRestrictedStep && !status.accessibilityEnabled && (
          <div className="paper-note p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 flex-1 text-xs font-bold leading-snug text-[var(--ink)]">
                {w.step1Title}
              </p>
              <span className="badge-amber shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
                API {status.androidSdkVersion || '33+'}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{w.step1Desc}</p>
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto min-h-[44px]"
              onClick={() => void openAppDetailsSettings()}
            >
              <span>{w.step1Btn}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            </Button>
          </div>
        )}

        <div
          className={cn(
            'rounded-2xl border-2 bg-[var(--bg)] p-4 space-y-3',
            status.accessibilityEnabled
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]/35'
              : 'border-[var(--border-card)]'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              {w.progressLabel} 1/2
            </span>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                status.accessibilityEnabled ? 'badge-sage' : 'badge-terracotta'
              )}
            >
              {status.accessibilityEnabled ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              )}
              <span>
                {status.accessibilityEnabled
                  ? copy.gatekeeper.activeBadge
                  : copy.gatekeeper.requiredBadge}
              </span>
            </span>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold leading-snug text-[var(--ink)]">{w.step2Title}</p>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{w.step2Desc}</p>
          </div>

          <Button
            variant={status.accessibilityEnabled ? 'secondary' : 'primary'}
            size="md"
            className="w-full sm:w-auto min-h-[44px]"
            onClick={() => void openAccessibilitySettings()}
          >
            <span>{w.step2Btn}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          </Button>
        </div>

        <div
          className={cn(
            'rounded-2xl border-2 bg-[var(--bg)] p-4 space-y-3',
            status.overlayEnabled
              ? 'border-[var(--accent)] bg-[var(--accent-soft)]/35'
              : 'border-[var(--border-card)]'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              {w.progressLabel} 2/2
            </span>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                status.overlayEnabled ? 'badge-sage' : 'badge-terracotta'
              )}
            >
              {status.overlayEnabled ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              )}
              <span>
                {status.overlayEnabled
                  ? copy.gatekeeper.activeBadge
                  : copy.gatekeeper.requiredBadge}
              </span>
            </span>
          </div>

          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold leading-snug text-[var(--ink)]">{w.step3Title}</p>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{w.step3Desc}</p>
          </div>

          <Button
            variant={status.overlayEnabled ? 'secondary' : 'primary'}
            size="md"
            className="w-full sm:w-auto min-h-[44px]"
            onClick={() => void openOverlaySettings()}
          >
            <span>{w.step3Btn}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          </Button>
        </div>

        <div className="paper-note flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-semibold leading-snug text-[var(--ink)]">
              {w.batteryTitle}
            </p>
            <p className="text-[11px] leading-relaxed text-[var(--ink-muted)]">
              {w.batteryDesc}
            </p>
          </div>
          {status.batteryOptimizationIgnored ? (
            <span className="badge-sage inline-flex self-start sm:self-center shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase">
              <CheckCircle2 className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span>{w.batteryReady}</span>
            </span>
          ) : (
            <Button
              variant="secondary"
              size="md"
              className="w-full sm:w-auto min-h-[44px] shrink-0"
              onClick={() => void requestIgnoreBatteryOptimization()}
            >
              <span>{w.batteryBtn}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
