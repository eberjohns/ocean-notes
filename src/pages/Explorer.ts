export function renderExplorer(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'explorer-view';
  page.style.cssText = 'display: flex; flex-direction: column; flex: 1; min-height: calc(100vh - var(--header-height)); position: relative;';

  page.innerHTML = `
    <!-- Top Overlay / Context Scrim (Mockup Fix #5) -->
    <div style="padding: var(--space-4) var(--gutter); background: linear-gradient(to bottom, rgba(6,19,31,0.9), rgba(6,19,31,0)); z-index: 10;">
      <div style="max-width: var(--max-width); margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4);">
        <div>
          <span class="text-muted" style="font-size: var(--t-small); text-transform: uppercase; letter-spacing: 0.05em;">
            Regional Explorer
          </span>
          <h1 style="font-size: var(--t-h2); line-height: 1.1;">Indian Ocean</h1>
          <p class="font-mono text-muted" style="font-size: var(--t-small);">10° S – 10° N · 60° E – 90° E</p>
        </div>

        <!-- Live Caption (WCAG 2.2 Polite ARIA Live Region) -->
        <div id="live-caption" class="polite-caption" aria-live="polite" aria-atomic="true"
             style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-4); max-width: 500px; font-size: var(--t-small);">
          <span style="color: var(--accent); font-weight: 600;">October 1, 2026:</span>
          <span>Waiting for play gesture. Currents active across equatorial band.</span>
        </div>
      </div>
    </div>

    <!-- Main Viewport Area (Three.js Mount Point for Step 3 & 6) -->
    <div id="explorer-viewport" style="flex: 1; min-height: 480px; background: #06131F; position: relative; display: flex; align-items: center; justify-content: center;"
         role="region" aria-label="Interactive Ocean Surface Currents Map">
      
      <!-- Visual Placeholder / Scrim for Step 1 -->
      <div style="text-align: center; max-width: 600px; padding: var(--space-6); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); margin: var(--space-4);">
        <h2 style="font-size: var(--t-h3); margin-bottom: var(--space-2);">Regional Map & Particle Surface</h2>
        <p class="text-muted" style="font-size: var(--t-small); margin-bottom: var(--space-4);">
          Foundation shell ready. Step 3 renders the lit GEBCO 3D relief surface and 8×8 grid; Step 6 introduces high-resolution current particles from <code class="font-mono">fine-uv.bin</code>.
        </p>
        <div style="display: inline-flex; gap: var(--space-3); font-size: var(--t-small);" class="font-mono">
          <span style="padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">64 Cells (8×8)</span>
          <span style="padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">9,801 Fine Points</span>
          <span style="padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">110 BPM (4:30)</span>
        </div>
      </div>

      <!-- 8x8 Accessible Grid Navigation Placeholder (WCAG Flow C) -->
      <div id="map-accessible-grid" tabindex="0" role="grid" aria-label="8 by 8 Ocean Current Cells Grid" class="sr-only">
        <!-- Will be populated with 64 accessible cells in Step 3 -->
      </div>
    </div>

    <!-- Transport & Timeline Bar (Pinned to Bottom) -->
    <div style="background: var(--surface); border-top: 1px solid var(--border); padding: var(--space-3) var(--gutter); z-index: 10;">
      <div style="max-width: var(--max-width); margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4);">
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <button type="button" class="btn btn-primary" id="btn-transport-play" aria-label="Play October 2026 Ocean Composition">
            <span aria-hidden="true">▶</span> Play
          </button>
          <button type="button" class="btn btn-secondary" id="btn-transport-prev" aria-label="Previous Day">
            ◀
          </button>
          <button type="button" class="btn btn-secondary" id="btn-transport-next" aria-label="Next Day">
            ▶
          </button>
          <span class="font-mono" style="font-size: var(--t-small); margin-left: var(--space-2);">
            Oct 01, 2026 (Day 1 of 31)
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <span class="font-mono text-muted" style="font-size: var(--t-small);">0:00 / 4:30</span>
          <a href="#/lab" class="btn btn-secondary" style="font-size: var(--t-small);">Open in Lab</a>
        </div>
      </div>
    </div>
  `;

  return page;
}
