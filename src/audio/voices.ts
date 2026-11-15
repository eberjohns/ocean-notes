/**
 * src/audio/voices.ts
 * Synthesis voices (Pad, Lead, Pulse, Bass) and Polyphony Manager (16-voice cap).
 */

import type { VoiceNode } from './types.ts';

export class PolyphonyManager {
  private activeVoices: VoiceNode[] = [];
  private maxPolyphony: number = 16;
  private voiceCounter: number = 0;

  constructor(maxPolyphony: number = 16) {
    this.maxPolyphony = maxPolyphony;
  }

  public getActiveCount(): number {
    // Filter out ended voices
    const now = performance.now() / 1000;
    this.activeVoices = this.activeVoices.filter(v => v.endTime > now);
    return this.activeVoices.length;
  }

  public registerVoice(voiceNode: VoiceNode): void {
    // Clean up ended voices first
    const now = performance.now() / 1000;
    this.activeVoices = this.activeVoices.filter(v => v.endTime > now);

    // Enforce 16-voice polyphony limit via voice stealing
    while (this.activeVoices.length >= this.maxPolyphony) {
      // Steal oldest active voice
      const oldest = this.activeVoices.shift();
      if (oldest) {
        try {
          oldest.stop(0.02); // 20 ms quick de-click fade-out
        } catch {
          // Ignore if already disconnected
        }
      }
    }

    this.activeVoices.push(voiceNode);
  }

  public stopAll(fadeTime: number = 0.05): void {
    for (const v of this.activeVoices) {
      try {
        v.stop(fadeTime);
      } catch {
        // Ignore disconnect errors
      }
    }
    this.activeVoices = [];
  }

  public nextVoiceId(): number {
    return ++this.voiceCounter;
  }
}

/**
 * Creates and triggers the LEAD voice:
 * Soft sine carrier with subtle vibrato LFO and stereo panner.
 */
export function playLeadVoice(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  gain: number,
  pan: number,
  startTime: number,
  duration: number,
  polyphony: PolyphonyManager
): VoiceNode {
  const id = polyphony.nextVoiceId();

  // 1. Nodes
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  // Vibrato LFO (5 Hz, depth +/- 3 Hz)
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(5.0, startTime);

  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(3.0, startTime);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, startTime);

  // Envelope: 80ms attack, gentle decay, sustain, 120ms release
  const attack = 0.08;
  const release = Math.min(0.25, duration * 0.3);
  const sustainTime = Math.max(attack, duration - release);

  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), startTime + attack);
  gainNode.gain.setValueAtTime(Math.max(0.0001, gain * 0.8), startTime + sustainTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime);

  osc.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(destination);

  // Start & Stop
  osc.start(startTime);
  lfo.start(startTime);

  const stopTime = startTime + duration + 0.05;
  osc.stop(stopTime);
  lfo.stop(stopTime);

  const voice: VoiceNode = {
    voice: 'lead',
    id,
    startTime,
    endTime: stopTime,
    gainNode,
    pannerNode: panner,
    stop: (fade = 0.03) => {
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      setTimeout(() => {
        try {
          osc.stop();
          lfo.stop();
          osc.disconnect();
          lfo.disconnect();
          lfoGain.disconnect();
          gainNode.disconnect();
          panner.disconnect();
        } catch {
          // Ignore
        }
      }, fade * 1000 + 30);
    }
  };

  polyphony.registerVoice(voice);
  return voice;
}

/**
 * Creates and triggers the PAD voice:
 * Detuned sawtooth pair with smooth lowpass filter modulated by oceanic mean speed.
 */
