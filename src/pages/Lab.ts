export function renderLab(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'content-container';

  page.innerHTML = `
    <header class="page-hero">
      <span class="text-muted" style="text-transform: uppercase; letter-spacing: 0.05em; font-size: var(--t-small); font-weight: 600;">
        Analytical Inspection Environment
      </span>
      <h1 class="page-title">Research Lab</h1>
      <p class="page-lead">
        Inspect exact numerical values, verify data-to-sound mappings, and trace any note back to its containing 8×8 cell, timestamp, and velocity components.
      </p>
    </header>

    <!-- 3-Column Analytical Dashboard -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-12);">
      
      <!-- Column 1: Controls & Parameters -->
      <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="lab-controls-title">
        <h2 id="lab-controls-title" style="font-size: var(--t-h3); margin-bottom: var(--space-4);">Data & Mapping Controls</h2>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-4);">
          <div>
            <label for="select-dataset" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">Dataset</label>
            <select id="select-dataset" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
              <option selected>NASA OSCAR L4 v2.0 (Near Real-Time)</option>
            </select>
          </div>

          <div>
            <label for="select-date" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">Date</label>
            <select id="select-date" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
              <option value="2026-10-01" selected>October 1, 2026</option>
              <option value="2026-10-12">October 12, 2026</option>
              <option value="2026-10-31">October 31, 2026</option>
            </select>
          </div>

          <div>
            <label for="select-cell" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">Selected Cell (Audio 8×8)</label>
            <!-- UI rows are 1-based, Row 1 at South (-8.75°), Row 8 at North (+8.875°) -->
            <select id="select-cell" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
              <option value="4-5" selected>Row 4 × Column 5 (-1.125°N, 77.000°E)</option>
              <option value="1-1">Row 1 × Column 1 (-8.750°N, 61.875°E)</option>
              <option value="8-8">Row 8 × Column 8 (+8.875°N, 88.250°E)</option>
            </select>
          </div>

          <!-- Mockup Fix #2: 8, 12 or 16 sectors (default 16), not 8x8 -->
          <div>
            <label for="select-sectors" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">Compass Sectors (Audio Mapping)</label>
            <select id="select-sectors" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
              <option value="16" selected>16 Sectors (22.5° each - Default)</option>
              <option value="12">12 Sectors (30° each)</option>
              <option value="8">8 Sectors (45° each)</option>
            </select>
          </div>

          <div>
            <label for="select-scale" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">Musical Scale</label>
            <select id="select-scale" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
              <option value="dorian" selected>Dorian (D E F G A B C - Default)</option>
              <option value="pentatonic">Pentatonic (C D E G A)</option>
              <option value="wholetone">Whole Tone (C D E F# G# A#)</option>
            </select>
          </div>

          <button type="button" class="btn btn-primary" id="btn-preview-cell" style="margin-top: var(--space-2); gap: var(--space-2);">
            <span aria-hidden="true">▶</span>
            <span>Preview Sound for Selected Cell</span>
          </button>

          <div style="display: flex; gap: var(--space-3); margin-top: var(--space-2);">
            <button type="button" class="btn btn-secondary" style="flex: 1; font-size: var(--t-small);">Export CSV</button>
            <button type="button" class="btn btn-secondary" style="flex: 1; font-size: var(--t-small);">Export JSON</button>
          </div>
        </div>
      </section>

      <!-- Column 2: Vector Field & Time Series -->
      <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="lab-visualization-title">
        <h2 id="lab-visualization-title" style="font-size: var(--t-h3); margin-bottom: var(--space-4);">Surface Current Field</h2>
        
        <div style="aspect-ratio: 4/3; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-4);" role="img" aria-label="Vector field plot placeholder">
          <span class="text-muted font-mono" style="font-size: var(--t-small);">[Vector Field Canvas · Step 2]</span>
        </div>

        <h3 style="font-size: var(--t-small); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2);" class="text-muted">
          Time Series: Selected Cell (Oct 1–31)
        </h3>
        <div style="height: 120px; background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center;" role="img" aria-label="Time series sparkline placeholder">
          <span class="text-muted font-mono" style="font-size: var(--t-small);">[u, v, speed Time Series · Step 2]</span>
        </div>
      </section>

      <!-- Column 3: Exact Readout & Physical Mapping -->
      <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="lab-readout-title">
        <!-- Mockup Fix #1: Real cell center coordinates; no "illustrative" label -->
        <h2 id="lab-readout-title" style="font-size: var(--t-h3); margin-bottom: var(--space-4);">Selected Cell Coordinates</h2>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-3); font-family: var(--font-mono); font-size: var(--t-small); margin-bottom: var(--space-6);">
          <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
            <span class="text-muted">Cell Index (1-based)</span>
            <strong>Row 4, Col 5</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
            <span class="text-muted">Center Latitude</span>
            <strong>-1.125° N</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
            <span class="text-muted">Center Longitude</span>
            <strong>77.000° E</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
            <span class="text-muted">u (Eastward Velocity)</span>
            <strong>-0.146 m/s</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
            <span class="text-muted">v (Northward Velocity)</span>
            <strong>-0.043 m/s</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
            <span class="text-muted">Speed (|u, v|)</span>
            <strong style="color: var(--accent);">0.153 m/s</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span class="text-muted">Direction</span>
            <strong>-163.7° (W-SW)</strong>
          </div>
        </div>

        <h3 style="font-size: var(--t-h3); margin-bottom: var(--space-3);">Data-to-Sound Mapping</h3>
        <div style="display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--t-small);">
          <div style="display: flex; justify-content: space-between; padding: var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
            <span>Direction</span>
            <span class="font-mono text-muted">→ Pitch Class</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
            <span>Speed</span>
            <span class="font-mono text-muted">→ Loudness & Density</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
            <span>Latitude</span>
            <span class="font-mono text-muted">→ Pitch Register</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
            <span>Longitude</span>
            <span class="font-mono text-muted">→ Stereo Pan</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Provenance Banner (Non-Negotiable Rule 7) -->
    <aside style="background: var(--surface); border-left: 4px solid var(--accent); padding: var(--space-4) var(--space-6); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: var(--t-small);">
      <p style="margin: 0; color: var(--text-muted); line-height: 1.6;">
        <strong style="color: var(--text);">Scientific Notice:</strong> NASA OSCAR Level 4 Ocean Surface Currents near-real-time v2.0 is a model-derived diagnostic product computed from satellite altimetry, surface wind vectors, and drifter velocities; it is not a direct in-situ measurement. Decoded bathymetric contours derive from the 2× downsampled GEBCO_2026 grid and are intended solely for shaded relief visualization.
      </p>
    </aside>
  `;

  return page;
}
