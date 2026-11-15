/**
 * src/audio/mapping.ts
 * Pure mathematical mapping from scientific ocean current data to musical parameters.
 * Decoupled from Web Audio API for fast, deterministic unit testing.
 */

import type { Grid8Cell } from '../data/loader.ts';
import type { ScaleName, CellAudioMapping } from './types.ts';
import { directionToSector16, sectorToMidi, midiToFrequency, midiToPitchName } from './scales.ts';

/**
 * Maps an 8x8 cell's scientific quantities (direction, lat, lon, speed, coherence)
 * to deterministic audio synthesis parameters.
 */
export function mapCellToAudio(
  cell: Grid8Cell,
  scale: ScaleName = 'dorian',
  baseGainMultiplier: number = 0.35
): CellAudioMapping {
  // 1. Direction -> Pitch class (16 sectors)
  const sectorIndex = directionToSector16(cell.direction_deg);
  const baseMidi = sectorToMidi(sectorIndex, scale);

  // 2. Latitude -> Register (3 octaves: South = low, North = high)
  // Row 0..2: -1 octave (-12 semitones)
  // Row 3..4:  0 octave (nominal)
  // Row 5..7: +1 octave (+12 semitones)
  let octaveOffset = 0;
  if (cell.row <= 2) {
    octaveOffset = -1;
  } else if (cell.row >= 5) {
    octaveOffset = 1;
  }
  const midiNote = baseMidi + octaveOffset * 12;
  const frequency = midiToFrequency(midiNote);
  const pitchName = midiToPitchName(midiNote);

  // 3. Speed -> Loudness (Square-root curve, fixed scale 0 to 1.0 m/s)
  const rawSpeed = cell.mean_speed_m_s;
  const isClipped = rawSpeed > 1.0;
  const clampedSpeed = Math.max(0, Math.min(1.0, rawSpeed));
  const sqrtSpeed = Math.sqrt(clampedSpeed); // 0.0 -> 0.0, 0.25 -> 0.5, 1.0 -> 1.0
  const gain = sqrtSpeed * baseGainMultiplier;

  // 4. Longitude -> Stereo Pan (61.875°E full left [-1.0] to 88.25°E full right [+1.0])
  const minLon = 61.875;
  const maxLon = 88.25;
  const lonSpan = maxLon - minLon;
  const normLon = Math.max(0, Math.min(1.0, (cell.lon - minLon) / lonSpan));
  const pan = Math.round((normLon * 2 - 1) * 1000) / 1000; // -1.0 to +1.0

  // 5. Coherence
  const coherence = Math.max(0, Math.min(1.0, cell.coherence));

  return {
    cellRow: cell.row,
    cellCol: cell.column,
    rowUi: cell.row_ui,
    colUi: cell.column_ui,
    frequency,
    midiNote,
    pitchName,
    gain,
    pan,
    coherence,
    isClipped,
    octaveOffset,
    sectorIndex
  };
}

/**
 * Returns harmonic chord offsets (in semitones) based on directional coherence:
 * - High coherence (C >= 0.75): clean, consonant intervals (e.g. unison, 5th, octave)
 * - Moderate coherence (0.45 <= C < 0.75): open triad / modal 4th & 5th
 * - Low coherence (C < 0.45): dissonant cluster (minor 2nd, tritone)
 */
export function getHarmonicOffsetsForCoherence(coherence: number): number[] {
  if (coherence >= 0.75) {
    // Clean consonant interval (Root + Fifth or Octave)
    return [0, 7];
  } else if (coherence >= 0.45) {
    // Open modal triad (Root + Fourth + Fifth)
    return [0, 5, 7];
  } else {
    // Turbulent cluster (Root + Minor 2nd + Tritone)
    return [0, 1, 6];
  }
}