export function playPadVoice(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  gain: number,
  meanSpeed: number,
  startTime: number,
  duration: number,
  polyphony: PolyphonyManager
): VoiceNode {
  const id = polyphony.nextVoiceId();

  // Detuned saw pair
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(frequency, startTime);

  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(frequency * 1.004, startTime); // +7 cents detune

  // Low-pass filter modulated by oceanic flow energy
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  const cutoff = 400 + Math.min(1.0, meanSpeed * 2.5) * 1200; // 400 Hz to 1600 Hz
  filter.frequency.setValueAtTime(cutoff, startTime);
  filter.Q.setValueAtTime(1.5, startTime);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, startTime);

  // Slow ocean swell envelope
  const attack = Math.min(0.6, duration * 0.3);
  const release = Math.min(0.8, duration * 0.4);
  const sustainTime = Math.max(attack, duration - release);

  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.45), startTime + attack);
  gainNode.gain.setValueAtTime(Math.max(0.0001, gain * 0.45), startTime + sustainTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);

  osc1.start(startTime);
  osc2.start(startTime);

  const stopTime = startTime + duration + 0.05;
  osc1.stop(stopTime);
  osc2.stop(stopTime);

  const voice: VoiceNode = {
    voice: 'pad',
    id,
    startTime,
    endTime: stopTime,
    gainNode,
    stop: (fade = 0.05) => {
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          filter.disconnect();
          gainNode.disconnect();
        } catch {
          // Ignore
        }
      }, fade * 1000 + 30);
    }
  };

  polyphony.registerVoice(voice);
  return voice;
}

/**
 * Creates and triggers the PULSE voice:
 * Plucked triangle wave with fast attack and exponential decay for fast current bursts.
 */
export function playPulseVoice(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  gain: number,
  pan: number,
  startTime: number,
  duration: number,
  polyphony: PolyphonyManager
): VoiceNode {
  const id = polyphony.nextVoiceId();

  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency * 2, startTime); // Octave higher for crisp pulse

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, startTime);

  // Plucked envelope: 5ms attack, exponential decay (120ms total)
  const attack = 0.005;
  const decayTime = Math.min(0.18, duration);

  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.7), startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + decayTime);

  const panner = ctx.createStereoPanner();
  panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), startTime);

  osc.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(destination);

  osc.start(startTime);
  const stopTime = startTime + decayTime + 0.02;
  osc.stop(stopTime);

  const voice: VoiceNode = {
    voice: 'pulse',
    id,
    startTime,
    endTime: stopTime,
    gainNode,
    pannerNode: panner,
    stop: (fade = 0.02) => {
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
          gainNode.disconnect();
          panner.disconnect();
        } catch {
          // Ignore
        }
      }, fade * 1000 + 30);
    }
  };

  polyphony.registerVoice(voice);
  return voice;
}

/**
 * Creates and triggers the BASS voice:
 * Deep sub-sine drone in the lowest registers representing the southern drift.
 */
export function playBassVoice(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  gain: number,
  startTime: number,
  duration: number,
  polyphony: PolyphonyManager
): VoiceNode {
  const id = polyphony.nextVoiceId();

  // Clamp bass fundamental to sub-range (40 Hz - 95 Hz)
  let subFreq = frequency;
  while (subFreq > 95) subFreq /= 2;
  while (subFreq < 38) subFreq *= 2;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(subFreq, startTime);

  // Lowpass filter to ensure zero high-frequency harmonic bleed
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(180, startTime);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.0001, startTime);

  const attack = Math.min(0.3, duration * 0.2);
  const release = Math.min(0.4, duration * 0.3);
  const sustainTime = Math.max(attack, duration - release);

  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.5), startTime + attack);
  gainNode.gain.setValueAtTime(Math.max(0.0001, gain * 0.5), startTime + sustainTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(destination);

  osc.start(startTime);
  const stopTime = startTime + duration + 0.05;
  osc.stop(stopTime);

  const voice: VoiceNode = {
    voice: 'bass',
    id,
    startTime,
    endTime: stopTime,
    gainNode,
    stop: (fade = 0.03) => {
      const now = ctx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
          filter.disconnect();
          gainNode.disconnect();
        } catch {
          // Ignore
        }
      }, fade * 1000 + 30);
    }
  };

  polyphony.registerVoice(voice);
  return voice;
}
