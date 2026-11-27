import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { StatusBar, Style } from '@capacitor/status-bar';

let webWakeLock: WakeLockSentinel | null = null;

export async function hapticTap(enabled = true, style: 'light' | 'medium' = 'light'): Promise<void> {
  if (!enabled) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({
        style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light,
      });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(style === 'medium' ? 18 : 10);
    }
  } catch {
    // Ignore unsupported haptic environments.
  }
}

export async function hapticComplete(enabled = true): Promise<void> {
  if (!enabled) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([18, 80, 24]);
    }
  } catch {
    // Ignore unsupported haptic environments.
  }
}

export async function acquireKeepAwake(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await KeepAwake.keepAwake();
    } else if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      webWakeLock = await navigator.wakeLock.request('screen');
    }
  } catch {
    // Ignore if wake lock is rejected by OS/browser battery saver.
  }
}

export async function releaseKeepAwake(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await KeepAwake.allowSleep();
    }
    if (webWakeLock) {
      await webWakeLock.release();
      webWakeLock = null;
    }
  } catch {
    webWakeLock = null;
  }
}

export async function syncStatusBar(theme: 'light' | 'dark' | 'oled'): Promise<void> {
  const color = theme === 'oled' ? '#000000' : theme === 'dark' ? '#161514' : '#F6F2EA';
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }
  try {
    if (Capacitor.isNativePlatform()) {
      await StatusBar.setBackgroundColor({ color });
      await StatusBar.setStyle({
        style: theme === 'light' ? Style.Light : Style.Dark,
      });
    }
  } catch {
    // Ignore on platforms without status bar plugin support.
  }
}
