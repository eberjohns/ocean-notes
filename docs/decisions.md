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


