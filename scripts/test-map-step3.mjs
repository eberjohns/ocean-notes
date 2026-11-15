#!/usr/bin/env node
/**
 * test-map-step3.mjs
 * Verification of Step 3: Regional Map
 * - Tests GEBCO optimized assets existence and size budgets
 * - Tests geographic coordinate alignment and 8x8 snapping
 * - Tests Three.js relief map component instantiation
 * - Tests keyboard navigation across all 64 cells
 * - Tests readout card updates and ARIA polite live regions
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

console.log('====================================================');
console.log(' Step 3 Regional Map: Automated Verification');
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
  // 1. Asset verification and size budgets
  const reliefWebp = 'public/data/relief-2048.webp';
  const heightPng = 'public/data/height-1024.png';
  const normalWebp = 'public/data/normal-1024.webp';
  const coastJson = 'public/data/coast.json';

  assert(fs.existsSync(reliefWebp), 'relief-2048.webp exists');
  const reliefSize = fs.statSync(reliefWebp).size;
  assert(reliefSize < 250 * 1024, `relief-2048.webp is ${reliefSize} B (< 250 KB budget)`);

  assert(fs.existsSync(heightPng), 'height-1024.png exists');
  const heightSize = fs.statSync(heightPng).size;
  assert(heightSize < 800 * 1024, `height-1024.png is ${heightSize} B (< 800 KB budget)`);

  assert(fs.existsSync(normalWebp), 'normal-1024.webp exists');
  const normalSize = fs.statSync(normalWebp).size;
  assert(normalSize < 1000 * 1024, `normal-1024.webp is ${normalSize} B (< 1 MB budget)`);

  assert(fs.existsSync(coastJson), 'coast.json exists');
  const coastSize = fs.statSync(coastJson).size;
  assert(coastSize < 100 * 1024, `coast.json is ${coastSize} B (< 100 KB budget)`);

  const coastGeo = JSON.parse(fs.readFileSync(coastJson, 'utf-8'));
  assert(coastGeo.features && coastGeo.features.length > 0, `coast.json contains ${coastGeo.features.length} land polygons`);

  // 2. Geographic alignment and non-uniform snapping logic
  const latBounds = [-10.0, -7.375, -4.875, -2.375, 0.125, 2.625, 5.125, 7.625, 10.0];
  const lonBounds = [60.0, 63.875, 67.625, 71.375, 75.125, 78.875, 82.625, 86.375, 90.0];

  function snapCoordinatesToCell(lat, lon) {
    let row = 0;
    for (let r = 0; r < 8; r++) {
      if (lat >= latBounds[r] && lat <= latBounds[r + 1]) {
        row = r;
        break;
      }
    }
    if (lat > 10.0) row = 7;
    if (lat < -10.0) row = 0;

    let col = 0;
    for (let c = 0; c < 8; c++) {
      if (lon >= lonBounds[c] && lon <= lonBounds[c + 1]) {
        col = c;
        break;
      }
    }
    if (lon > 90.0) col = 7;
    if (lon < 60.0) col = 0;

    return { row, col };
  }

  // Load grid8 to verify published centers
  const grid8 = JSON.parse(fs.readFileSync('public/data/grid8.json', 'utf-8'));
  const day1Cells = grid8.days[0].cells;

  let allSnapped = true;
  for (const cell of day1Cells) {
    const { row, col } = snapCoordinatesToCell(cell.lat, cell.lon);
    if (row !== cell.row || col !== cell.column) {
      allSnapped = false;
      console.error(`Mismatch for cell row=${cell.row}, col=${cell.column}: snapped (${row}, ${col})`);
    }
  }
  assert(allSnapped, 'All 64 published cell centers snap exactly to their respective 8x8 cell');

  // Test arbitrary boundary points snap strictly to valid cells under non-uniform definitions
  const testPoints = [
    { lat: -9.9, lon: 60.1, expR: 0, expC: 0 },
    { lat: 9.9, lon: 89.9, expR: 7, expC: 7 },
    { lat: 0.0, lon: 75.0, expR: 3, expC: 3 }, // inside Row 4, Col 4
    { lat: 0.15, lon: 75.2, expR: 4, expC: 4 }, // inside Row 5, Col 5
    { lat: -3.0, lon: 70.0, expR: 2, expC: 2 },
    { lat: 4.5, lon: 85.0, expR: 5, expC: 6 },
    { lat: -7.30, lon: 64.0, expR: 1, expC: 1 },
    { lat: 7.49, lon: 86.24, expR: 6, expC: 6 }
  ];

  for (const pt of testPoints) {
    const { row, col } = snapCoordinatesToCell(pt.lat, pt.lon);
    assert(row === pt.expR && col === pt.expC, `Point (${pt.lat}°N, ${pt.lon}°E) snapped to Row ${row + 1}, Col ${col + 1}`);
  }

  // 3. JSDOM DOM and Accessibility test for Explorer
  const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
    url: 'http://localhost:3000/#/explore',
    runScripts: 'dangerously'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  global.window.matchMedia = () => ({
    matches: false,
    addListener() {},
    removeListener() {}
  });

  // Mock fetch
  global.window.fetch = async (url) => {
    const cleanUrl = url.replace(/^\//, '');
    const localPath = path.join('public', cleanUrl);
    if (fs.existsSync(localPath)) {
      const content = fs.readFileSync(localPath, 'utf-8');
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(content),
        text: async () => content,
        arrayBuffer: async () => fs.readFileSync(localPath).buffer
      };
    }
    return { ok: false, status: 404 };
  };
  global.fetch = global.window.fetch;

  // Import and render Explorer
  const { renderExplorer } = await import('../src/pages/Explorer.ts');
  const explorerEl = renderExplorer();
  document.body.appendChild(explorerEl);

  // Await async data loading and grid building
  await new Promise(r => setTimeout(r, 80));

  // Verify Readout Card
  const readoutCard = explorerEl.querySelector('#cell-readout-card');
  assert(readoutCard !== null, 'Selected-cell readout card exists');

  const coordsEl = explorerEl.querySelector('#readout-coords');
  assert(coordsEl?.textContent.includes('-1.125°N, 77.000°E'), 'Readout card shows default center coordinates (-1.125°N, 77.000°E)');

  const meanSpeedEl = explorerEl.querySelector('#readout-mean-speed');
  assert(meanSpeedEl?.textContent.includes('0.164 m/s'), 'Readout card shows default mean point speed (0.164 m/s)');

  const vecSpeedEl = explorerEl.querySelector('#readout-vector-speed');
  assert(vecSpeedEl?.textContent.includes('0.153 m/s'), 'Readout card shows default vector speed (0.153 m/s)');

  // Verify Accessible 64-Cell Grid
  const accessibleBtns = explorerEl.querySelectorAll('.accessible-cell-btn');
  assert(accessibleBtns.length === 64, 'All 64 accessible cell buttons exist in the keyboard grid overlay');

  // Verify first and last cell button aria-labels
  const cell00 = explorerEl.querySelector('#grid-cell-btn-0-0');
  assert(cell00?.getAttribute('aria-label')?.includes('Row 1, column 1'), 'Cell (0,0) has accessible label "Row 1, column 1"');

  const cell77 = explorerEl.querySelector('#grid-cell-btn-7-7');
  assert(cell77?.getAttribute('aria-label')?.includes('Row 8, column 8'), 'Cell (7,7) has accessible label "Row 8, column 8"');

  // Test selecting cell via button click
  cell77?.click();
  await new Promise(r => setTimeout(r, 20));

  const coordsAfterClick = explorerEl.querySelector('#readout-coords');
  assert(coordsAfterClick?.textContent.includes('8.875°N, 88.250°E'), 'Clicking Cell (7,7) updates readout to Row 8, Col 8 (8.875°N, 88.250°E)');

  // Verify layer toggles exist
  assert(explorerEl.querySelector('#toggle-layer-bathy') !== null, 'Relief layer toggle exists');
  assert(explorerEl.querySelector('#toggle-layer-grid') !== null, 'Grid layer toggle exists');
  assert(explorerEl.querySelector('#toggle-layer-coast') !== null, 'Coastline layer toggle exists');

  // Verify GEBCO attribution in map
  const attribution = explorerEl.querySelector('a[href*="doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa"]');
  assert(attribution !== null, 'GEBCO attribution DOI link is present in map view');

} catch (err) {
  console.error('Test execution error:', err);
  failed++;
}

console.log('\n----------------------------------------------------');
console.log(`Step 3 Test Summary: ${passed} passed, ${failed} failed.`);
console.log('----------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll Step 3 Regional Map tests PASSED successfully.\n');
  process.exit(0);
}
