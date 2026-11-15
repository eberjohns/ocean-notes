/**
 * src/audio/engine.ts
 * Master Web Audio API Synthesizer Engine for Ocean Notes.
 *
 * Implements:
 * - One AudioContext created strictly on user gesture
 * - Master gain (-12 dBFS) with 200 ms smooth fade-in
 * - Brickwall dynamics limiter preventing digital clipping
 * - 16-voice polyphony management with voice stealing
 * - Deterministic data-to-sound mapping
 * - 110 BPM, 4/4 meter, 4 bars per day timing
 * - Decoupled event hooks for UI telemetry and transport
 */

import type { Grid8Cell, Grid8Day } from '../data/loader.ts';
import type { ScaleName, VoiceName, SoundingNote, DayScheduleOptions } from './types.ts';
import { SCALES } from './scales.ts';
import { mapCellToAudio } from './mapping.ts';
import {
  PolyphonyManager,
  playLeadVoice,
  playPadVoice,
  playPulseVoice,
  playBassVoice
} from './voices.ts';

const STORAGE_KEY_SOUND = 'ocean_notes_sound_enabled';
const DEFAULT_BPM = 110;
const DEFAULT_MASTER_DB = -12; // -12 dBFS nominal headroom

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private polyphony: PolyphonyManager;

  private isSoundMuted: boolean = true;
  private currentScale: ScaleName = 'dorian';
  private nominalGainValue: number = Math.pow(10, DEFAULT_MASTER_DB / 20); // ~0.2512

  private noteListeners: Array<(note: SoundingNote) => void> = [];
  private stateListeners: Array<(isMuted: boolean, isInit: boolean) => void> = [];

  constructor() {
    this.polyphony = new PolyphonyManager(16);

    // Read stored sound preference safely
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SOUND);
      if (stored === 'true') {
        // Preference remembered, but AudioContext must still wait for user click
        this.isSoundMuted = false;
      } else {
        this.isSoundMuted = true;
      }
    } catch {
      this.isSoundMuted = true;
    }
  }

  /**
   * Initializes or resumes the single Web Audio AudioContext.
   * MUST only be called in response to a user gesture.
   */
  public async init(): Promise<void> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        throw new Error('Web Audio API is not supported in this browser.');
      }

      this.ctx = new AudioCtxClass();

      // Master Limiter (Brickwall anti-clipping protection)
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-1.5, this.ctx.currentTime); // -1.5 dBFS
      this.limiter.knee.setValueAtTime(0.0, this.ctx.currentTime);        // Hard knee
      this.limiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);      // 20:1 brickwall limiter
      this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);    // 3 ms fast response
      this.limiter.release.setValueAtTime(0.1, this.ctx.currentTime);     // 100 ms release

      // Master Gain (-12 dBFS baseline)
      this.masterGain = this.ctx.createGain();
      const initialGain = this.isSoundMuted ? 0.0001 : this.nominalGainValue;
      this.masterGain.gain.setValueAtTime(initialGain, this.ctx.currentTime);

      // Graph: [Voices] -> [MasterGain] -> [Limiter] -> [Destination]
      this.masterGain.connect(this.limiter);
      this.limiter.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.notifyState();
  }

  public isInitialized(): boolean {
    return this.ctx !== null;
  }

  public isMuted(): boolean {
    return this.isSoundMuted;
  }

  public setMuted(muted: boolean): void {
    this.isSoundMuted = muted;

    try {
      localStorage.setItem(STORAGE_KEY_SOUND, String(!muted));
    } catch {
      // LocalStorage unavailable
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);

      if (muted) {
        // Quick 50 ms fade-out to prevent clicks
        this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      } else {
        // 200 ms smooth fade-in as required by specification
        this.masterGain.gain.exponentialRampToValueAtTime(this.nominalGainValue, now + 0.2);
      }
    }

    this.notifyState();
  }

  public toggleMute(): void {
    this.setMuted(!this.isSoundMuted);
  }

  public getScale(): ScaleName {
    return this.currentScale;
  }

  public setScale(scale: ScaleName): void {
    if (scale in SCALES) {
      this.currentScale = scale;
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  public getActiveVoicesCount(): number {
    return this.polyphony.getActiveCount();
  }

  /**
   * Plays a single 8x8 cell immediately (e.g. when selected in map or table).
   * Returns a complete SoundingNote metadata record for UI traceability.
   */
  public playCell(
    cell: Grid8Cell,
    options?: {
      duration?: number;
      voice?: VoiceName;
      scale?: ScaleName;
      date?: string;
    }
  ): SoundingNote | null {
    if (!this.ctx || !this.masterGain) return null;

    const scale = options?.scale || this.currentScale;
    const duration = options?.duration || 0.65;
    const voiceName = options?.voice || 'lead';
    const date = options?.date || '2026-10-01';

    const mapping = mapCellToAudio(cell, scale);
    const startTime = this.ctx.currentTime + 0.01;

    // Trigger selected voice
    if (voiceName === 'lead') {
      playLeadVoice(
        this.ctx,
        this.masterGain,
        mapping.frequency,
        mapping.gain,
        mapping.pan,
        startTime,
        duration,
        this.polyphony
      );
    } else if (voiceName === 'pad') {
      playPadVoice(
        this.ctx,
        this.masterGain,
        mapping.frequency,
        mapping.gain,
        cell.mean_speed_m_s,
        startTime,
        duration,
        this.polyphony
      );
    } else if (voiceName === 'pulse') {
      playPulseVoice(
        this.ctx,
        this.masterGain,
        mapping.frequency,
        mapping.gain,
        mapping.pan,
        startTime,
        duration,
        this.polyphony
      );
    } else if (voiceName === 'bass') {
      playBassVoice(
        this.ctx,
        this.masterGain,
        mapping.frequency,
        mapping.gain,
        startTime,
        duration,
        this.polyphony
      );
    }

    const soundingNote: SoundingNote = {
      cellId: `r${cell.row}_c${cell.column}`,
      row: cell.row,
      col: cell.column,
      rowUi: cell.row_ui,
      colUi: cell.column_ui,
      date,
      speed: cell.mean_speed_m_s,
      u: cell.u_m_s,
      v: cell.v_m_s,
      direction: cell.direction_deg,
      frequency: mapping.frequency,
      midiNote: mapping.midiNote,
      pitchName: mapping.pitchName,
      pan: mapping.pan,
      gain: mapping.gain,
      voice: voiceName,
      startTime,
      duration
    };

    this.emitNote(soundingNote);
    return soundingNote;
  }

  /**
   * Schedules a complete 1-day musical progression (4 bars at 110 BPM = ~8.73 s)
   * across the 8 columns and 4 voices.
   */
  public scheduleDay(day: Grid8Day, startTime: number, options?: DayScheduleOptions): void {
    if (!this.ctx || !this.masterGain) return;

    const bpm = options?.bpm || DEFAULT_BPM;
    const beatSec = 60 / bpm; // ~0.5455 s
    const scale = options?.scale || this.currentScale;

    // Bars 1 to 3: 12 beats spanning columns 0 to 7 west to east
    // Bar 4: holds the day's mean chord and breath
    const sweepDuration = 12 * beatSec; // ~6.55 s
    const colStep = sweepDuration / 8;  // ~0.818 s per column

    // Calculate day's 75th percentile speed for Pulse trigger
    const sortedSpeeds = day.cells.map(c => c.mean_speed_m_s).sort((a, b) => a - b);
    const p75Speed = sortedSpeeds[Math.floor(sortedSpeeds.length * 0.75)] || 0.25;

    // 1. Bass Voice: Root drone anchored to southern drift (Row 0 cells)
    if (options?.bassEnabled !== false) {
      const southCell = day.cells.find(c => c.row === 0) || day.cells[0];
      const bassMap = mapCellToAudio(southCell, scale, 0.4);
      playBassVoice(
        this.ctx,
        this.masterGain,
        bassMap.frequency,
        bassMap.gain,
        startTime,
        15 * beatSec, // Sustained across day
        this.polyphony
      );
    }

    // 2. Pad Voice: Global oceanic atmosphere modulated by daily mean speed
    if (options?.padEnabled !== false) {
      const padCell = day.cells[Math.floor(day.cells.length / 2)];
      const padMap = mapCellToAudio(padCell, scale, 0.35);
      playPadVoice(
        this.ctx,
        this.masterGain,
        padMap.frequency,
        padMap.gain,
        day.mean_grid_speed_m_s,
        startTime + 0.1,
        15 * beatSec,
        this.polyphony
      );
    }

    // 3. Arpeggiated West-to-East Sweep across the 8 Columns
    for (let c = 0; c < 8; c++) {
      const colCells = day.cells.filter(cell => cell.column === c);
      if (colCells.length === 0) continue;

      // Find strongest cell in this column
      let strongestCell = colCells[0];
      for (const cell of colCells) {
        if (cell.mean_speed_m_s > strongestCell.mean_speed_m_s) {
          strongestCell = cell;
        }
      }

      const colTime = startTime + c * colStep;
      const noteDuration = colStep * 0.9;

      // Lead Voice on strongest current cell in column
      if (options?.leadEnabled !== false) {
        const leadMap = mapCellToAudio(strongestCell, scale);
        playLeadVoice(
          this.ctx,
          this.masterGain,
          leadMap.frequency,
          leadMap.gain,
          leadMap.pan,
          colTime,
          noteDuration,
          this.polyphony
        );

        const noteInfo: SoundingNote = {
          cellId: `r${strongestCell.row}_c${strongestCell.column}`,
          row: strongestCell.row,
          col: strongestCell.column,
          rowUi: strongestCell.row_ui,
          colUi: strongestCell.column_ui,
          date: day.date,
          speed: strongestCell.mean_speed_m_s,
          u: strongestCell.u_m_s,
          v: strongestCell.v_m_s,
          direction: strongestCell.direction_deg,
          frequency: leadMap.frequency,
          midiNote: leadMap.midiNote,
          pitchName: leadMap.pitchName,
          pan: leadMap.pan,
          gain: leadMap.gain,
          voice: 'lead',
          startTime: colTime,
          duration: noteDuration
        };

        this.emitNote(noteInfo);
        options?.onNoteStart?.(noteInfo);
      }

      // Pulse Voice triggered if column contains energetic currents (> p75)
      if (options?.pulseEnabled !== false && strongestCell.mean_speed_m_s >= p75Speed) {
        const pulseMap = mapCellToAudio(strongestCell, scale, 0.4);
        playPulseVoice(
          this.ctx,
          this.masterGain,
          pulseMap.frequency,
          pulseMap.gain,
          pulseMap.pan,
          colTime + colStep * 0.4,
          colStep * 0.35,
          this.polyphony
        );
      }
    }
  }

  public stopAll(fadeTime: number = 0.05): void {
    this.polyphony.stopAll(fadeTime);
  }

  public subscribeNote(cb: (note: SoundingNote) => void): () => void {
    this.noteListeners.push(cb);
    return () => {
      this.noteListeners = this.noteListeners.filter(l => l !== cb);
    };
  }

  public subscribeState(cb: (isMuted: boolean, isInit: boolean) => void): () => void {
    this.stateListeners.push(cb);
    cb(this.isSoundMuted, this.isInitialized());
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== cb);
    };
  }

  private emitNote(note: SoundingNote): void {
    for (const cb of this.noteListeners) {
      try {
        cb(note);
      } catch {
        // Listener error
      }
    }
  }

  private notifyState(): void {
    const isInit = this.isInitialized();
    for (const cb of this.stateListeners) {
      try {
        cb(this.isSoundMuted, isInit);
      } catch {
        // Listener error
      }
    }
  }

  public dispose(): void {
    this.stopAll(0.01);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Ignore
      }
      this.ctx = null;
    }
    this.noteListeners = [];
    this.stateListeners = [];
  }
}

// Global engine singleton
export const audioEngine = new AudioEngine();
