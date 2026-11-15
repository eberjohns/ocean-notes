import { ReliefMap } from '../components/visualizer/ReliefMap.ts';
import { loadGrid8, type Grid8Dataset } from '../data/loader.ts';

export function renderExplorer(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'explorer-view';
  page.style.cssText = 'display: flex; flex-direction: column; flex: 1; min-height: calc(100vh - var(--header-height)); position: relative;';

  page.innerHTML = `
    <!-- Top Overlay / Context Scrim (Mockup Fix #5) -->
    <div style="padding: var(--space-3) var(--gutter); background: linear-gradient(to bottom, rgba(6,19,31,0.92), rgba(6,19,31,0)); z-index: 10;">
      <div style="max-width: var(--max-width); margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4);">
        <div>
          <span class="text-muted" style="font-size: var(--t-small); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
            Regional Explorer
          </span>
          <h1 style="font-size: var(--t-h2); line-height: 1.1; margin: 0;">Indian Ocean</h1>
          <p class="font-mono text-muted" style="font-size: var(--t-small); margin: 0;">10° S – 10° N · 60° E – 90° E</p>
        </div>

        <!-- Live Caption (WCAG 2.2 Polite ARIA Live Region) -->
        <div id="live-caption" class="polite-caption" aria-live="polite" aria-atomic="true"
             style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-4); max-width: 520px; font-size: var(--t-small);">
          <span style="color: var(--accent); font-weight: 600;" id="caption-date-tag">Oct 01, 2026:</span>
          <span id="caption-text">Selected Row 4, Col 5 (-1.125°N, 77.000°E) - 0.153 m/s westward flow.</span>
        </div>
      </div>
    </div>

    <!-- Main Viewport Area (Three.js Relief Map & Accessible Grid) -->
    <div style="flex: 1; min-height: 520px; position: relative; display: flex; overflow: hidden;" id="viewport-wrapper">
      
      <!-- Three.js Canvas Container -->
      <div id="explorer-viewport" style="width: 100%; height: 100%; min-height: 520px; background: #06131F;"
           role="region" aria-label="Interactive Ocean Surface Currents Map"></div>

      <!-- Left Floating Rail: Readout Card & Layer Toggles (Mockup Board 1) -->
      <div style="position: absolute; top: var(--space-4); left: var(--gutter); z-index: 20; display: flex; flex-direction: column; gap: var(--space-3); max-width: 320px; width: calc(100% - 32px);">
        
        <!-- Selected-Cell Readout Card -->
        <section id="cell-readout-card" style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-4); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);"
                 aria-labelledby="readout-card-title">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-2);">
            <h2 id="readout-card-title" style="font-size: var(--t-h3);">Selected Cell</h2>
            <span class="font-mono" style="font-size: var(--t-small); color: var(--accent); font-weight: 600;" id="readout-rank">Rank #--</span>
          </div>

          <div id="readout-body" style="font-family: var(--font-mono); font-size: var(--t-small); display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 3px;">
              <span class="text-muted">Index (1-based)</span>
              <strong id="readout-indices">Row 4, Col 5</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 3px;">
              <span class="text-muted">Center</span>
              <strong id="readout-coords">-1.125°N, 77.000°E</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 3px;">
              <span class="text-muted">Mean Speed (scalar)</span>
              <strong style="color: var(--accent);" id="readout-mean-speed">0.164 m/s</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 3px;">
              <span class="text-muted">Vector Speed (|u, v|)</span>
              <strong id="readout-vector-speed">0.153 m/s</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 3px;">
              <span class="text-muted">Vector (u, v)</span>
              <strong id="readout-uv">(-0.146, -0.043)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 3px;">
              <span class="text-muted">Heading</span>
              <strong id="readout-dir">-163.7°</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 3px;">
              <span class="text-muted">Coherence</span>
              <strong id="readout-coherence">0.928</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span class="text-muted">Samples</span>
              <strong id="readout-samples">150 / 150</strong>
            </div>
          </div>

          <div style="margin-top: var(--space-3); display: flex; gap: var(--space-2);">
            <button type="button" class="btn btn-secondary" id="btn-copy-readout" style="width: 100%; font-size: 0.75rem; padding: 4px 8px; min-height: 32px;">
              Copy Cell Values
            </button>
          </div>
        </section>

        <!-- Layer Toggles -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); backdrop-filter: blur(12px); display: flex; gap: var(--space-2); flex-wrap: wrap;"
             role="group" aria-label="Map Visual Layers">
          <button type="button" class="btn btn-secondary is-active" id="toggle-layer-bathy" style="font-size: 0.75rem; padding: 4px 8px; min-height: 32px;" aria-pressed="true">
            Relief
          </button>
          <button type="button" class="btn btn-secondary is-active" id="toggle-layer-grid" style="font-size: 0.75rem; padding: 4px 8px; min-height: 32px;" aria-pressed="true">
            8×8 Grid
          </button>
          <button type="button" class="btn btn-secondary is-active" id="toggle-layer-coast" style="font-size: 0.75rem; padding: 4px 8px; min-height: 32px;" aria-pressed="true">
            Coastlines
          </button>
        </div>
      </div>

      <!-- Accessible Keyboard Grid Navigation Overlay (Flow C & Screen Reader Parity) -->
      <div id="accessible-grid-container" style="position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0);">
        <table role="grid" aria-label="8 by 8 Ocean Currents Acoustic Grid. Use arrow keys to navigate rows and columns.">
          <tbody id="accessible-grid-body">
            <!-- 8 rows of 8 cells dynamically injected for keyboard navigation -->
          </tbody>
        </table>
      </div>

      <!-- Map Attribution Line (Rule 12: Exact GEBCO Attribution) -->
      <div style="position: absolute; bottom: var(--space-2); right: var(--gutter); z-index: 20; font-size: 0.6875rem; color: var(--text-muted); background: rgba(6,19,31,0.75); padding: 3px 8px; border-radius: var(--radius-sm); pointer-events: auto;">
        GEBCO_2026 Grid · <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener noreferrer" style="color: var(--accent);">doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa</a> · NASA OSCAR L4
      </div>
    </div>

    <!-- Timeline & Transport Bar (Pinned to Bottom) -->
    <div style="background: var(--surface); border-top: 1px solid var(--border); padding: var(--space-3) var(--gutter); z-index: 30;">
      <div style="max-width: var(--max-width); margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4);">
        
        <!-- Controls: Play, Prev, Next, Day indicator -->
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <button type="button" class="btn btn-primary" id="btn-transport-play" aria-label="Play October 2026 Ocean Composition">
            <span aria-hidden="true">▶</span> Play
          </button>
          <button type="button" class="btn btn-secondary" id="btn-transport-prev" aria-label="Previous Day (Left Arrow)">
            ◀
          </button>
          <button type="button" class="btn btn-secondary" id="btn-transport-next" aria-label="Next Day (Right Arrow)">
            ▶
          </button>
          <span class="font-mono" style="font-size: var(--t-small); margin-left: var(--space-2);" id="transport-day-text">
            Oct 01, 2026 (Day 1 of 31)
          </span>
        </div>

        <!-- 31-Tick Timeline Slider (Mockup Fix #3) -->
        <div style="flex: 1; max-width: 440px; display: flex; align-items: center; gap: var(--space-3);">
          <input type="range" id="timeline-slider" min="1" max="31" value="1" step="1"
                 aria-label="Timeline scrubber, October 1 to 31, 2026"
                 aria-valuetext="October 1, day 1 of 31"
                 style="width: 100%; cursor: pointer;" />
        </div>

        <div style="display: flex; align-items: center; gap: var(--space-4);">
          <span class="font-mono text-muted" style="font-size: var(--t-small);">0:00 / 4:30</span>
          <a href="#/lab" class="btn btn-secondary" style="font-size: var(--t-small);">Open in Lab</a>
        </div>
      </div>
    </div>
  `;

  // Asynchronously initialize Three.js map and dataset
  loadGrid8().then((dataset: Grid8Dataset) => {
    initExplorerMap(page, dataset);
  }).catch(err => {
    const viewport = page.querySelector('#explorer-viewport');
    if (viewport) {
      viewport.innerHTML = `<div style="padding: 24px; color: #ff6b6b;">Error loading data: ${err.message}</div>`;
    }
  });

  return page;
}

