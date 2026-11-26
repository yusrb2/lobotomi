import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import type { GatekeeperAudioMode, GuardedAppConfig, Locale } from '../db/types';

export interface InstalledAppInfo {
  packageName: string;
  appName: string;
  icon: string;
}

export interface GatekeeperPermissionStatus {
  accessibility: boolean;
  overlay: boolean;
}

export interface GatekeeperPendingEvent {
  id: string;
  packageName: string;
  appName: string;
  startedAt: number;
  endedAt: number;
  plannedSeconds: number;
  actualSeconds: number;
  outcome: 'diverted' | 'continued';
}

export interface GatekeeperPendingData {
  events: GatekeeperPendingEvent[];
  route: string;
}

interface GatekeeperNativePlugin {
  getInstalledApps(): Promise<{ apps: InstalledAppInfo[] }>;
  saveGuardedApps(options: {
    apps: GuardedAppConfig[];
    prompts: string[];
    locale: Locale;
    ambientSound: GatekeeperAudioMode;
    hapticsEnabled: boolean;
  }): Promise<void>;
  getPermissionStatus(): Promise<GatekeeperPermissionStatus>;
  openAccessibilitySettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  consumePendingData(): Promise<GatekeeperPendingData>;
  addListener(
    eventName: 'gatekeeperRoute',
    listenerFunc: (data: { route: string }) => void
  ): Promise<PluginListenerHandle>;
}

const Gatekeeper = registerPlugin<GatekeeperNativePlugin>('Gatekeeper');

export function isAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function getInstalledApps(): Promise<InstalledAppInfo[]> {
  if (!isAndroidNative()) return [];
  const res = await Gatekeeper.getInstalledApps();
  return Array.isArray(res?.apps) ? res.apps : [];
}

export async function getPermissionStatus(): Promise<GatekeeperPermissionStatus> {
  if (!isAndroidNative()) {
    return { accessibility: false, overlay: false };
  }
  return Gatekeeper.getPermissionStatus();
}

export async function saveGuardedAppsToNative(payload: {
  apps: GuardedAppConfig[];
  prompts: string[];
  locale: Locale;
  ambientSound: GatekeeperAudioMode;
  hapticsEnabled: boolean;
}): Promise<void> {
  if (!isAndroidNative()) return;
  await Gatekeeper.saveGuardedApps(payload);
}

export async function openAccessibilitySettings(): Promise<void> {
  if (!isAndroidNative()) return;
  await Gatekeeper.openAccessibilitySettings();
}

export async function openOverlaySettings(): Promise<void> {
  if (!isAndroidNative()) return;
  await Gatekeeper.openOverlaySettings();
}

export async function consumePendingData(): Promise<GatekeeperPendingData> {
  if (!isAndroidNative()) {
    return { events: [], route: '' };
  }
  return Gatekeeper.consumePendingData();
}

export async function onGatekeeperRoute(
  callback: (route: string) => void
): Promise<(() => Promise<void>) | null> {
  if (!isAndroidNative()) return null;
  const handle = await Gatekeeper.addListener('gatekeeperRoute', (data) => {
    if (data?.route) callback(data.route);
  });
  return () => handle.remove();
}
