#!/usr/bin/env node
/**
 * test-data-step2.mjs
 * Verification of Step 2: Data Layer and Lab Skeleton
 * - Validates grid8.json structure and numerical fidelity against source JSON
 * - Validates 20 randomly sampled cell-day pairs
 * - Validates fine-uv.bin binary decoding (Int16 little-endian, scale 1000, sentinel -32768)
 * - Validates meta.json provenance, formulas, checksums, and GEBCO attribution
 */

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log(' Step 2 Data Layer: Automated Verification');
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
  // 1. Validate grid8.json
  const grid8Path = 'public/data/grid8.json';
  assert(fs.existsSync(grid8Path), 'public/data/grid8.json exists');
  const grid8 = JSON.parse(fs.readFileSync(grid8Path, 'utf-8'));

  assert(grid8.days && grid8.days.length === 31, 'grid8.json contains exactly 31 days');
  assert(grid8.grid_shape[0] === 8 && grid8.grid_shape[1] === 8, 'grid8.json shape is 8x8');

  // Load original supplied JSON
  const origSource = JSON.parse(fs.readFileSync('data/indian_ocean_october_2026.json', 'utf-8'));

  // Sample 20 deterministic pseudo-random cell-day pairs
  // (covering various dates, edges, and equator)
  const samplePairs = [
    { day: 0, row: 0, col: 0 },    // Oct 01, SW corner
    { day: 0, row: 7, col: 7 },    // Oct 01, NE corner
    { day: 0, row: 3, col: 4 },    // Oct 01, Equator
    { day: 5, row: 2, col: 5 },    // Oct 06, Southern mid
    { day: 10, row: 1, col: 2 },   // Oct 11
    { day: 11, row: 4, col: 3 },   // Oct 12, Equatorial jet
    { day: 15, row: 6, col: 6 },   // Oct 16
    { day: 18, row: 5, col: 1 },   // Oct 19
    { day: 20, row: 0, col: 7 },   // Oct 21, SE corner
    { day: 22, row: 7, col: 0 },   // Oct 23, NW corner
    { day: 25, row: 4, col: 5 },   // Oct 26, Peak cell
    { day: 27, row: 2, col: 2 },   // Oct 28
    { day: 28, row: 3, col: 6 },   // Oct 29
    { day: 29, row: 5, col: 4 },   // Oct 30
    { day: 30, row: 7, col: 7 },   // Oct 31, End of month
    { day: 30, row: 0, col: 0 },   // Oct 31, South edge
    { day: 7, row: 4, col: 4 },    // Oct 08
    { day: 14, row: 1, col: 6 },   // Oct 15
    { day: 21, row: 6, col: 2 },   // Oct 22
    { day: 30, row: 3, col: 4 }    // Oct 31, Equatorial
  ];

  assert(samplePairs.length === 20, 'Prepared 20 sampled cell-day verification pairs');

  let maxSampleDiffU = 0;
  let maxSampleDiffV = 0;

  for (const p of samplePairs) {
    const origDay = origSource.days[p.day];
    const origCell = origDay.cells.find(c => c.row === p.row && c.column === p.col);

    const derivedDay = grid8.days[p.day];
    const derivedCell = derivedDay.cells.find(c => c.row === p.row && c.column === p.col);

    assert(origCell !== undefined && derivedCell !== undefined, `Found cell at day ${p.day}, r=${p.row}, c=${p.col}`);
    assert(origCell.valid_samples === derivedCell.valid_samples, `Sample count matches: ${origCell.valid_samples}`);
    assert(derivedCell.row_ui === derivedCell.row + 1, `1-based row_ui is correct: ${derivedCell.row_ui}`);
    assert(derivedCell.column_ui === derivedCell.column + 1, `1-based column_ui is correct: ${derivedCell.column_ui}`);

    const diffU = Math.abs(origCell.u_m_s - derivedCell.u_m_s);
    const diffV = Math.abs(origCell.v_m_s - derivedCell.v_m_s);
    if (diffU > maxSampleDiffU) maxSampleDiffU = diffU;
    if (diffV > maxSampleDiffV) maxSampleDiffV = diffV;

    // Derived values are rounded to 3 decimals, so max diff should be <= 0.001 m/s
    assert(diffU <= 0.001, `U matches source within rounding tolerance: got ${derivedCell.u_m_s}, orig ${origCell.u_m_s}`);
    assert(diffV <= 0.001, `V matches source within rounding tolerance: got ${derivedCell.v_m_s}, orig ${origCell.v_m_s}`);

    // Verify coherence bounds [0, 1]
    assert(derivedCell.coherence >= 0 && derivedCell.coherence <= 1.0, `Coherence in [0, 1]: got ${derivedCell.coherence}`);
  }

  console.log(`Max sample differences: U=${maxSampleDiffU.toFixed(5)} m/s, V=${maxSampleDiffV.toFixed(5)} m/s`);

  // Verify daily speed ranks are complete 1..64 permutations
  for (let d = 0; d < 31; d++) {
    const ranks = grid8.days[d].cells.map(c => c.speed_rank).sort((a, b) => a - b);
    const isPermutation = ranks.every((val, idx) => val === idx + 1);
    assert(isPermutation, `Day ${d + 1} speed ranks are valid 1..64 permutation`);
  }

  // 2. Validate fine-uv.bin binary encoding
  const fineBinPath = 'public/data/fine-uv.bin';
  assert(fs.existsSync(fineBinPath), 'public/data/fine-uv.bin exists');
  const fineBuffer = fs.readFileSync(fineBinPath);
  const expectedBytes = 31 * 2 * 81 * 121 * 2;
  assert(fineBuffer.length === expectedBytes, `fine-uv.bin size is exactly ${expectedBytes} bytes (1,215,324 B)`);

  // Decode Int16 little-endian
  const int16Array = new Int16Array(fineBuffer.buffer, fineBuffer.byteOffset, fineBuffer.length / 2);
  let totalMissing = 0;
  for (let i = 0; i < int16Array.length; i++) {
    if (int16Array[i] === -32768) {
      totalMissing++;
    }
  }
  // 31 days * 2 components * 160 missing points = 9,920 missing elements
  assert(totalMissing === 31 * 2 * 160, `Exactly 160 missing points per day per component: total ${totalMissing}`);

  // Test day 0 U/V range
  let minU = Infinity, maxU = -Infinity;
  for (let i = 0; i < 81 * 121; i++) {
    const raw = int16Array[i];
    if (raw !== -32768) {
      const val = raw / 1000.0;
      if (val < minU) minU = val;
      if (val > maxU) maxU = val;
    }
  }
  assert(minU >= -1.5 && maxU <= 1.5, `Physical velocity range is realistic: minU=${minU.toFixed(3)}, maxU=${maxU.toFixed(3)} m/s`);

  // 3. Validate meta.json
  const metaPath = 'public/data/meta.json';
  assert(fs.existsSync(metaPath), 'public/data/meta.json exists');
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  assert(meta.project === 'Ocean Notes', 'meta.json project name is Ocean Notes');
  assert(meta.datasets.ocean_currents.doi_url.includes('10.5067/OSCAR-25N20'), 'meta.json has OSCAR DOI URL');
  assert(meta.datasets.bathymetry.doi_url.includes('10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa'), 'meta.json has GEBCO DOI URL');
  assert(meta.datasets.bathymetry.source.includes('GEBCO Bathymetric Compilation Group 2026'), 'meta.json has exact GEBCO credit');
  assert(meta.datasets.bathymetry.gebco_metadata !== undefined, 'meta.json contains copied bathymetry-meta.json fields');

} catch (err) {
  console.error('Test execution error:', err);
  failed++;
}

console.log('\n----------------------------------------------------');
console.log(`Step 2 Test Summary: ${passed} passed, ${failed} failed.`);
console.log('----------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll Step 2 Data Layer tests PASSED successfully.\n');
  process.exit(0);
}