function initExplorerMap(page: HTMLElement, dataset: Grid8Dataset): void {
  const viewport = page.querySelector('#explorer-viewport') as HTMLElement;
  if (!viewport) return;

  let currentDayIdx = 0; // 0..30
  let selectedRow = 3;   // 0..7
  let selectedCol = 4;   // 0..7

  // 1. Build Accessible Grid Table FIRST (Screen Reader & Keyboard Parity - Flow C)
  // Ensures full functionality even if WebGL fails or in headless environments
  const gridBody = page.querySelector('#accessible-grid-body');
  if (gridBody) {
    gridBody.innerHTML = '';
    // Row 8 (north, index 7) down to Row 1 (south, index 0)
    for (let r = 7; r >= 0; r--) {
      const tr = document.createElement('tr');
      tr.setAttribute('role', 'row');
      for (let c = 0; c < 8; c++) {
        const td = document.createElement('td');
        td.setAttribute('role', 'gridcell');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = `grid-cell-btn-${r}-${c}`;
        btn.className = 'accessible-cell-btn';
        btn.setAttribute('data-row', String(r));
        btn.setAttribute('data-col', String(c));
        btn.addEventListener('click', () => {
          selectedRow = r;
          selectedCol = c;
          if (reliefMap) {
            reliefMap.selectCell(r, c);
          }
          updateUI();
        });
        btn.addEventListener('keydown', (e: KeyboardEvent) => {
          handleGridKeydown(e, r, c);
        });
        td.appendChild(btn);
        tr.appendChild(td);
      }
      gridBody.appendChild(tr);
    }
  }

  // 2. Initialize Three.js ReliefMap with graceful fallback
  let reliefMap: ReliefMap | null = null;
  try {
    reliefMap = new ReliefMap({
      container: viewport,
      initialRow: selectedRow,
      initialCol: selectedCol,
      onCellSelect: (row: number, col: number) => {
        selectedRow = row;
        selectedCol = col;
        updateUI();
      }
    });
  } catch (err) {
    console.warn('WebGL initialization failed, falling back to static relief view:', err);
    viewport.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
        <img src="/data/relief-2048.webp" alt="Shaded relief map of tropical Indian Ocean" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; bottom: var(--space-4); left: var(--space-4); background: rgba(6,19,31,0.85); padding: 8px 12px; border-radius: var(--radius-sm); font-size: var(--t-small); color: var(--text-muted);">
          Static Relief Mode (WebGL unavailable)
        </div>
      </div>
    `;
  }

  function handleGridKeydown(e: KeyboardEvent, r: number, c: number): void {
    let nextR = r;
    let nextC = c;
    if (e.key === 'ArrowUp') { nextR = Math.min(7, r + 1); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { nextR = Math.max(0, r - 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { nextC = Math.max(0, c - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { nextC = Math.min(7, c + 1); e.preventDefault(); }
    else if (e.key === 'Home') { nextC = 0; e.preventDefault(); }
    else if (e.key === 'End') { nextC = 7; e.preventDefault(); }
    else { return; }

    selectedRow = nextR;
    selectedCol = nextC;
    if (reliefMap) {
      reliefMap.selectCell(nextR, nextC);
    }
    updateUI();
    const nextBtn = page.querySelector<HTMLButtonElement>(`#grid-cell-btn-${nextR}-${nextC}`);
    nextBtn?.focus();
  }

  function updateUI(): void {
    const day = dataset.days[currentDayIdx];
    const cell = day.cells.find(c => c.row === selectedRow && c.column === selectedCol) || day.cells[0];

    // Update Readout Card
    const rankEl = page.querySelector('#readout-rank');
    if (rankEl) rankEl.textContent = `Rank #${cell.speed_rank}`;

    const indicesEl = page.querySelector('#readout-indices');
    if (indicesEl) indicesEl.textContent = `Row ${cell.row_ui}, Col ${cell.column_ui}`;

    const coordsEl = page.querySelector('#readout-coords');
    if (coordsEl) coordsEl.textContent = `${cell.lat.toFixed(3)}°N, ${cell.lon.toFixed(3)}°E`;

    const meanSpeedEl = page.querySelector('#readout-mean-speed');
    if (meanSpeedEl) meanSpeedEl.textContent = `${cell.mean_speed_m_s.toFixed(3)} m/s`;

    const vecSpeedEl = page.querySelector('#readout-vector-speed');
    if (vecSpeedEl) vecSpeedEl.textContent = `${cell.vector_speed_m_s.toFixed(3)} m/s`;

    const uvEl = page.querySelector('#readout-uv');
    if (uvEl) uvEl.textContent = `(${cell.u_m_s.toFixed(3)}, ${cell.v_m_s.toFixed(3)}) m/s`;

    const dirEl = page.querySelector('#readout-dir');
    if (dirEl) dirEl.textContent = `${cell.direction_deg.toFixed(1)}°`;

    const cohEl = page.querySelector('#readout-coherence');
    if (cohEl) cohEl.textContent = `${cell.coherence.toFixed(3)}`;

    const sampEl = page.querySelector('#readout-samples');
    if (sampEl) sampEl.textContent = `${cell.valid_samples} / ${cell.total_samples}`;

    // Update Live Caption
    const captionDate = page.querySelector('#caption-date-tag');
    if (captionDate) captionDate.textContent = `${day.date}:`;

    const captionText = page.querySelector('#caption-text');
    if (captionText) {
      const headingDesc = cell.u_m_s >= 0 ? 'eastward' : 'westward';
      captionText.textContent = `Row ${cell.row_ui}, Col ${cell.column_ui} (${cell.lat.toFixed(3)}°N, ${cell.lon.toFixed(3)}°E): ${cell.mean_speed_m_s.toFixed(3)} m/s ${headingDesc} flow. Coherence: ${cell.coherence.toFixed(2)}.`;
    }

    // Update accessible cell button labels
    for (const c of day.cells) {
      const btn = page.querySelector<HTMLButtonElement>(`#grid-cell-btn-${c.row}-${c.column}`);
      if (btn) {
        btn.setAttribute(
          'aria-label',
          `Row ${c.row_ui}, column ${c.column_ui}: ${c.lat.toFixed(3)} degrees north, ${c.lon.toFixed(3)} degrees east, ${c.mean_speed_m_s.toFixed(3)} meters per second, rank ${c.speed_rank}`
        );
        btn.setAttribute('aria-selected', String(c.row === selectedRow && c.column === selectedCol));
      }
    }

    // Update Transport Day text
    const dayText = page.querySelector('#transport-day-text');
    if (dayText) {
      dayText.textContent = `${day.date} (Day ${day.day_index} of 31)`;
    }

    // Update Slider
    const slider = page.querySelector<HTMLInputElement>('#timeline-slider');
    if (slider) {
      slider.value = String(day.day_index);
      slider.setAttribute('aria-valuetext', `${day.date}, day ${day.day_index} of 31`);
    }
  }

  // Bind transport events
  const prevBtn = page.querySelector('#btn-transport-prev');
  prevBtn?.addEventListener('click', () => {
    if (currentDayIdx > 0) {
      currentDayIdx--;
      updateUI();
    }
  });

  const nextBtn = page.querySelector('#btn-transport-next');
  nextBtn?.addEventListener('click', () => {
    if (currentDayIdx < 30) {
      currentDayIdx++;
      updateUI();
    }
  });

  const slider = page.querySelector<HTMLInputElement>('#timeline-slider');
  slider?.addEventListener('input', (e) => {
    const val = parseInt((e.target as HTMLInputElement).value, 10);
    currentDayIdx = Math.max(0, Math.min(30, val - 1));
    updateUI();
  });

  // Layer toggles
  const bathyToggle = page.querySelector<HTMLButtonElement>('#toggle-layer-bathy');
  bathyToggle?.addEventListener('click', () => {
    const active = bathyToggle.classList.toggle('is-active');
    bathyToggle.setAttribute('aria-pressed', String(active));
    if (reliefMap) reliefMap.setLayerVisibility('bathymetry', active);
  });

  const gridToggle = page.querySelector<HTMLButtonElement>('#toggle-layer-grid');
  gridToggle?.addEventListener('click', () => {
    const active = gridToggle.classList.toggle('is-active');
    gridToggle.setAttribute('aria-pressed', String(active));
    if (reliefMap) reliefMap.setLayerVisibility('grid', active);
  });

  const coastToggle = page.querySelector<HTMLButtonElement>('#toggle-layer-coast');
  coastToggle?.addEventListener('click', () => {
    const active = coastToggle.classList.toggle('is-active');
    coastToggle.setAttribute('aria-pressed', String(active));
    if (reliefMap) reliefMap.setLayerVisibility('coastlines', active);
  });

  // Copy cell values handler
  const copyBtn = page.querySelector<HTMLButtonElement>('#btn-copy-readout');
  copyBtn?.addEventListener('click', () => {
    const cell = dataset.days[currentDayIdx].cells.find(c => c.row === selectedRow && c.column === selectedCol);
    if (!cell) return;
    const text = `Ocean Notes Cell [Row ${cell.row_ui}, Col ${cell.column_ui}]\nLat: ${cell.lat}°N, Lon: ${cell.lon}°E\nSpeed: ${cell.mean_speed_m_s} m/s\nu: ${cell.u_m_s} m/s, v: ${cell.v_m_s} m/s\nDirection: ${cell.direction_deg}°\nCoherence: ${cell.coherence}\nDate: ${dataset.days[currentDayIdx].date}`;
    navigator.clipboard?.writeText(text).then(() => {
      copyBtn.textContent = 'Copied to Clipboard!';
      setTimeout(() => { copyBtn.textContent = 'Copy Cell Values'; }, 2000);
    });
  });

  // Initial render
  updateUI();
}
