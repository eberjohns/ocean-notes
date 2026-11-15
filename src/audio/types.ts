/**
 * src/audio/types.ts
 * Type definitions for Ocean Notes Audio Synthesizer Engine.
 */

export type ScaleName = 'dorian' | 'pentatonic' | 'wholetone';
export type VoiceName = 'pad' | 'lead' | 'pulse' | 'bass';

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
  barsPerDay?: number;
  leadEnabled?: boolean;
  padEnabled?: boolean;
  pulseEnabled?: boolean;
  bassEnabled?: boolean;
  scale?: ScaleName;
  onNoteStart?: (note: SoundingNote) => void;
}
