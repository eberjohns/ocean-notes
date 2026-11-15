# Architectural & Implementation Decision Log

This log records technical, design, and structural decisions made during implementation where the specification left choices open or required specific operational decisions.

## Decision 1: Application Architecture & Framework
- **Date**: 2026-11-15
- **Choice**: Vite with Vanilla TypeScript + Modular Component Architecture (no heavy frontend framework).
- **Rationale**: The specification permits vanilla TypeScript, Svelte, or React. Vanilla TypeScript provides zero runtime overhead, deterministic rendering, zero external framework dependency vulnerability, instant build times, and easiest integration with Three.js rendering loops and Web Audio scheduling.
- **Impact**: Clean, lightweight bundle size well under the 2.5 MB first-load performance budget.

## Decision 2: Routing Strategy
- **Date**: 2026-11-15
- **Choice**: Client-side hash/history router supporting `/`, `/explore`, `/how-it-works`, `/lab`, and `/about`.
- **Rationale**: For static site deployment (GitHub Pages / static hosts), hash routing (with clean fallback) avoids 404 errors on direct reloads without requiring server rewrite configuration.
- **Impact**: Guaranteed 100% compatibility across any static hosting platform.

## Decision 3: Fonts & Pending Asset Strategy
- **Date**: 2026-11-15
- **Choice**: Self-hosted font declarations with high-quality system font fallback stack (`Sora, system-ui, sans-serif`, `Inter, system-ui, sans-serif`, `IBM Plex Mono, ui-monospace, monospace`). Fonts configured with `font-display: swap`.
- **Rationale**: The prompt strictly forbids external CDNs (no Google Fonts). The true woff2 binaries are currently missing from the repository; system font stacks ensure the layout renders crisply with zero external network calls while awaiting physical font binary assets.

## Decision 4: Theme Tokens & Contrast Enforcement
- **Date**: 2026-11-15
- **Choice**: Standard CSS custom properties scoped to `:root` (Public Dark theme) and `[data-theme="research"]` (Research Light theme). Contrast verification automated via `scripts/contrast.mjs` checking both themes against WCAG 2.2 AA (4.5:1 text, 3:1 UI).
- **Impact**: All text and UI components guaranteed compliant before build.

## Decision 5: Official Project Naming
- **Date**: 2026-11-15
- **Choice**: Project officially branded as "Ocean Notes".
- **Rationale**: User directive prior to Step 2 implementation. All UI titles, headers, footers, meta descriptions, and documentation updated consistently to reflect "Ocean Notes".


## Decision 6: Derived Cell Speed Metric
- **Date**: 2026-11-15
- **Choice**: For all sonification and 8×8 readouts, cell speed represents the mean of point speeds $\frac{1}{N}\sum \sqrt{u_i^2+v_i^2}$ rather than vector mean speed $\sqrt{\bar{u}^2+\bar{v}^2}$.
- **Rationale**: Vector averaging cancels opposing flow in shear zones and understates kinetic energy. Directional coherence is explicitly tracked as $|\vec{V}_{mean}| / \bar{S}_{point}$.

## Decision 7: Shaded Relief & Normal Map Asset Pipeline
- **Date**: 2026-11-15
- **Choice**: The raw 11.5 MB height PNG and 14.2 MB normal PNG are kept in `/data` and never shipped to client. Generated `relief-2048.webp` (79 KB), `height-1024.png` (223 KB), `normal-1024.webp` (285 KB), and `coast.json` (8.5 KB) via `scripts/build-relief.py`.
- **Rationale**: Strict compliance with <250 KB color texture, <800 KB height texture, and <1 MB normal texture limits. Coastlines derive directly from the 0 m elevation contour without third-party coastline files.

## Decision 8: WebGL Fallback and Keyboard Grid Decoupling
- **Date**: 2026-11-15
- **Choice**: The 64-cell accessible keyboard navigation grid is rendered into the DOM independently of the Three.js WebGL canvas.
- **Rationale**: Guarantees that users without WebGL or in assistive tech environments retain full keyboard navigation and screen reader parity, while modern GPUs get the 3D lit bathymetry relief surface.
