/**
 * src/audio/scales.ts
 * Musical scales and 16-sector direction mapping for Ocean Notes.
 */

import type { ScaleName, ScaleDefinition } from './types.ts';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Converts a MIDI note number to fundamental frequency in Hertz.
 * Standard tuning: A4 = 440 Hz (MIDI 69)
 */
export function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Converts a MIDI note number to standard scientific pitch notation (e.g. 60 -> C4).
 */
export function midiToPitchName(midiNote: number): string {
  const rounded = Math.round(midiNote);
  const note = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${note}${octave}`;
}

/**
 * Pre-defined scale configurations supported by Ocean Notes.
 */
export const SCALES: Record<ScaleName, ScaleDefinition> = {
  dorian: {
    name: 'dorian',
    displayName: 'Dorian (Default)',
    rootMidi: 50, // D3 (~146.83 Hz)
    intervals: [0, 2, 3, 5, 7, 9, 10], // D, E, F, G, A, B, C
    pitchNames: ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
    description: 'Open, oceanic, flowing modal character.'
  },
  pentatonic: {
    name: 'pentatonic',
    displayName: 'Pentatonic',
    rootMidi: 48, // C3 (~130.81 Hz)
    intervals: [0, 2, 4, 7, 9], // C, D, E, G, A
    pitchNames: ['C', 'D', 'E', 'G', 'A'],
    description: 'Safe, bright, harmonic stability across currents.'
  },
  wholetone: {
    name: 'wholetone',
    displayName: 'Whole Tone',
    rootMidi: 48, // C3
    intervals: [0, 2, 4, 6, 8, 10], // C, D, E, F#, G#, A#
    pitchNames: ['C', 'D', 'E', 'F#', 'G#', 'A#'],
    description: 'Dreamy, ambiguous, floating impressionistic harmony.'
  }
};

/**
 * Maps a direction in degrees (-180° to +180° from atan2(v, u)) to one of 16 sectors (0..15).
 * Sector width is 22.5°.
 * 0° (Eastward flow) -> Sector 0
 * 90° (Northward flow) -> Sector 4
 * ±180° (Westward flow) -> Sector 8
 * -90° (Southward flow) -> Sector 12
 */
export function directionToSector16(deg: number): number {
  // Normalize angle to [0, 360)
  let norm = deg % 360;
  if (norm < 0) norm += 360;

  // Each sector is centered or binned at 22.5° steps
  // Adding 11.25° aligns 0° directly to the center of Sector 0
  const sector = Math.floor((norm + 11.25) / 22.5) % 16;
  return sector;
}

/**
 * 16-pitch lookup table for each scale.
 * Spans 2+ octaves so every direction gets a distinct note.
 */
const SCALE_16_SECTORS: Record<ScaleName, number[]> = {
  // Dorian on D3 (MIDI 50): D3, E3, F3, G3, G#3, A3, B3, C4, D4, E4, F4, F#4, G4, A4, B4, C5
  dorian: [50, 52, 53, 55, 56, 57, 59, 60, 62, 64, 65, 66, 67, 69, 71, 72],

  // Pentatonic on C3 (MIDI 48): C3, D3, E3, G3, A3, C4, D4, E4, G4, A4, C5, D5, E5, G5, A5, C6
  pentatonic: [48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84],

  // Whole tone on C3 (MIDI 48): C3, D3, E3, F#3, G#3, A#3, C4, D4, E4, F#4, G#4, A#4, C5, D5, E5, F#5
  wholetone: [48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78]
};

/**
 * Returns the base MIDI note for a given 16-sector index in a scale.
 */
export function sectorToMidi(sector: number, scale: ScaleName = 'dorian'): number {
  const safeSector = ((sector % 16) + 16) % 16;
  return SCALE_16_SECTORS[scale][safeSector];
}
