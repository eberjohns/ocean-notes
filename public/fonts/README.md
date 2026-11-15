# Self-Hosted Font Assets Directory

According to **Non-Negotiable Rule 1** and **Locked Decisions**:
- Fonts must be self-hosted, Latin subset, with `font-display: swap`.
- No runtime external CDN dependencies (e.g., Google Fonts) or remote tracking are permitted.
- The CSS token architecture uses high-fidelity system font fallbacks (`Sora, system-ui, -apple-system, sans-serif`, `Inter, system-ui, sans-serif`, and `IBM Plex Mono, ui-monospace, monospace`) so the entire layout renders cleanly offline.

## Required Physical Files:
1. `sora-latin.woff2` (Weights: 500, 600)
2. `inter-latin.woff2` (Weights: 400, 500)
3. `ibm-plex-mono-latin.woff2` (Weights: 500)

Status: **Pending Asset Acquisition** (identified during initial inspection).
