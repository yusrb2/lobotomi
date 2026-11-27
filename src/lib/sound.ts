import { audioEngine } from './audio';
import { hapticComplete, hapticTap } from './native';
import { settings } from '../state/store';

let sharedCtx: AudioContext | null = null;

function getSoundContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx) {
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === 'suspended') {
    void sharedCtx.resume();
  }
  return sharedCtx;
}

export function playClick(): void {
  if (settings.value.soundClicksEnabled) {
    audioEngine.playWoodTap();
  }
  void hapticTap(settings.value.hapticsEnabled, 'light');
}

export function playSwitch(on: boolean): void {
  if (settings.value.soundClicksEnabled) {
    const ctx = getSoundContext();
    if (ctx) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(on ? 420 : 340, now);
      osc.frequency.exponentialRampToValueAtTime(on ? 680 : 210, now + 0.045);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.065, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  }
  void hapticTap(settings.value.hapticsEnabled, 'light');
}

export function playPoke(): void {
  if (settings.value.soundClicksEnabled) {
    const ctx = getSoundContext();
    if (ctx) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(290, now);
      osc.frequency.exponentialRampToValueAtTime(510, now + 0.075);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    }
  }
  void hapticTap(settings.value.hapticsEnabled, 'medium');
}

export function playRoll(): void {
  if (settings.value.soundClicksEnabled) {
    const ctx = getSoundContext();
    if (ctx) {
      const now = ctx.currentTime;
      [0, 0.055, 0.11].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360 + idx * 85, now + offset);
        osc.frequency.exponentialRampToValueAtTime(190, now + offset + 0.032);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.linearRampToValueAtTime(0.06, now + offset + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.045);
      });
    }
  }
  void hapticTap(settings.value.hapticsEnabled, 'light');
}

export function playStampUnlock(): void {
  if (settings.value.soundClicksEnabled) {
    const ctx = getSoundContext();
    if (ctx) {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5 -> E5 -> G5
      notes.forEach((freq, i) => {
        const start = now + i * 0.075;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.linearRampToValueAtTime(0.09, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    }
  }
  void hapticComplete(settings.value.hapticsEnabled);
}

export function playChime(): void {
  if (settings.value.chimeEnabled) {
    audioEngine.playSingingBowl();
  }
  void hapticComplete(settings.value.hapticsEnabled);
}
