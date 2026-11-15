import { ReliefMap } from '../components/visualizer/ReliefMap.ts';
import { loadGrid8, type Grid8Dataset } from '../data/loader.ts';
import { audioEngine } from '../audio/engine.ts';
import { store } from '../state.ts';

export function renderExplorer(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'explorer-view';

  page.innerHTML = `
    <!-- Main 3D Viewport Area (Full-Bleed Map Canvas) -->
    <div style="flex: 1; min-height: 540px; position: relative; display: flex; overflow: hidden;" id="viewport-wrapper">
      
      <!-- Three.js Canvas Container -->
      <div id="explorer-viewport" style="width: 100%; height: 100%; min-height: 540px; background: #06131F;"
           role="region" aria-label="Interactive Ocean Surface Currents Map"></div>

      <!-- Hero Header & Narrative Overlay (Top Left - Mockup Board 1) -->
      <div class="explorer-hero-header">
        <a href="#/explore" class="explorer-back-link" aria-label="Explore region">
          <span aria-hidden="true">&larr;</span> Explore
        </a>
        <h1 class="explorer-hero-title">Indian Ocean</h1>
        <div class="explorer-hero-subhead">10° S &ndash; 10° N &middot; 60° E &ndash; 90° E</div>
        <p class="explorer-hero-desc">
          Surface currents shape the music &mdash; faster flows add energy, shifts change the tone, and the month's changing currents build the composition.
        </p>

        <!-- Selected-Cell Readout Card (Glassmorphism Telemetry) -->
        <section id="cell-readout-card" class="readout-card" aria-labelledby="readout-card-title">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-2);">
            <h2 id="readout-card-title" style="font-size: var(--t-h3); margin: 0;">Selected Cell</h2>
            <span class="font-mono" style="font-size: var(--t-small); color: var(--accent); font-weight: 600;" id="readout-rank">Rank #--</span>
          </div>

          <div id="readout-body" style="font-family: var(--font-mono); font-size: 0.75rem; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(107,225,208,0.15); padding-bottom: 2px;">
              <span class="text-muted">Index (1-based)</span>
              <strong id="readout-indices">Row 4, Col 5</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(107,225,208,0.15); padding-bottom: 2px;">
              <span class="text-muted">Center</span>
              <strong id="readout-coords">-1.125°N, 77.000°E</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(107,225,208,0.15); padding-bottom: 2px;">
              <span class="text-muted">Mean Speed (scalar)</span>
              <strong style="color: var(--accent);" id="readout-mean-speed">0.164 m/s</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(107,225,208,0.15); padding-bottom: 2px;">
              <span class="text-muted">Vector Speed (|u, v|)</span>
              <strong id="readout-vector-speed">0.153 m/s</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(107,225,208,0.15); padding-bottom: 2px;">
              <span class="text-muted">Vector (u, v)</span>
              <strong id="readout-uv">(-0.146, -0.043)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(107,225,208,0.15); padding-bottom: 2px;">
              <span class="text-muted">Heading</span>
              <strong id="readout-dir">-163.7°</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(107,225,208,0.15); padding-bottom: 2px;">
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
      </div>

      <!-- Right Floating Action Toolbar (Mockup Stack) -->
      <div class="explorer-floating-tools" role="toolbar" aria-label="Map Visual Controls">
        <button type="button" class="tool-btn is-active" id="toggle-layer-bathy" aria-label="Toggle Bathymetry Relief" title="Toggle Bathymetry Relief" aria-pressed="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </button>
        <button type="button" class="tool-btn is-active" id="toggle-layer-grid" aria-label="Toggle 8x8 Grid" title="Toggle 8x8 Acoustic Grid" aria-pressed="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M4 4h16v16H4zM4 10h16M4 16h16M10 4v16M16 4v16"/>
          </svg>
        </button>
        <button type="button" class="tool-btn is-active" id="toggle-layer-coast" aria-label="Toggle Coastlines" title="Toggle Coastlines" aria-pressed="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 12c3-4 6-4 9 0s6 4 9 0M3 18c3-4 6-4 9 0s6 4 9 0"/>
          </svg>
        </button>
        <button type="button" class="tool-btn is-active" id="btn-toggle-readout" aria-label="Toggle Telemetry Card" title="Toggle Telemetry Card" aria-pressed="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
        </button>
        <button type="button" class="tool-btn" id="btn-reset-view" aria-label="Reset Camera View" title="Reset Camera View">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M3 9V5a2 2 0 0 1 2-2h4M15 3h4a2 2 0 0 1 2 2v4M21 15v4a2 2 0 0 1-2 2h-4M9 21H5a2 2 0 0 1-2-2v-4"/>
          </svg>
        </button>
      </div>

      <!-- Live Caption (Polite ARIA Live Region for Screen Readers) -->
      <div id="live-caption" class="polite-caption" aria-live="polite" aria-atomic="true"
           style="position: absolute; top: var(--space-4); left: 50%; transform: translateX(-50%); z-index: 22; background: rgba(6,21,34,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(107,225,208,0.2); border-radius: var(--radius-pill); padding: 4px 16px; font-size: 0.75rem; color: var(--text); max-width: 90%; text-align: center; pointer-events: none;">
        <span style="color: var(--accent); font-weight: 600;" id="caption-date-tag">Oct 01, 2026:</span>
        <span id="caption-text">Selected Row 4, Col 5 (-1.125°N, 77.000°E) - 0.153 m/s westward flow.</span>
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
        GEBCO_2026 Grid &middot; <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener noreferrer" style="color: var(--accent);">doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa</a> &middot; NASA OSCAR L4
      </div>
    </div>

    <!-- Timeline & Audio Transport Bar (Pinned to Bottom - Matches Mockup) -->
    <div class="explorer-transport-bar">
      <div class="transport-inner">
        
        <!-- Left: Large Play Button + Waveform + Track Title -->
        <div style="display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;">
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

          <div style="display: flex; flex-direction: column;">
            <span style="font-size: 0.8125rem; font-weight: 600; color: var(--text);">Ocean Composition &mdash; October 2026</span>
            <span class="font-mono text-muted" style="font-size: 0.6875rem;" id="transport-day-text">Oct 01, 2026 (Day 1 of 31)</span>
          </div>
        </div>

        <!-- Center: Day Steppers & 31-Tick Scrubber -->
        <div style="flex: 1; max-width: 420px; display: flex; align-items: center; gap: var(--space-2);">
          <button type="button" class="btn btn-secondary" id="btn-transport-prev" aria-label="Previous Day" style="padding: 4px 10px; min-height: 32px; font-size: 0.75rem;">
            &#9664;
          </button>
          <input type="range" id="timeline-slider" min="1" max="31" value="1" step="1"
                 aria-label="Timeline scrubber, October 1 to 31, 2026"
                 aria-valuetext="October 1, day 1 of 31"
                 style="flex: 1; cursor: pointer; accent-color: var(--accent);" />
          <button type="button" class="btn btn-secondary" id="btn-transport-next" aria-label="Next Day" style="padding: 4px 10px; min-height: 32px; font-size: 0.75rem;">
            &#9654;
          </button>
        </div>

        <!-- Right: Time readout & Lab direct link -->
        <div style="display: flex; align-items: center; gap: var(--space-3);">
          <span class="font-mono text-muted" style="font-size: var(--t-small);" id="transport-time-code">0:00 / 4:30</span>
          <a href="#/lab" class="btn btn-secondary" style="font-size: 0.75rem; padding: 6px 14px; min-height: 36px; white-space: nowrap;">Open in Lab</a>
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

  // URL hash parameter support (e.g. #/explore?cell=8,8 or #/explore?view=clean)
  const hash = window.location.hash;
  const cellMatch = hash.match(/cell=(\d+),(\d+)/);
  if (cellMatch) {
    selectedRow = Math.max(0, Math.min(7, parseInt(cellMatch[1], 10) - 1));
    selectedCol = Math.max(0, Math.min(7, parseInt(cellMatch[2], 10) - 1));
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

  // 1. Build Accessible Grid Table FIRST (Screen Reader & Keyboard Parity - Flow C)
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
        playSelectedCellSound(row, col);
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

    // Update Transport Day text & Time code
    const dayText = page.querySelector('#transport-day-text');
    if (dayText) {
      dayText.textContent = `${day.date} (Day ${day.day_index} of 31)`;
    }

    const timeCode = page.querySelector('#transport-time-code');
    if (timeCode) {
      const totalSeconds = 270; // 4:30
      const currentSeconds = Math.round(((day.day_index - 1) / 30) * totalSeconds);
      const m = Math.floor(currentSeconds / 60);
      const s = currentSeconds % 60;
      timeCode.textContent = `${m}:${s < 10 ? '0' : ''}${s} / 4:30`;
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

  // Toggle Telemetry Card button
  const readoutCard = page.querySelector<HTMLElement>('#cell-readout-card');
  const readoutToggle = page.querySelector<HTMLButtonElement>('#btn-toggle-readout');
  readoutToggle?.addEventListener('click', () => {
    const active = readoutToggle.classList.toggle('is-active');
    readoutToggle.setAttribute('aria-pressed', String(active));
    if (readoutCard) {
      readoutCard.classList.toggle('is-collapsed', !active);
    }
  });

  // Reset Camera View button
  const resetBtn = page.querySelector<HTMLButtonElement>('#btn-reset-view');
  resetBtn?.addEventListener('click', () => {
    if (reliefMap) {
      reliefMap.resetView();
    }
  });

  function playSelectedCellSound(r: number, c: number): void {
    if (audioEngine.isInitialized() && !audioEngine.isMuted()) {
      const cell = dataset.days[currentDayIdx].cells.find(cell => cell.row === r && cell.column === c);
      if (cell) {
        audioEngine.playCell(cell, { date: dataset.days[currentDayIdx].date, voice: 'lead' });
      }
    }
  }

  // Play button audio transport
  const playBtn = page.querySelector<HTMLButtonElement>('#btn-transport-play');
  const waveBars = page.querySelectorAll<HTMLElement>('.wave-bar');
  let isPlaying = false;

  function updatePlayButtonUI(): void {
    if (playBtn) {
      playBtn.innerHTML = isPlaying
        ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:20px;height:20px;margin-left:0;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="width:20px;height:20px;margin-left:2px;"><path d="M8 5v14l11-7z"/></svg>`;
      playBtn.setAttribute('aria-label', isPlaying ? 'Pause ocean composition' : 'Play October 2026 Ocean Composition');
    }
    waveBars.forEach((bar, idx) => {
      bar.classList.toggle('pulse', isPlaying);
      bar.style.animationDelay = `${(idx * 0.08).toFixed(2)}s`;
    });
  }

  playBtn?.addEventListener('click', async () => {
    if (isPlaying) {
      isPlaying = false;
      audioEngine.stopAll(0.08);
      updatePlayButtonUI();
    } else {
      try {
        await audioEngine.init();
        if (audioEngine.isMuted()) {
          audioEngine.setMuted(false);
          store.setSoundOptIn(true);
        }
        isPlaying = true;
        updatePlayButtonUI();

        const currentDay = dataset.days[currentDayIdx];
        audioEngine.scheduleDay(currentDay, audioEngine.getCurrentTime(), {
          onNoteStart: (note) => {
            selectedRow = note.row;
            selectedCol = note.col;
            if (reliefMap) reliefMap.selectCell(note.row, note.col);
            updateUI();
          }
        });
      } catch (err) {
        console.warn('Playback initialization error:', err);
      }
    }
  });

  // Trace sounding notes in the live caption
  audioEngine.subscribeNote((note) => {
    const captionText = page.querySelector('#caption-text');
    if (captionText) {
      const headingDesc = note.u >= 0 ? 'eastward' : 'westward';
      const panDesc = note.pan < -0.2 ? 'left' : note.pan > 0.2 ? 'right' : 'center';
      captionText.textContent = `${note.date}: Row ${note.rowUi}, Col ${note.colUi} (${note.pitchName}, ${note.frequency.toFixed(1)} Hz, pan ${panDesc}) - ${note.speed.toFixed(3)} m/s ${headingDesc} flow. Voice: ${note.voice}.`;
    }
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
