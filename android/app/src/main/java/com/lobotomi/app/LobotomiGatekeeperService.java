package com.lobotomi.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.view.accessibility.AccessibilityEvent;

public class LobotomiGatekeeperService extends AccessibilityService {
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return;
        }

        CharSequence pkgSeq = event.getPackageName();
        if (pkgSeq == null) return;
        String packageName = pkgSeq.toString();

        if (packageName.isEmpty() ||
            packageName.equals(getPackageName()) ||
            "com.android.systemui".equals(packageName) ||
            "android".equals(packageName)) {
            return;
        }

        GatekeeperStore.GuardedApp guarded = GatekeeperStore.getGuardedApp(this, packageName);
        if (guarded == null) return;
        if (GatekeeperStore.isWithinGracePeriod(this, packageName)) return;
        if (GatekeeperInterceptionActivity.isShowingFor(packageName)) return;
        if (GatekeeperStore.shouldDebounce(this, packageName)) return;

        Intent intent = new Intent(this, GatekeeperInterceptionActivity.class);
        intent.putExtra(GatekeeperInterceptionActivity.EXTRA_PACKAGE_NAME, guarded.packageName);
        intent.putExtra(GatekeeperInterceptionActivity.EXTRA_APP_NAME, guarded.appName);
        intent.putExtra(GatekeeperInterceptionActivity.EXTRA_DELAY_SECONDS, guarded.delaySeconds);
        intent.putExtra(GatekeeperInterceptionActivity.EXTRA_GRACE_MINUTES, guarded.graceMinutes);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
        );
        startActivity(intent);
    }

    @Override
    public void onInterrupt() {
        // Nothing to release.
    }
}
