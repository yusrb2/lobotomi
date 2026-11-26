import type { AmbientNoise } from '../db/types';

export type EngineAudioMode = AmbientNoise | 'drone';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private droneNodes: AudioNode[] = [];
  private gain: GainNode | null = null;
  private currentType: EngineAudioMode = 'off';

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) {
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private buildNoiseBuffer(ctx: AudioContext, type: 'brown' | 'pink'): AudioBuffer {
    const seconds = 4;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'brown') {
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 2.8;
      }
    } else {
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }

    const fade = 512;
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      const startSample = output[i];
      const endSample = output[length - fade + i];
      output[i] = startSample * t + endSample * (1 - t);
    }

    return buffer;
  }

  startNoise(type: EngineAudioMode, volume: number): void {
    if (type === 'off') {
      this.stopNoise();
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx) return;

    if (this.currentType === type && this.gain && (this.source || this.droneNodes.length > 0)) {
      this.setVolume(volume);
      return;
    }

    this.stopImmediate();

    const gain = ctx.createGain();
    const targetGain = Math.max(0, Math.min(1, volume)) * (type === 'drone' ? 0.28 : 0.45);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.3);
    gain.connect(ctx.destination);

    if (type === 'drone') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380;
      filter.connect(gain);

      const partials = [
        { freq: 110, amp: 0.5 },
        { freq: 164.81, amp: 0.25 },
        { freq: 220.4, amp: 0.16 },
      ];
      const nodes: AudioNode[] = [filter];

      for (const p of partials) {
        const osc = ctx.createOscillator();
        const subGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = p.freq;
        subGain.gain.value = p.amp;
        osc.connect(subGain);
        subGain.connect(filter);
        osc.start();
        nodes.push(osc, subGain);
      }

      this.filter = filter;
      this.droneNodes = nodes;
      this.gain = gain;
      this.currentType = 'drone';
      return;
    }

    const buffer = this.buildNoiseBuffer(ctx, type);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = type === 'brown' ? 320 : 1400;
    filter.Q.value = 0.7;

    source.connect(filter);
    filter.connect(gain);
    source.start();

    this.source = source;
    this.filter = filter;
    this.gain = gain;
    this.currentType = type;
  }

  setVolume(volume: number): void {
    if (!this.ctx || !this.gain) return;
    const scale = this.currentType === 'drone' ? 0.28 : 0.45;
    const target = Math.max(0, Math.min(1, volume)) * scale;
    this.gain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.gain.gain.setValueAtTime(this.gain.gain.value, this.ctx.currentTime);
    this.gain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.12);
  }

  stopNoise(): void {
    if (!this.ctx || !this.gain || (!this.source && this.droneNodes.length === 0)) {
      this.currentType = 'off';
      return;
    }
    const ctx = this.ctx;
    const source = this.source;
    const gain = this.gain;
    const filter = this.filter;
    const droneNodes = this.droneNodes;
    this.source = null;
    this.gain = null;
    this.filter = null;
    this.droneNodes = [];
    this.currentType = 'off';

    try {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.22);
      setTimeout(() => {
        try {
          source?.stop();
          source?.disconnect();
          for (const node of droneNodes) {
            if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
              (node as OscillatorNode).stop();
            }
            node.disconnect();
          }
          filter?.disconnect();
          gain.disconnect();
        } catch {
          // Already stopped.
        }
      }, 260);
    } catch {
      // Ignore audio shutdown race.
    }
  }

  private stopImmediate(): void {
    try {
      this.source?.stop();
      this.source?.disconnect();
      for (const node of this.droneNodes) {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      }
      this.filter?.disconnect();
      this.gain?.disconnect();
    } catch {
      // Ignore.
    }
    this.source = null;
    this.filter = null;
    this.droneNodes = [];
    this.gain = null;
    this.currentType = 'off';
  }

  playSingingBowl(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(0.28, now + 0.025);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 4.6);
    master.connect(ctx.destination);

    const partials = [
      { freq: 220, amp: 0.65, decay: 4.5 },
      { freq: 221.4, amp: 0.45, decay: 4.3 },
      { freq: 607, amp: 0.22, decay: 3.1 },
      { freq: 1188, amp: 0.09, decay: 1.9 },
    ];

    for (const p of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.freq, now);
      g.gain.setValueAtTime(p.amp, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      osc.connect(g);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 4.7);
    }

    setTimeout(() => {
      try {
        master.disconnect();
      } catch {
        // Ignore.
      }
    }, 4850);
  }
}

export const audioEngine = new AudioEngine();
