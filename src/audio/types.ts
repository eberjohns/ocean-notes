/**
 * src/audio/types.ts
 * Type definitions for Ocean Notes Audio Synthesizer Engine.
 */

export type ScaleName = 'dorian' | 'pentatonic' | 'wholetone';
export type VoiceName = 'pad' | 'lead' | 'pulse' | 'bass';
export type PlaybackSpeed = 0.5 | 1 | 2;
export type TransportState = 'stopped' | 'playing' | 'paused' | 'ended';

export interface ScaleDefinition {
  name: ScaleName;
  displayName: string;
  rootMidi: number;      // e.g. 50 (D3) for Dorian, 48 (C3) for Pentatonic
  intervals: number[];   // Semitone offsets from root
  pitchNames: string[];  // Note names
  description: string;
}

export interface CellAudioMapping {
  cellRow: number;
  cellCol: number;
  rowUi: number;
  colUi: number;
  frequency: number;
  midiNote: number;
  pitchName: string;
  gain: number;
  pan: number;
  coherence: number;
  isClipped: boolean;
  octaveOffset: number;
  sectorIndex: number;
}

export interface SoundingNote {
  cellId: string;
  row: number;
  col: number;
  rowUi: number;
  colUi: number;
  date: string;
  speed: number;
  u: number;
  v: number;
  direction: number;
  frequency: number;
  midiNote: number;
  pitchName: string;
  pan: number;
  gain: number;
  voice: VoiceName;
  startTime: number;
  duration: number;
}

export interface VoiceNode {
  voice: VoiceName;
  id: number;
  startTime: number;
  endTime: number;
  gainNode: GainNode;
  pannerNode?: StereoPannerNode;
  stop: (fadeTime?: number) => void;
}

export interface DayScheduleOptions {
  bpm?: number;
  speed?: number;
  barsPerDay?: number;
  leadEnabled?: boolean;
  padEnabled?: boolean;
  pulseEnabled?: boolean;
  bassEnabled?: boolean;
  scale?: ScaleName;
  onNoteStart?: (note: SoundingNote) => void;
}

export interface TransportSnapshot {
  state: TransportState;
  compTime: number;         // Nominal composition seconds [0, 270.545]
  duration: number;         // Total nominal duration ~270.545 s
  dayIndex: number;         // 0..30
  dayUi: number;            // 1..31
  date: string;             // '2026-10-01'
  barInDay: number;         // 0..3
  beatInBar: number;        // 0..3
  speed: PlaybackSpeed;
  progress: number;         // 0.0 to 1.0
  timeString: string;       // "1:36 / 4:30"
}

export interface LiveCaptionData {
  dayIndex: number;
  dayUi: number;
  date: string;
  dominantCell: {
    row: number;
    column: number;
    rowUi: number;
    colUi: number;
    lat: number;
    lon: number;
    meanSpeed: number;
    u: number;
    v: number;
    directionDeg: number;
    coherence: number;
  };
  pitchName: string;
  frequency: number;
  pan: number;
  text: string;
}


