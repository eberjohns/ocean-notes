#!/usr/bin/env node
/**
 * contrast.mjs
 * WCAG 2.2 AA Contrast Verification Script for Earth Information Jukebox.
 * Verifies all text and UI color pairs across Public (dark) and Research (light) themes.
 * Fails build (process.exit(1)) if any pair misses the required threshold:
 * - Normal text: 4.5:1
 * - Large text / UI elements & focus rings: 3.0:1
 */

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

// Alpha blend color onto background
function blendRgbaOnHex(r, g, b, a, bgHex) {
  const bg = hexToRgb(bgHex);
  const outR = Math.round(r * a + bg.r * (1 - a));
  const outG = Math.round(g * a + bg.g * (1 - a));
  const outB = Math.round(b * a + bg.b * (1 - a));
  return `#${outR.toString(16).padStart(2, '0')}${outG.toString(16).padStart(2, '0')}${outB.toString(16).padStart(2, '0')}`;
}

// Tokens from Phase 5 Spec (Section 4)
const publicTheme = {
  name: 'Public (Dark)',
  bg: '#06131F',
  // surface is #103C4A at 70% opacity over #06131F
  surfaceEff: blendRgbaOnHex(16, 60, 74, 0.70, '#06131F'),
  surfaceSolid: '#103C4A',
  surface2: '#176D78',
  text: '#E7F1ED',
  textMuted: '#9FB8B3',
  accent: '#6BE1D0',
  focus: '#FFD166',
};

const researchTheme = {
  name: 'Research (Light)',
  bg: '#F6F1E7',
  surface: '#FFFFFF',
  surface2: '#EAE3D3',
  text: '#14212B',
  textMuted: '#4A5963',
  accent: '#B4541A',
  accentText: '#AE4F16', // slightly adjusted for strict 4.5:1 text on paper if used for body text
  focus: '#0B5FFF',
};

const checks = [
  // Public Theme Checks
  { theme: publicTheme.name, role: 'Normal Text', fg: publicTheme.text, bg: publicTheme.bg, min: 4.5, desc: '--text on --bg' },
  { theme: publicTheme.name, role: 'Normal Text', fg: publicTheme.text, bg: publicTheme.surfaceEff, min: 4.5, desc: '--text on --surface (blended)' },
  { theme: publicTheme.name, role: 'Normal Text', fg: publicTheme.text, bg: publicTheme.surfaceSolid, min: 4.5, desc: '--text on solid --surface' },
  { theme: publicTheme.name, role: 'Normal Text', fg: publicTheme.text, bg: publicTheme.surface2, min: 4.5, desc: '--text on --surface-2' },
  { theme: publicTheme.name, role: 'Muted Text', fg: publicTheme.textMuted, bg: publicTheme.bg, min: 4.5, desc: '--text-muted on --bg' },
  { theme: publicTheme.name, role: 'Muted Text', fg: publicTheme.textMuted, bg: publicTheme.surfaceEff, min: 4.5, desc: '--text-muted on --surface (blended)' },
  { theme: publicTheme.name, role: 'Muted Text', fg: publicTheme.textMuted, bg: publicTheme.surfaceSolid, min: 4.5, desc: '--text-muted on solid --surface' },
  { theme: publicTheme.name, role: 'UI / Large Accent', fg: publicTheme.accent, bg: publicTheme.bg, min: 3.0, desc: '--accent on --bg (UI / display)' },
  { theme: publicTheme.name, role: 'UI / Large Accent', fg: publicTheme.accent, bg: publicTheme.surfaceEff, min: 3.0, desc: '--accent on --surface (UI / display)' },
  { theme: publicTheme.name, role: 'UI Focus Ring', fg: publicTheme.focus, bg: publicTheme.bg, min: 3.0, desc: '--focus on --bg' },
  { theme: publicTheme.name, role: 'UI Focus Ring', fg: publicTheme.focus, bg: publicTheme.surfaceEff, min: 3.0, desc: '--focus on --surface' },

  // Research Theme Checks
  { theme: researchTheme.name, role: 'Normal Text', fg: researchTheme.text, bg: researchTheme.bg, min: 4.5, desc: '--text on --bg' },
  { theme: researchTheme.name, role: 'Normal Text', fg: researchTheme.text, bg: researchTheme.surface, min: 4.5, desc: '--text on --surface' },
  { theme: researchTheme.name, role: 'Normal Text', fg: researchTheme.text, bg: researchTheme.surface2, min: 4.5, desc: '--text on --surface-2' },
  { theme: researchTheme.name, role: 'Muted Text', fg: researchTheme.textMuted, bg: researchTheme.bg, min: 4.5, desc: '--text-muted on --bg' },
  { theme: researchTheme.name, role: 'Muted Text', fg: researchTheme.textMuted, bg: researchTheme.surface, min: 4.5, desc: '--text-muted on --surface' },
  { theme: researchTheme.name, role: 'Muted Text', fg: researchTheme.textMuted, bg: researchTheme.surface2, min: 4.5, desc: '--text-muted on --surface-2' },
  { theme: researchTheme.name, role: 'UI / Button Accent', fg: researchTheme.accent, bg: researchTheme.bg, min: 3.0, desc: '--accent on --bg (buttons / UI)' },
  { theme: researchTheme.name, role: 'UI / Button Accent', fg: researchTheme.accent, bg: researchTheme.surface, min: 3.0, desc: '--accent on --surface (buttons / UI)' },
  { theme: researchTheme.name, role: 'Text Accent', fg: researchTheme.accentText, bg: researchTheme.bg, min: 4.5, desc: '--accent-text on --bg (links)' },
  { theme: researchTheme.name, role: 'UI Focus Ring', fg: researchTheme.focus, bg: researchTheme.bg, min: 3.0, desc: '--focus on --bg' },
  { theme: researchTheme.name, role: 'UI Focus Ring', fg: researchTheme.focus, bg: researchTheme.surface, min: 3.0, desc: '--focus on --surface' },
];

console.log('====================================================');
console.log(' WCAG 2.2 AA Contrast Verification Script');
console.log('====================================================\n');

let failed = 0;
let passed = 0;

for (const c of checks) {
  const ratio = contrastRatio(c.fg, c.bg);
  const ok = ratio >= c.min;
  const status = ok ? 'PASS' : 'FAIL';
  if (ok) passed++; else failed++;

  const ratioStr = ratio.toFixed(2) + ':1';
  console.log(
    `[${status}] ${c.theme.padEnd(16)} | ${c.role.padEnd(18)} | ` +
    `${c.desc.padEnd(32)} | Got ${ratioStr.padStart(7)} (Req: ${c.min}:1)`
  );
}

console.log('\n----------------------------------------------------');
console.log(`Results: ${passed} passed, ${failed} failed.`);
console.log('----------------------------------------------------');

if (failed > 0) {
  console.error('\nContrast verification FAILED. Fix token definitions before building.\n');
  process.exit(1);
} else {
  console.log('\nAll color tokens meet WCAG 2.2 AA requirements.\n');
  process.exit(0);
}

