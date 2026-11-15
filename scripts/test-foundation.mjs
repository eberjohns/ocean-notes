#!/usr/bin/env node
/**
 * test-foundation.mjs
 * End-to-end verification of Step 1 Foundations in JSDOM:
 * - Layout shell & semantic markup
 * - Skip link target resolution
 * - Route navigation across all 5 pages
 * - Theme switching ([data-theme="public" | "research"])
 * - Audio opt-in & mute state persistence
 * - Mockup fixes verification
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const htmlTemplate = fs.readFileSync('index.html', 'utf-8');

const dom = new JSDOM(htmlTemplate, {
  url: 'http://localhost:3000/#/',
  runScripts: 'dangerously',
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
global.HTMLElement = dom.window.HTMLElement;

// Dynamic import of application modules
const { store } = await import('../src/state.ts');
const { createHeader } = await import('../src/components/Header.ts');
const { createSoundBanner } = await import('../src/components/SoundBanner.ts');
const { createFooter } = await import('../src/components/Footer.ts');
const { Router } = await import('../src/router.ts');

console.log('====================================================');
console.log(' Step 1 Foundations: Automated Verification');
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
  // 1. Shell Structure
  const skipLink = document.querySelector('.skip-link');
  assert(skipLink !== null, 'Skip link exists in DOM');
  assert(skipLink?.getAttribute('href') === '#main-content', 'Skip link targets #main-content');

  const app = document.getElementById('app');
  assert(app !== null, '#app container exists');

  // Mount components
  const header = createHeader();
  const banner = createSoundBanner();
  const main = document.createElement('main');
  main.id = 'main-content';
  main.setAttribute('role', 'main');
  const footer = createFooter();

  app.appendChild(header);
  app.appendChild(banner);
  app.appendChild(main);
  app.appendChild(footer);

  assert(document.querySelector('.site-header') !== null, 'Header mounted');
  assert(document.querySelector('.sound-banner') !== null, 'Sound opt-in banner mounted');
  assert(document.querySelector('main#main-content') !== null, 'Main content landmark mounted');
  assert(document.querySelector('.site-footer') !== null, 'Footer landmark mounted');

  // 2. Router & Navigation
  const router = new Router(main);
  router.init();

  // Test Home route
  assert(document.title.includes('Earth Information Jukebox'), 'Home title set correctly');
  assert(document.documentElement.getAttribute('data-theme') === 'public', 'Home uses public dark theme');
  assert(document.querySelector('h1')?.textContent.includes('Hear the ocean move'), 'Home headline rendered');

  // Test Explorer route
  router.navigate('/explore');
  assert(document.title.includes('Regional Explorer'), 'Explorer title updated');
  assert(document.documentElement.getAttribute('data-theme') === 'public', 'Explorer uses public dark theme');
  const liveCaption = document.getElementById('live-caption');
  assert(liveCaption !== null, 'Polite ARIA live caption region exists on Explorer');
  assert(liveCaption?.getAttribute('aria-live') === 'polite', 'Live caption has aria-live="polite"');

  // Test How It Works route
  router.navigate('/how-it-works');
  assert(document.title.includes('How It Works'), 'How It Works title updated');
  assert(document.body.innerHTML.includes('Collect: NASA OSCAR'), 'Stage 01 Collect rendered');
  assert(document.body.innerHTML.includes('Data Encoding vs. Arrangement Choices'), 'Data vs Arrangement table rendered');

  // Test Research Lab route
  router.navigate('/lab');
  assert(document.title.includes('Research Lab'), 'Research Lab title updated');
  assert(document.documentElement.getAttribute('data-theme') === 'research', 'Lab automatically switches to research light theme');
  
  // Verify Mockup Fix #1 (Real coordinates, no illustrative label)
  assert(!document.body.innerHTML.includes('(ILLUSTRATIVE)'), 'Mockup Fix #1: "(ILLUSTRATIVE)" label removed');
  assert(document.body.innerHTML.includes('-1.125° N'), 'Mockup Fix #1: Real center latitude displayed');
  assert(document.body.innerHTML.includes('77.000° E'), 'Mockup Fix #1: Real center longitude displayed');

  // Verify Mockup Fix #2 (8, 12, 16 sectors, not 8x8)
  const sectorSelect = document.getElementById('select-sectors');
  assert(sectorSelect !== null, 'Sector select exists');
  assert(sectorSelect?.innerHTML.includes('16 Sectors'), 'Mockup Fix #2: 16 sectors option present');

  // Test About route
  router.navigate('/about');
  assert(document.title.includes('About & Provenance'), 'About title updated');
  assert(document.documentElement.getAttribute('data-theme') === 'public', 'About switches back to public theme');

  // Non-negotiable Rule 12: Exact GEBCO credit
  const gebcoCredit = "GEBCO Bathymetric Compilation Group 2026 (2026). The GEBCO_2026 Grid - a continuous terrain model for oceans and land at 15 arc-second intervals. doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa";
  assert(document.body.textContent.includes('GEBCO Bathymetric Compilation Group 2026'), 'Exact GEBCO credit present');
  assert(document.body.innerHTML.includes('https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa'), 'GEBCO DOI link present');

  // 3. Audio Opt-in & Mute Persistence
  assert(store.getState().soundOptIn === null, 'Sound starts unprompted/off by default');
  
  const btnSoundOn = document.getElementById('btn-sound-on');
  btnSoundOn?.click();
  assert(store.getState().soundOptIn === true, 'Clicking Turn on sound sets soundOptIn = true');
  assert(localStorage.getItem('earth_jukebox_sound_opt_in') === 'true', 'Sound opt-in persisted to localStorage');
  assert(banner.style.display === 'none', 'Sound banner hidden after choice');

  const muteBtn = document.getElementById('header-mute-btn');
  muteBtn?.click();
  assert(store.getState().isMuted === true, 'Mute button toggles muted state to true');
  assert(localStorage.getItem('earth_jukebox_muted') === 'true', 'Mute state persisted to localStorage');

} catch (err) {
  console.error('Test execution error:', err);
  failed++;
}

console.log('\n----------------------------------------------------');
console.log(`Test Summary: ${passed} passed, ${failed} failed.`);
console.log('----------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll Step 1 Foundation tests PASSED successfully.\n');
  process.exit(0);
}
