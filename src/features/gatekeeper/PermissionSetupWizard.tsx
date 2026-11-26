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
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent)]" strokeWidth={1.5} />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[var(--ink)]">{w.allSetTitle}</p>
              <p className="text-xs text-[var(--ink-muted)]">{w.allSetDesc}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-[var(--accent)] bg-[var(--bg)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[var(--accent)]">
            {copy.gatekeeper.activeBadge}
          </span>
        </div>

        {!status.batteryOptimizationIgnored && (
          <div className="paper-note flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-semibold text-[var(--ink)]">{w.batteryTitle}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">{w.batteryDesc}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void requestIgnoreBatteryOptimization()}
            >
              <span>{w.batteryBtn}</span>
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </div>
    );
  }

  const currentStep = !status.accessibilityEnabled ? 2 : 3;

  return (
    <div className="paper-card p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[var(--border)] pb-3">
        <div className="space-y-0.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
            {w.badge}
          </span>
          <h2 className="font-serif text-xl text-[var(--ink)]">
            {copy.gatekeeper.permissionsTitle}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
          {[1, 2, 3].map((step) => {
            const done =
              (step === 1 && status.accessibilityEnabled) ||
              (step === 2 && status.accessibilityEnabled) ||
              (step === 3 && status.overlayEnabled);
            const active =
              (step === 1 && !status.accessibilityEnabled && needsRestrictedStep) ||
              step === currentStep;
            return (
              <span
                key={step}
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] text-[11px]',
                  done
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)]'
                    : active
                      ? 'border-[var(--honey)] bg-[var(--bg)] text-[var(--ink)] font-bold'
                      : 'border-[var(--border)] bg-[var(--bg)] text-[var(--ink-muted)]'
                )}
              >
                {step}
              </span>
            );
          })}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--ink-muted)]">
        {copy.gatekeeper.permissionsPrivacy}
      </p>

      <div className="space-y-3">
        {needsRestrictedStep && (
          <div className="paper-note p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[var(--ink)]">{w.step1Title}</p>
              <span className="font-mono text-[10px] text-[var(--honey)]">API {status.androidSdkVersion || '33+'}</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{w.step1Desc}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void openAppDetailsSettings()}
            >
              <span>{w.step1Btn}</span>
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            </Button>
          </div>
        )}

        <div
          className={cn(
            'rounded-[10px] border-[1.5px] bg-[var(--bg)] p-3.5 space-y-2.5',
            status.accessibilityEnabled ? 'border-[var(--accent)]' : 'border-[var(--border)]'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-[var(--ink)]">{w.step2Title}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase',
                status.accessibilityEnabled ? 'text-[var(--accent)]' : 'text-[var(--warn)]'
              )}
            >
              {status.accessibilityEnabled ? (
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Circle className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              {status.accessibilityEnabled
                ? copy.gatekeeper.activeBadge
                : copy.gatekeeper.requiredBadge}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{w.step2Desc}</p>
          <Button
            variant={status.accessibilityEnabled ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => void openAccessibilitySettings()}
          >
            <span>{w.step2Btn}</span>
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          </Button>
        </div>

        <div
          className={cn(
            'rounded-[10px] border-[1.5px] bg-[var(--bg)] p-3.5 space-y-2.5',
            status.overlayEnabled ? 'border-[var(--accent)]' : 'border-[var(--border)]'
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold text-[var(--ink)]">{w.step3Title}</p>
            <span
              className={cn(
                'inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase',
                status.overlayEnabled ? 'text-[var(--accent)]' : 'text-[var(--warn)]'
              )}
            >
              {status.overlayEnabled ? (
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Circle className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              {status.overlayEnabled
                ? copy.gatekeeper.activeBadge
                : copy.gatekeeper.requiredBadge}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{w.step3Desc}</p>
          <Button
            variant={status.overlayEnabled ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => void openOverlaySettings()}
          >
            <span>{w.step3Btn}</span>
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          </Button>
        </div>

        <div className="paper-note flex flex-wrap items-center justify-between gap-3 p-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-xs font-semibold text-[var(--ink)]">{w.batteryTitle}</p>
            <p className="text-[11px] text-[var(--ink-muted)]">{w.batteryDesc}</p>
          </div>
          {status.batteryOptimizationIgnored ? (
            <span className="font-mono text-[10px] font-bold uppercase text-[var(--accent)]">
              {w.batteryReady}
            </span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void requestIgnoreBatteryOptimization()}
            >
              <span>{w.batteryBtn}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
