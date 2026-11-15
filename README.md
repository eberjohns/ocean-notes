# Ocean Notes 🌊🎵

> **NASA Space Apps Challenge 2026**  
> *An evolving, data-driven orchestral interpretation of real ocean-surface currents and seabed bathymetry across the tropical Indian Ocean.*

[![Deploy Ocean Notes to GitHub Pages](https://github.com/eberjohns/ocean-notes/actions/workflows/deploy.yml/badge.svg)](https://github.com/eberjohns/ocean-notes/actions/workflows/deploy.yml)
[![WCAG 2.2 AA](https://img.shields.io/badge/accessibility-WCAG%202.2%20AA-success)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Three.js](https://img.shields.io/badge/3D-Three.js-blue)](https://threejs.org/)
[![Web Audio API](https://img.shields.io/badge/sound-Web%20Audio%20API-informational)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

**Live Demo**: [https://eberjohns.github.io/ocean-notes/](https://eberjohns.github.io/ocean-notes/)

---

## 📖 Overview

**Ocean Notes** turns satellite-derived physical ocean data into a 4½-minute data-driven composition. Focusing on the tropical Indian Ocean ($10^\circ\text{S} - 10^\circ\text{N}$, $60^\circ\text{E} - 90^\circ\text{E}$) across the 31 days of October 2026, the application pairs an interactive 3D bathymetric relief map and hydrodynamic flow streamlines with a polyphonic Web Audio synthesizer.

Every musical note, harmonic interval, and stereo position is mapped directly from physical measurements—no sound exists without a visible numerical counterpart.

---

## 🤖 Super Intelligence (SI) & AI Assistance Disclosure

In accordance with the **NASA Space Apps Challenge Super Intelligence Policy**, AI tools were utilized to accelerate innovation, technical architecture, and creative sonification:

### 🛠️ Tools Utilized
- **Anthropic Claude** (System architecture, scientific validation, accessible UI design)
- **OpenAI ChatGPT** (Synthesizer voice modeling, algorithmic mappings, data structuring)
- **Google Antigravity** (Full-stack TypeScript implementation, WebGL shader pipelines, automated testing)

### 📌 Specific Application Areas
1. **Images & Visual Assets**:
   - The planetary horizon visual on the Home page was generated with AI assistance.
   - It bears an explicit, visible **`SI-Generated`** watermark badge in the user interface.
   - **Compliance Guarantee**: The image does not contain, modify, or use any NASA logos, flags, meatballs, worms, or mission identifiers.
2. **Audio & Musical Synthesis**:
   - The Web Audio synthesizer node graph, additive harmonics, envelope filters, and polyphonic voice limiter (16 voices) were designed and verified with AI assistance.
   - Described in metadata (`public/data/meta.json`) and acknowledged across application text.
3. **Code & Data Processing**:
   - The offline data processing pipeline (`scripts/build-data.py`), little-endian Int16 binary decoder (`src/data/loader.ts`), Three.js GLSL boundary shaders, and automated test suite (300+ assertions) were authored with AI assistance.

---

## 🌟 Key Features

### 1. 3D Regional Map & Hydrodynamic Flow (Three.js)
- **Interactive Map Controls**: Full pan ($X$ and $Y$), zoom (mouse wheel / pinch), and tilt (right-drag / two-finger) powered by bounded `OrbitControls`.
- **Vertical Seabed Relief**: Physical displacement ($2.2\times$ scale) highlighting the Carlsberg Ridge, Chagos-Laccadive Plateau, and Ninety East Ridge with directional grazing sunlight.
- **Ocean Water Overlay**: Glistening physical water layer with depth attenuation ($z = 0.08$) allowing landmasses (India, Sri Lanka, Southeast Asia) to rise naturally above sea level.
- **Current Flow Contours (Streamlines)**: Continuous hydrodynamic flow lines calculated by bilinear velocity interpolation and smoothed with Catmull-Rom splines.
- **Seamless Boundary Blending**: Custom GLSL edge-feathering that smoothly dissolves the regional map boundaries into deep ocean navy (`#06131F`).
- **Camera Perspective Presets**: One-click toggle between **3D Angle**, **Top-Down (2D)**, and **Focus Cell**.

### 2. Native Web Audio Synthesizer (No External Samples)
- **Zero Sound Files**: 100% synthesized in real time using the browser's native Web Audio API.
- **Four Distinct Voices**:
  - **Pad**: Ambient chordal texture modulated by regional kinetic energy.
  - **Lead**: Melodic voice tracking the daily dominant current vector.
  - **Pulse**: Rhythmic arpeggiation reflecting fine-scale flow variations.
  - **Bass**: Deep sub-oscillator grounded in equatorial bathymetry.
- **Deterministic Musical Mappings**:
  - **Flow Direction ($\theta$)** $\to$ Pitch class ($16$ compass sectors, 2 octaves).
  - **Latitude ($\phi$)** $\to$ Register (South = lower octaves, North = higher octaves).
  - **Current Speed ($S$)** $\to$ Loudness and note density (square-root energy curve).
  - **Longitude ($\lambda$)** $\to$ Stereo pan (West = left channel, East = right channel).
  - **Directional Coherence ($C$)** $\to$ Harmonic density (consonant vs. dissonant).
- **Scale Selection**: Supports Dorian (default), Pentatonic, and Whole Tone modal systems.
- **Polite Interaction**: Sound is off by default and only activates upon explicit user action.

### 3. Audio-Clock Transport & Accessibility
- **Authoritative Timing**: Uses `AudioContext.currentTime` as the single source of truth for clock synchronization, preventing audio-visual drift.
- **Timeline Scrubber**: Scrub across all 31 days with instant audio flush to prevent voice collisions.
- **Screen Reader Telemetry**: ARIA `aria-live="polite"` live captions dynamically announce the date, dominant cell coordinates, velocity, and musical note.
- **Full Keyboard Navigation**: Interactive 64-cell grid navigable via Arrow keys, `Home`, and `End` (WCAG 2.2 AA compliant).
- **Dual Visual Modes**: Public (Dark deep ocean navy) and Research Lab (High-contrast analytical paper theme).

---

## 🔬 Scientific Datasets & Provenance

| Dataset | Provider | Temporal / Spatial Scope | Citation / DOI |
|---|---|---|---|
| **OSCAR L4 Near-Real-Time Currents v2.0** | NASA PO.DAAC | Oct 1–31, 2026<br>$0.25^\circ$ grid ($81 \times 121$) | [doi:10.5067/OSCAR-25N20](https://doi.org/10.5067/OSCAR-25N20) |
| **GEBCO 2026 Bathymetry Grid** | GEBCO Compilation Group | Global 15 arc-sec elevation | [doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa](https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Python 3.10+ (for raw data reprocessing)

### Installation
```bash
git clone https://github.com/eberjohns/ocean-notes.git
cd ocean-notes
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run Automated Tests
```bash
npm test
```
Runs the full verification suite (WCAG 2.2 contrast checks, foundation tests, 8×8 numerical validation, Three.js map checks, audio synthesis tests, and transport timing tests).

### Production Build
```bash
npm run build
```
Generates optimized static assets in `dist/` ready for GitHub Pages or static web servers.

---

## 📁 Repository Structure

```
ocean-notes/
├── .github/workflows/deploy.yml   # GitHub Actions automated Pages deployment
├── data/                          # Source datasets & metadata
│   ├── indian_ocean_october_2026.json
│   ├── fine-uv.bin               # 31 x 2 x 81 x 121 Int16 binary array
│   └── meta.json
├── public/                        # Static web assets
│   ├── data/                     # Optimized web datasets (grid8.json, coast.json, textures)
│   ├── fonts/                    # Self-hosted typography (Sora, Inter, IBM Plex Mono)
│   ├── Indian Ocean Earth Horizon.png # SI-generated visual asset
│   └── icon.svg                  # Ocean Resonance official logo
├── scripts/
│   ├── build-data.py             # Offline data extraction & downsampling pipeline
│   ├── contrast.mjs              # WCAG 2.2 AA color contrast verifier
│   └── test-*.mjs                # Automated test suites
├── src/
│   ├── audio/                    # Web Audio synthesis & transport engine
│   ├── components/               # Header, Footer, SoundBanner, 3D visualizers
│   │   ├── visualizer/ReliefMap.ts # Three.js 3D bathymetry & currents map
│   │   └── effects/EarthHaze.ts   # Atmospheric glow & mist shader
│   ├── data/loader.ts            # Int16 binary decoder & dataset loader
│   ├── pages/                    # Home, Explorer, HowItWorks, Lab, About
│   └── styles/                   # Design tokens, themes & layout CSS
└── vite.config.ts                # Vite bundler configuration
```

---

## 📄 License & Attribution

- **Application Code**: MIT License.
- **Ocean Current Data**: Courtesy of NASA PO.DAAC / Earthdata.
- **Bathymetry Data**: GEBCO Compilation Group (2026). The GEBCO_2026 Grid ([doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa](https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa)).
- **Typography**: Sora, Inter, and IBM Plex Mono licensed under the SIL Open Font License (OFL 1.1).
