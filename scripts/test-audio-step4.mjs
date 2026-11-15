#!/usr/bin/env node
/**
 * scripts/test-audio-step4.mjs
 * Automated Verification of Step 4: Audio Engine
 *
 * Verifies:
 * 1. Mathematical determinism of data-to-sound mapping
 * 2. 16-sector direction to pitch class mapping
 * 3. Latitude to register (3 octaves)
 * 4. Speed to square-root loudness curve & clipping detection
 * 5. Longitude to stereo pan (-1.0 to +1.0)
 * 6. Coherence to harmonic density
 * 7. Scale definitions (Dorian, Pentatonic, Whole Tone)
 * 8. Polyphony Manager 16-voice limit and voice stealing
 * 9. AudioContext opt-in constraint (no audio before explicit gesture)
 * 10. 110 BPM, 4/4, 4 bars per day = 4:30 month timeline mathematics
 * 11. Traceability: 20 sampled cells across October 2026 produce valid notes
 */

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log(' Step 4 Audio Engine: Automated Verification');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

try {
  // Dynamic import of TypeScript modules compiled or executed in Node
  const {
    directionToSector16,
    sectorToMidi,
    midiToFrequency,
    midiToPitchName,
    SCALES
  } = await import('../src/audio/scales.ts');

  const {
    mapCellToAudio,
    getHarmonicOffsetsForCoherence
  } = await import('../src/audio/mapping.ts');

  const { PolyphonyManager } = await import('../src/audio/voices.ts');
  const { AudioEngine } = await import('../src/audio/engine.ts');

  // 1. Scale Definitions and Properties
  assert(SCALES.dorian && SCALES.dorian.rootMidi === 50, 'Dorian scale defined with root D3 (MIDI 50)');
  assert(SCALES.pentatonic && SCALES.pentatonic.rootMidi === 48, 'Pentatonic scale defined with root C3 (MIDI 48)');
  assert(SCALES.wholetone && SCALES.wholetone.rootMidi === 48, 'Whole Tone scale defined with root C3 (MIDI 48)');

  // 2. 16-Sector Direction Mapping
  const dirTestCases = [
    { deg: 0.0, expSector: 0, label: '0° East -> Sector 0' },
    { deg: 22.5, expSector: 1, label: '22.5° ENE -> Sector 1' },
    { deg: 45.0, expSector: 2, label: '45° NE -> Sector 2' },
    { deg: 90.0, expSector: 4, label: '90° North -> Sector 4' },
    { deg: 180.0, expSector: 8, label: '180° West -> Sector 8' },
    { deg: -180.0, expSector: 8, label: '-180° West -> Sector 8' },
    { deg: -90.0, expSector: 12, label: '-90° South -> Sector 12' },
    { deg: -45.0, expSector: 14, label: '-45° SE -> Sector 14' }
  ];

  for (const tc of dirTestCases) {
    const s = directionToSector16(tc.deg);
    assert(s === tc.expSector, `Direction ${tc.label} (got ${s})`);
  }

  // 3. Frequency and Pitch Name Formulas
  const freq440 = midiToFrequency(69);
  assert(Math.abs(freq440 - 440) < 0.001, 'MIDI 69 evaluates exactly to 440.0 Hz');
  const freqC4 = midiToFrequency(60);
  assert(Math.abs(freqC4 - 261.626) < 0.01, `MIDI 60 evaluates to Middle C (261.63 Hz, got ${freqC4.toFixed(3)})`);
  assert(midiToPitchName(60) === 'C4', 'MIDI 60 translates to pitch name C4');
  assert(midiToPitchName(50) === 'D3', 'MIDI 50 translates to pitch name D3');
  assert(midiToPitchName(69) === 'A4', 'MIDI 69 translates to pitch name A4');

  // 4. Mathematical Determinism of mapCellToAudio
  const mockCellSouth = {
    row: 0,
    column: 0,
    row_ui: 1,
    column_ui: 1,
    lat: -8.75,
    lon: 61.875,
    mean_speed_m_s: 0.25,
    vector_speed_m_s: 0.23,
    u_m_s: 0.23,
    v_m_s: 0.0,
    direction_deg: 0.0,
    coherence: 0.92,
    valid_samples: 150,
    total_samples: 150,
    speed_rank: 20
  };

  const mapSouth = mapCellToAudio(mockCellSouth, 'dorian', 0.35);
  // Sector 0 in Dorian is D3 (50). Row 0 is octave -1 (-12) -> MIDI 38 (D2).
  assert(mapSouth.sectorIndex === 0, 'Cell 0° flow maps to Sector 0');
  assert(mapSouth.midiNote === 38, `Row 0 (Southern) maps to D2 (MIDI 38, got ${mapSouth.midiNote})`);
  assert(mapSouth.pitchName === 'D2', `Pitch name is D2 (got ${mapSouth.pitchName})`);
  assert(Math.abs(mapSouth.frequency - 73.416) < 0.01, `Frequency is 73.42 Hz (got ${mapSouth.frequency.toFixed(2)})`);

  // Speed: sqrt(0.25) * 0.35 = 0.5 * 0.35 = 0.175
  assert(Math.abs(mapSouth.gain - 0.175) < 0.0001, `Speed 0.25 m/s gives sqrt gain 0.175 (got ${mapSouth.gain.toFixed(4)})`);
  // Pan: lon 61.875 is minLon -> full left (-1.0)
  assert(Math.abs(mapSouth.pan - (-1.0)) < 0.001, `Longitude 61.875°E gives pan -1.0 (got ${mapSouth.pan})`);
  assert(!mapSouth.isClipped, 'Speed 0.25 m/s is not clipped');

  // Test Equatorial Cell (Row 3, Col 4)
  const mockCellEquator = {
    row: 3,
    column: 4,
    row_ui: 4,
    column_ui: 5,
    lat: -1.125,
    lon: 77.0,
    mean_speed_m_s: 0.16,
    vector_speed_m_s: 0.15,
    u_m_s: -0.15,
    v_m_s: 0.0,
    direction_deg: 180.0,
    coherence: 0.94,
    valid_samples: 150,
    total_samples: 150,
    speed_rank: 40
  };

  const mapEquator = mapCellToAudio(mockCellEquator, 'dorian', 0.35);
  // Sector 8 in Dorian is D4 (62). Row 3 is octave 0 -> MIDI 62 (D4).
  assert(mapEquator.sectorIndex === 8, 'Westward flow (180°) maps to Sector 8');
  assert(mapEquator.midiNote === 62, `Equatorial Row 3 maps to nominal octave D4 (MIDI 62, got ${mapEquator.midiNote})`);
  assert(mapEquator.pitchName === 'D4', `Pitch name is D4 (got ${mapEquator.pitchName})`);
  // Speed: sqrt(0.16) * 0.35 = 0.4 * 0.35 = 0.14
  assert(Math.abs(mapEquator.gain - 0.14) < 0.0001, `Speed 0.16 m/s gives sqrt gain 0.14 (got ${mapEquator.gain.toFixed(4)})`);
  // Pan: 77.0 is near center
  assert(Math.abs(mapEquator.pan - 0.147) < 0.01, `Longitude 77.0°E gives pan ~ +0.15 (got ${mapEquator.pan})`);

  // Test Northern Cell (Row 7, Col 7)
  const mockCellNorth = {
    row: 7,
    column: 7,
    row_ui: 8,
    column_ui: 8,
    lat: 8.875,
    lon: 88.25,
    mean_speed_m_s: 1.25, // Intentional overspeed to test clipping
    vector_speed_m_s: 1.10,
    u_m_s: 1.10,
    v_m_s: 0.0,
    direction_deg: 0.0,
    coherence: 0.32,
    valid_samples: 150,
    total_samples: 150,
    speed_rank: 1
  };

  const mapNorth = mapCellToAudio(mockCellNorth, 'dorian', 0.35);
  // Sector 0 in Dorian is D3 (50). Row 7 is octave +1 (+12) -> MIDI 62 (D4).
  assert(mapNorth.midiNote === 62, `Northern Row 7 maps to octave +1 (got ${mapNorth.midiNote})`);
  assert(mapNorth.isClipped === true, 'Overspeed (>1.0 m/s) is correctly flagged as isClipped=true');
  assert(Math.abs(mapNorth.gain - 0.35) < 0.0001, 'Clipped speed clamps gain to maximum 0.35');
  assert(Math.abs(mapNorth.pan - 1.0) < 0.001, `Longitude 88.25°E gives pan +1.0 full right (got ${mapNorth.pan})`);

  // 5. Coherence Harmonic Offsets
  const highCohOffsets = getHarmonicOffsetsForCoherence(0.85);
  assert(JSON.stringify(highCohOffsets) === JSON.stringify([0, 7]), 'High coherence (0.85) produces clean 5th [0, 7]');

  const midCohOffsets = getHarmonicOffsetsForCoherence(0.60);
  assert(JSON.stringify(midCohOffsets) === JSON.stringify([0, 5, 7]), 'Medium coherence (0.60) produces modal triad [0, 5, 7]');

  const lowCohOffsets = getHarmonicOffsetsForCoherence(0.25);
  assert(JSON.stringify(lowCohOffsets) === JSON.stringify([0, 1, 6]), 'Low coherence (0.25) produces turbulent cluster [0, 1, 6]');

  // 6. Polyphony Manager (Strict 16-Voice Limit)
  const poly = new PolyphonyManager(16);
  let stoppedCount = 0;

  for (let i = 0; i < 22; i++) {
    poly.registerVoice({
      voice: 'lead',
      id: i,
      startTime: 0,
      endTime: 999999, // Long-lived
      gainNode: {},
      stop: () => { stoppedCount++; }
    });
  }

  assert(poly.getActiveCount() <= 16, `Active voice count (${poly.getActiveCount()}) is capped at 16`);
  assert(stoppedCount === 6, `Voice stealing stopped exactly 6 excess voices (got ${stoppedCount})`);

  // 7. AudioContext Opt-In Constraint
  // Verify that merely creating the AudioEngine instance does NOT instantiate AudioContext
  const testEngine = new AudioEngine();
  assert(testEngine.isInitialized() === false, 'AudioEngine starts uninitialized (AudioContext is null)');
  assert(testEngine.isMuted() === true, 'AudioEngine starts with sound muted by default');
  assert(testEngine.getScale() === 'dorian', 'Default scale is Dorian');

  // 8. Metric Timing & Duration Calculations
  const bpm = 110;
  const beatDuration = 60 / bpm; // 0.54545 s
  const barDuration = 4 * beatDuration; // 2.1818 s
  const dayDuration = 4 * barDuration; // 8.72727 s
  const monthDuration = 31 * dayDuration; // 270.545 s (~4:30)

  assert(Math.abs(dayDuration - 8.727) < 0.01, `4 bars at 110 BPM is ~8.73 s (got ${dayDuration.toFixed(3)} s)`);
  assert(Math.abs(monthDuration - 270.54) < 0.5, `31 days at 110 BPM is ~270.5 s / 4:30 (got ${monthDuration.toFixed(1)} s)`);

  // 9. Real Dataset Verification: Sample 20 cell-day combinations
  const grid8 = JSON.parse(fs.readFileSync('public/data/grid8.json', 'utf-8'));
  assert(grid8.days.length === 31, 'grid8.json contains all 31 days');

  let validSampleCount = 0;
  for (let dayIdx of [0, 7, 14, 21, 30]) {
    const day = grid8.days[dayIdx];
    for (let cIdx of [0, 15, 32, 47]) {
      const cell = day.cells[cIdx];
      const mapping = mapCellToAudio(cell, 'dorian');

      assert(Number.isFinite(mapping.frequency) && mapping.frequency > 20 && mapping.frequency < 2000,
        `Day ${day.day_index} Cell (${cell.row_ui}, ${cell.column_ui}) has valid frequency: ${mapping.frequency.toFixed(1)} Hz (${mapping.pitchName})`);
      assert(mapping.gain >= 0 && mapping.gain <= 0.35,
        `Day ${day.day_index} Cell (${cell.row_ui}, ${cell.column_ui}) has valid gain: ${mapping.gain.toFixed(3)}`);
      assert(mapping.pan >= -1.0 && mapping.pan <= 1.0,
        `Day ${day.day_index} Cell (${cell.row_ui}, ${cell.column_ui}) has valid pan: ${mapping.pan}`);

      validSampleCount++;
    }
  }
  assert(validSampleCount === 20, 'All 20 sampled cells across October 2026 produce mathematically valid notes');

  console.log('----------------------------------------------------');
  console.log(`Step 4 Test Summary: ${passed} passed, ${failed} failed.`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('All Step 4 Audio Engine tests PASSED successfully.\n');
  }
} catch (err) {
  console.error('Test execution failed with error:', err);
  process.exit(1);
}
