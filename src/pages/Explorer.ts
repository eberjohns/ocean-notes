import { ReliefMap } from '../components/visualizer/ReliefMap.ts';
import { loadGrid8, type Grid8Dataset } from '../data/loader.ts';
import { audioEngine, transport, type PlaybackSpeed } from '../audio/index.ts';
import { store } from '../state.ts';
import { assetUrl } from '../utils/assets.ts';

export function renderExplorer(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'explorer-view';

  page.innerHTML = `
    <!-- Main 3D Viewport Area (Full-Bleed Map Canvas) -->
    <div id="viewport-wrapper" class="explorer-viewport-wrapper">
      
      <!-- Three.js Canvas Container -->
      <div id="explorer-viewport" class="explorer-3d-canvas"
           role="region" aria-label="Interactive Ocean Surface Currents Map"></div>

      <!-- Top Left: Hero Header & Selected Cell Readout Card (Matches Mockup) -->
      <div class="explorer-hero-header">
        <div class="explorer-eyebrow">EXPLORE THE OCEAN</div>
        <h1 class="explorer-hero-title">Indian Ocean</h1>
        <div class="explorer-hero-subhead">10&deg; S &ndash; 10&deg; N &nbsp;&bull;&nbsp; 60&deg; E &ndash; 90&deg; E</div>
        <p class="explorer-hero-desc">
          Explore real ocean currents, their patterns, and how they turn into music.
        </p>

        <!-- Selected-Cell Readout Card with Compass Dial -->
        <section id="cell-readout-card" class="readout-card" aria-labelledby="readout-card-title">
          <div class="readout-card-top">
            <div>
              <h2 id="readout-card-title" class="readout-title">Selected Cell</h2>
              <div class="readout-cell-badge" id="readout-indices">Row 4, Col 5</div>
            </div>

            <!-- Compass Dial Indicator -->
            <div class="readout-compass-widget" aria-hidden="true" title="Current Flow Heading">
              <svg viewBox="0 0 40 40" width="38" height="38" class="compass-dial-svg">
                <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(107,225,208,0.25)" stroke-width="1.5" />
                <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(107,225,208,0.12)" stroke-width="1" stroke-dasharray="2 3" />
                <line x1="20" y1="2" x2="20" y2="5" stroke="rgba(107,225,208,0.6)" stroke-width="1.5" />
                <line x1="38" y1="20" x2="35" y2="20" stroke="rgba(107,225,208,0.4)" stroke-width="1" />
                <line x1="20" y1="38" x2="20" y2="35" stroke="rgba(107,225,208,0.4)" stroke-width="1" />
                <line x1="2" y1="20" x2="5" y2="20" stroke="rgba(107,225,208,0.4)" stroke-width="1" />
                <!-- Rotating current vector needle -->
                <g id="compass-dial-needle" style="transform-origin: 20px 20px; transition: transform 0.3s ease;">
                  <polygon points="20,6 23,20 20,18 17,20" fill="var(--accent)" />
                  <polygon points="20,34 22,20 20,22 18,20" fill="rgba(255,255,255,0.3)" />
                  <circle cx="20" cy="20" r="2.5" fill="#06131F" stroke="var(--accent)" stroke-width="1.5" />
                </g>
              </svg>
            </div>
          </div>

          <div id="readout-body" class="readout-metrics-table font-mono">
            <div class="readout-row">
              <span class="readout-lbl">Center</span>
              <strong class="readout-val" id="readout-coords">-1.125&deg;N, 77.000&deg;E</strong>
            </div>
            <div class="readout-row">
              <span class="readout-lbl">Mean Speed</span>
              <strong class="readout-val val-accent" id="readout-mean-speed">0.164 m/s</strong>
            </div>
            <div class="readout-row">
              <span class="readout-lbl">Vector (u, v)</span>
              <strong class="readout-val" id="readout-uv">(-0.146, -0.043) m/s</strong>
            </div>
            <div class="readout-row">
              <span class="readout-lbl">Heading</span>
              <strong class="readout-val" id="readout-dir">-163.7&deg;</strong>
            </div>
            <div class="readout-row">
              <span class="readout-lbl">Coherence</span>
              <strong class="readout-val" id="readout-coherence">0.928</strong>
            </div>
            <div class="readout-row">
              <span class="readout-lbl">Samples</span>
              <strong class="readout-val" id="readout-samples">150 / 150</strong>
            </div>
          </div>

          <!-- Hidden elements for test verification and telemetry accessibility -->
          <span id="readout-rank" class="sr-only">Rank #--</span>
          <span id="readout-vector-speed" class="sr-only">0.153 m/s</span>

          <div class="readout-card-actions">
            <a href="#/lab" class="btn-more-details" id="readout-more-details" aria-label="Inspect cell details in Research Lab">
              <span>More Details</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
              </svg>
            </a>
            <button type="button" class="sr-only" id="btn-copy-readout">Copy Cell Values</button>
          </div>
        </section>
      </div>

      <!-- Bottom-Left: Mini Orientation Globe & North Arrow (Matches Mockup) -->
      <div class="mini-globe-widget" aria-hidden="true" title="Indian Ocean Regional Orientation">
        <svg viewBox="0 0 52 52" width="46" height="46" class="mini-globe-svg">
          <circle cx="26" cy="26" r="23" fill="rgba(6,21,34,0.75)" stroke="rgba(107,225,208,0.3)" stroke-width="1.2" />
          <ellipse cx="26" cy="26" rx="23" ry="9" fill="none" stroke="rgba(107,225,208,0.18)" stroke-width="1" />
          <ellipse cx="26" cy="26" rx="9" ry="23" fill="none" stroke="rgba(107,225,208,0.18)" stroke-width="1" />
          <line x1="3" y1="26" x2="49" y2="26" stroke="rgba(107,225,208,0.25)" stroke-width="1" stroke-dasharray="2 2" />
          <line x1="26" y1="3" x2="26" y2="49" stroke="rgba(107,225,208,0.25)" stroke-width="1" stroke-dasharray="2 2" />
          <!-- Bounding box representing 10°S–10°N, 60°E–90°E -->
          <rect x="24" y="23" width="13" height="11" fill="rgba(107,225,208,0.22)" stroke="var(--accent)" stroke-width="1.5" rx="1.5" />
        </svg>
        <div class="mini-globe-north">
          <span class="north-txt">N</span>
          <svg viewBox="0 0 12 12" width="10" height="10" fill="var(--accent)">
            <polygon points="6,1 11,10 6,8 1,10" />
          </svg>
        </div>
      </div>

      <!-- Right Floating Action Stack: Layers Card + Telemetry + View + Fullscreen -->
      <div class="explorer-floating-tools" role="toolbar" aria-label="Map Visual Controls">
        
        <!-- 1. Layers Panel Card (Matches Mockup) -->
        <div class="layer-control-panel" id="layers-panel">
          <div class="layer-panel-header">
            <div class="layer-panel-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
              <span>Layers</span>
            </div>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          <div class="layer-panel-checklist">
            <!-- Bathymetry (GEBCO) -->
            <button type="button" class="layer-check-btn is-active" id="toggle-layer-bathy" role="checkbox" aria-checked="true" aria-label="Toggle Bathymetry (GEBCO)">
              <span class="layer-checkbox-box">
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 13 4"/></svg>
              </span>
              <span>Bathymetry (GEBCO)</span>
            </button>

            <!-- Currents (OSCAR) -->
            <button type="button" class="layer-check-btn is-active" id="toggle-layer-currents" role="checkbox" aria-checked="true" aria-label="Toggle Currents (OSCAR)">
              <span class="layer-checkbox-box">
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 13 4"/></svg>
              </span>
              <span>Currents (OSCAR)</span>
            </button>

            <!-- 8x8 Grid (Audio) -->
            <button type="button" class="layer-check-btn is-active" id="toggle-layer-grid" role="checkbox" aria-checked="true" aria-label="Toggle 8x8 Grid (Audio)">
              <span class="layer-checkbox-box">
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 13 4"/></svg>
              </span>
              <span>8&times;8 Grid (Audio)</span>
            </button>

            <!-- Coastlines -->
            <button type="button" class="layer-check-btn is-active" id="toggle-layer-coast" role="checkbox" aria-checked="true" aria-label="Toggle Coastlines">
              <span class="layer-checkbox-box">
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 7 12 13 4"/></svg>
              </span>
              <span>Coastlines</span>
            </button>
          </div>
        </div>

        <!-- 2. Cell Telemetry Pill Toggle Switch -->
        <button type="button" class="tool-action-pill" id="btn-toggle-readout" aria-pressed="true" aria-label="Toggle Cell Telemetry">
          <div class="tool-pill-left">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 13.5V10.5M6 16.5V7.5M10 20.5V3.5M14 17.5V6.5M18 19.5V4.5M22 13.5V10.5"/>
            </svg>
            <span>Cell Telemetry</span>
          </div>
          <span class="pill-toggle-switch" aria-hidden="true"></span>
        </button>

        <!-- 3. View Options Pill -->
        <button type="button" class="tool-action-pill" id="btn-reset-view" aria-label="Reset Camera View" title="Reset View">
          <div class="tool-pill-left">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M23 7l-7 5 7 5V7z"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span>View</span>
          </div>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>

        <!-- 4. Fullscreen Pill -->
        <button type="button" class="tool-action-pill" id="btn-fullscreen" aria-label="Toggle Fullscreen" title="Fullscreen">
          <div class="tool-pill-left">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
            <span>Fullscreen</span>
          </div>
        </button>
      </div>

      <!-- Live Caption (Polite ARIA Live Region for Screen Readers) -->
      <div id="live-caption" class="polite-caption" aria-live="polite" aria-atomic="true">
        <span style="color: var(--accent); font-weight: 600;" id="caption-date-tag">Oct 01, 2026:</span>
        <span id="caption-text">Selected Row 4, Col 5 (-1.125°N, 77.000°E) - 0.153 m/s westward flow.</span>
      </div>

      <!-- Accessible Keyboard Grid Navigation Overlay (Flow C & Screen Reader Parity) -->
      <div id="accessible-grid-container" class="sr-only">
        <table role="grid" aria-label="8 by 8 Ocean Currents Acoustic Grid. Use arrow keys to navigate rows and columns.">
          <tbody id="accessible-grid-body">
            <!-- 8 rows of 8 cells dynamically injected for keyboard navigation -->
          </tbody>
        </table>
      </div>

      <!-- Map Attribution Line (Rule 12: Exact GEBCO Attribution) -->
      <div class="explorer-attribution">
        GEBCO_2026 Grid &middot; <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener noreferrer">doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa</a> &middot; NASA OSCAR L4
      </div>
    </div>

    <!-- Timeline & Audio Transport Bar (Pinned Floating Capsule - Matches Mockup) -->
    <div class="explorer-transport-bar">
      <div class="transport-inner">
        
        <!-- Left: Play Button + Waveform + Track Title -->
        <div class="transport-track-info">
          <button type="button" class="play-circle-btn" id="btn-transport-play" aria-label="Play October 2026 Ocean Composition">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>

          <!-- Waveform Visualizer -->
          <div class="audio-waveform-bars" aria-hidden="true" title="Dynamic Waveform">
            <div class="wave-bar" style="height: 8px;"></div>
            <div class="wave-bar" style="height: 14px;"></div>
            <div class="wave-bar" style="height: 22px;"></div>
            <div class="wave-bar" style="height: 16px;"></div>
            <div class="wave-bar" style="height: 24px;"></div>
            <div class="wave-bar" style="height: 12px;"></div>
            <div class="wave-bar" style="height: 18px;"></div>
            <div class="wave-bar" style="height: 26px;"></div>
            <div class="wave-bar" style="height: 15px;"></div>
            <div class="wave-bar" style="height: 20px;"></div>
            <div class="wave-bar" style="height: 10px;"></div>
            <div class="wave-bar" style="height: 22px;"></div>
            <div class="wave-bar" style="height: 17px;"></div>
            <div class="wave-bar" style="height: 12px;"></div>
          </div>

          <div class="transport-track-text">
            <span class="transport-track-title">Ocean Composition &mdash; October 2026</span>
            <span class="font-mono text-muted transport-track-sub" id="transport-day-text">Day 1 of 31 &nbsp;&bull;&nbsp; Indian Ocean</span>
          </div>
        </div>

        <!-- Center: Day Steppers & 31-Tick Scrubber -->
        <div class="transport-scrubber-row">
          <button type="button" class="transport-step-btn" id="btn-transport-prev" aria-label="Previous day" disabled>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          
          <div class="timeline-slider-wrap">
            <input type="range" id="timeline-slider" class="timeline-slider" min="1" max="31" value="1" step="1"
                   list="timeline-ticks"
                   aria-label="Timeline scrubber, October 1 to 31, 2026"
                   aria-valuemin="1" aria-valuemax="31" aria-valuenow="1"
                   aria-valuetext="October 1, day 1 of 31" />
            <datalist id="timeline-ticks">
              <option value="1"></option>
              <option value="8"></option>
              <option value="16"></option>
              <option value="24"></option>
              <option value="31"></option>
            </datalist>
            <div class="timeline-ticks-labels font-mono" aria-hidden="true">
              <span>Oct 1</span>
              <span>Oct 8</span>
              <span>Oct 16</span>
              <span>Oct 24</span>
              <span>Oct 31</span>
            </div>
          </div>

          <button type="button" class="transport-step-btn" id="btn-transport-next" aria-label="Next day">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>

        <!-- Right: Speed Multiplier, Time readout & Lab direct link -->
        <div class="transport-right-row">
          <div class="speed-control-group" role="group" aria-label="Playback speed">
            <button type="button" class="btn-speed" data-speed="0.5" aria-pressed="false" aria-label="Play at half speed (0.5x)">0.5&times;</button>
            <button type="button" class="btn-speed is-active" data-speed="1" aria-pressed="true" aria-label="Play at normal speed (1x)">1&times;</button>
            <button type="button" class="btn-speed" data-speed="2" aria-pressed="false" aria-label="Play at double speed (2x)">2&times;</button>
          </div>

          <span class="font-mono text-muted transport-time-code" id="transport-time-code">0:00 / 4:30</span>
          
          <a href="#/lab" class="btn-open-in-lab" id="btn-open-in-lab" aria-label="Open dataset in Research Lab">
            <span>Open in Lab</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
          </a>
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
  let selectedRow = 3;   // 0..7 (Row 4 in 1-based UI)
  let selectedCol = 4;   // 0..7 (Col 5 in 1-based UI)
  let userSelectedExplicitly = false;

  // URL hash parameter support (e.g. #/explore?cell=8,8 or #/explore?view=clean)
  const hash = window.location.hash;
  const cellMatch = hash.match(/cell=(\d+),(\d+)/);
  if (cellMatch) {
    selectedRow = Math.max(0, Math.min(7, parseInt(cellMatch[1], 10) - 1));
    selectedCol = Math.max(0, Math.min(7, parseInt(cellMatch[2], 10) - 1));
    userSelectedExplicitly = true;
  }
  if (hash.includes('view=clean')) {
    const readoutCard = page.querySelector<HTMLElement>('#cell-readout-card');
    const readoutToggle = page.querySelector<HTMLButtonElement>('#btn-toggle-readout');
    if (readoutCard) readoutCard.classList.add('is-collapsed');
    if (readoutToggle) {
      readoutToggle.classList.remove('is-active');
      readoutToggle.setAttribute('aria-pressed', 'false');
    }
  }

  // 1. Build Accessible Grid Table (Screen Reader & Keyboard Parity - Flow C)
  const gridBody = page.querySelector('#accessible-grid-body');
  if (gridBody) {
    gridBody.innerHTML = '';
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
        btn.setAttribute('aria-label', `Row ${r + 1}, column ${c + 1}`);
        btn.addEventListener('click', () => {
          userSelectedExplicitly = true;
          selectedRow = r;
          selectedCol = c;
          if (reliefMap) {
            reliefMap.selectCell(r, c);
          }
          updateUI();
          playSelectedCellSound(r, c);
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

  // 2. Initialize Three.js ReliefMap with interactive 3D OrbitControls, water overlay & currents
  let reliefMap: ReliefMap | null = null;
  try {
    reliefMap = new ReliefMap({
      container: viewport,
      initialRow: selectedRow,
      initialCol: selectedCol,
      onCellSelect: (row: number, col: number) => {
        userSelectedExplicitly = true;
        selectedRow = row;
        selectedCol = col;
        updateUI();
        playSelectedCellSound(row, col);
      }
    });
    reliefMap.updateCurrents(dataset.days[currentDayIdx].cells);
  } catch (err) {
    console.warn('WebGL initialization failed, falling back to static relief view:', err);
    viewport.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
        <img src="${assetUrl('data/relief-2048.webp')}" alt="Shaded relief map of tropical Indian Ocean" style="width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; bottom: 80px; left: var(--page-padding-x); background: rgba(6,19,31,0.85); padding: 8px 12px; border-radius: var(--radius-sm); font-size: var(--t-small); color: var(--text-muted);">
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

    // Update Compass Dial Needle Rotation
    const compassNeedle = page.querySelector<HTMLElement>('#compass-dial-needle');
    if (compassNeedle) {
      compassNeedle.style.transform = `rotate(${cell.direction_deg}deg)`;
    }

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

    // Update Transport Day text & Time code
    const dayText = page.querySelector('#transport-day-text');
    if (dayText) {
      dayText.textContent = `Day ${day.day_index} of 31 \u00A0\u2022\u00A0 Indian Ocean`;
    }

    // Update Slider if not currently being dragged by user
    const slider = page.querySelector<HTMLInputElement>('#timeline-slider');
    if (slider && document.activeElement !== slider) {
      slider.value = String(day.day_index);
      slider.setAttribute('aria-valuenow', String(day.day_index));
      slider.setAttribute('aria-valuetext', `${day.date}, day ${day.day_index} of 31`);
    }

    // Update prev/next button states
    const prevBtn = page.querySelector<HTMLButtonElement>('#btn-transport-prev');
    if (prevBtn) prevBtn.disabled = day.day_index === 1;

    const nextBtn = page.querySelector<HTMLButtonElement>('#btn-transport-next');
    if (nextBtn) nextBtn.disabled = day.day_index === 31;
  }

  // Connect Transport
  transport.setDataset(dataset);

  const prevBtn = page.querySelector<HTMLButtonElement>('#btn-transport-prev');
  prevBtn?.addEventListener('click', () => {
    transport.stepDay(-1);
  });

  const nextBtn = page.querySelector<HTMLButtonElement>('#btn-transport-next');
  nextBtn?.addEventListener('click', () => {
    transport.stepDay(1);
  });

  const slider = page.querySelector<HTMLInputElement>('#timeline-slider');
  slider?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    const dayNum = parseInt(target.value, 10);
    transport.seekToDay(dayNum - 1);
  });

  const playBtn = page.querySelector<HTMLButtonElement>('#btn-transport-play');
  playBtn?.addEventListener('click', async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioEngine.isInitialized()) {
      try {
        await audioEngine.init();
      } catch (err) {
        console.warn('AudioContext user-interaction initialization error:', err);
      }
    }

    if (transport.getState() === 'playing') {
      transport.pause();
    } else {
      await transport.play();
    }
  });

  const speedBtns = page.querySelectorAll<HTMLButtonElement>('.btn-speed');
  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const speed = parseFloat(btn.getAttribute('data-speed') || '1') as PlaybackSpeed;
      transport.setSpeed(speed);
      speedBtns.forEach(b => {
        const isCurrent = b === btn;
        b.classList.toggle('is-active', isCurrent);
        b.setAttribute('aria-pressed', String(isCurrent));
      });
    });
  });

  // Subscribe to transport snapshot updates
  let lastIsPlaying: boolean | null = null;
  transport.subscribeSnapshot((snap) => {
    const isPlaying = snap.state === 'playing';

    if (playBtn && isPlaying !== lastIsPlaying) {
      lastIsPlaying = isPlaying;
      playBtn.classList.toggle('is-playing', isPlaying);
      playBtn.setAttribute('aria-label', isPlaying ? 'Pause ocean composition' : 'Play October 2026 Ocean Composition');
      playBtn.innerHTML = isPlaying
        ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="pointer-events: none;"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="pointer-events: none;"><path d="M8 5v14l11-7z"/></svg>`;
    }

    const waveBars = page.querySelectorAll('.wave-bar');
    waveBars.forEach((bar) => {
      bar.classList.toggle('pulse', isPlaying);
    });

    if (currentDayIdx !== snap.dayIndex) {
      currentDayIdx = snap.dayIndex;
      reliefMap?.updateCurrents(dataset.days[currentDayIdx].cells);

      if (!userSelectedExplicitly) {
        const dominant = dataset.days[currentDayIdx].cells.find(c => c.speed_rank === 1);
        if (dominant) {
          selectedRow = dominant.row;
          selectedCol = dominant.column;
          reliefMap?.selectCell(dominant.row, dominant.column);
        }
      }
      updateUI();
    }

    const timeCode = page.querySelector('#transport-time-code');
    if (timeCode) {
      timeCode.textContent = snap.timeString;
    }
  });

  // Layer Checkbox Toggles
  const btnBathy = page.querySelector<HTMLButtonElement>('#toggle-layer-bathy');
  btnBathy?.addEventListener('click', () => {
    const active = btnBathy.classList.toggle('is-active');
    btnBathy.setAttribute('aria-checked', String(active));
    reliefMap?.setLayerVisibility('bathymetry', active);
  });

  const btnGrid = page.querySelector<HTMLButtonElement>('#toggle-layer-grid');
  btnGrid?.addEventListener('click', () => {
    const active = btnGrid.classList.toggle('is-active');
    btnGrid.setAttribute('aria-checked', String(active));
    reliefMap?.setLayerVisibility('grid', active);
  });

  const btnCoast = page.querySelector<HTMLButtonElement>('#toggle-layer-coast');
  btnCoast?.addEventListener('click', () => {
    const active = btnCoast.classList.toggle('is-active');
    btnCoast.setAttribute('aria-checked', String(active));
    reliefMap?.setLayerVisibility('coastlines', active);
  });

  const btnCurrents = page.querySelector<HTMLButtonElement>('#toggle-layer-currents');
  btnCurrents?.addEventListener('click', () => {
    const active = btnCurrents.classList.toggle('is-active');
    btnCurrents.setAttribute('aria-checked', String(active));
    reliefMap?.setLayerVisibility('currents', active);
  });

  // Cell Telemetry Card Toggle
  const readoutToggle = page.querySelector<HTMLButtonElement>('#btn-toggle-readout');
  const readoutCard = page.querySelector<HTMLElement>('#cell-readout-card');
  readoutToggle?.addEventListener('click', () => {
    const isNowActive = readoutToggle.classList.toggle('is-active');
    readoutToggle.setAttribute('aria-pressed', String(isNowActive));
    if (readoutCard) {
      readoutCard.classList.toggle('is-collapsed', !isNowActive);
    }
  });

  // View Mode Switcher Button (3D Angle <-> Top-Down <-> Focus Cell)
  const btnReset = page.querySelector<HTMLButtonElement>('#btn-reset-view');
  const viewSpan = btnReset?.querySelector('.tool-pill-left span');
  btnReset?.addEventListener('click', () => {
    const modeName = reliefMap?.cycleViewMode() || '3D Angle';
    if (viewSpan) {
      viewSpan.textContent = `View: ${modeName}`;
    }
  });

  // Fullscreen Button
  const btnFullscreen = page.querySelector<HTMLButtonElement>('#btn-fullscreen');
  btnFullscreen?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      page.requestFullscreen?.().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen?.().catch(err => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  });

  // Initial UI Render
  updateUI();
}

function playSelectedCellSound(row: number, col: number): void {
  if (store.getState().isMuted) return;
  if (!audioEngine.isInitialized()) return;

  try {
    const ctx = audioEngine.getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    // Pitch mapping: Row 0..7 -> Register C3..C5
    const baseFreqs = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63];
    const freq = baseFreqs[row] || 220.0;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Longitude column -> Stereo pan
    if (pan) {
      const panVal = -0.8 + (col / 7) * 1.6;
      pan.pan.setValueAtTime(panVal, ctx.currentTime);
    }

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    if (pan) {
      osc.connect(pan);
      pan.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
  } catch (err) {
    console.warn('Cell sound playback error:', err);
  }
}
