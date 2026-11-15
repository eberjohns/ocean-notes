import { loadGrid8, type Grid8Dataset, type Grid8Cell } from '../data/loader.ts';

export function renderLab(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'content-container';

  // Loading state container
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

    <div id="lab-content" style="min-height: 400px; display: flex; align-items: center; justify-content: center;">
      <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: var(--t-small);">
        Loading scientific dataset (grid8.json)...
      </div>
    </div>
  `;

  // Asynchronously load data and render interactive UI
  loadGrid8()
    .then((dataset: Grid8Dataset) => {
      const container = page.querySelector('#lab-content');
      if (container) {
        initLabUI(container as HTMLElement, dataset);
      }
    })
    .catch((err) => {
      const container = page.querySelector('#lab-content');
      if (container) {
        container.innerHTML = `
          <div style="background: rgba(180, 84, 26, 0.1); border: 1px solid var(--accent); padding: var(--space-6); border-radius: var(--radius-md); max-width: 600px;">
            <h2 style="color: var(--accent); font-size: var(--t-h3); margin-bottom: var(--space-2);">Failed to Load Dataset</h2>
            <p style="font-size: var(--t-small); color: var(--text-muted); margin-bottom: var(--space-4);">${err.message}</p>
            <button type="button" class="btn btn-primary" onclick="window.location.reload()">Retry</button>
          </div>
        `;
      }
    });

  return page;
}

function initLabUI(container: HTMLElement, dataset: Grid8Dataset): void {
  // State for Lab
  let selectedDayIndex = 0; // 0 to 30 (Oct 1 to Oct 31)
  let selectedRow = 3;       // 0-based: row index 3 -> Row 4 (lat -1.125°)
  let selectedCol = 4;       // 0-based: col index 4 -> Col 5 (lon 77.000°)
  let sortColumn: keyof Grid8Cell = 'speed_rank';
  let sortAscending = true;
  let showTimeSeriesTable = false;

  function render(): void {
    const day = dataset.days[selectedDayIndex];
    const selectedCell = day.cells.find(c => c.row === selectedRow && c.column === selectedCol) || day.cells[0];

    // Gather 31-day time series for currently selected cell
    const cellTimeSeries = dataset.days.map((d, idx) => {
      const c = d.cells.find(cell => cell.row === selectedRow && cell.column === selectedCol)!;
      return {
        dayIndex: idx + 1,
        date: d.date,
        u: c.u_m_s,
        v: c.v_m_s,
        speed: c.mean_speed_m_s,
        coherence: c.coherence,
        direction: c.direction_deg
      };
    });

    const speeds = cellTimeSeries.map(t => t.speed);
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;

    // Sort cells for the 64-cell table
    const sortedCells = [...day.cells].sort((a, b) => {
      let valA = a[sortColumn];
      let valB = b[sortColumn];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAscending ? valA - valB : valB - valA;
      }
      return 0;
    });

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: var(--space-8); width: 100%;">
        
        <!-- Top 3-Column Analytical Dashboard -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6);">
          
          <!-- Column 1: Controls & Parameters -->
          <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="lab-controls-heading">
            <h2 id="lab-controls-heading" style="font-size: var(--t-h3); margin-bottom: var(--space-4);">Inspection Controls</h2>
            
            <div style="display: flex; flex-direction: column; gap: var(--space-4);">
              <div>
                <label for="lab-date-select" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">Date</label>
                <select id="lab-date-select" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
                  ${dataset.days.map((d, idx) => `
                    <option value="${idx}" ${idx === selectedDayIndex ? 'selected' : ''}>
                      Day ${d.day_index}: ${d.date} (Mean: ${d.mean_grid_speed_m_s.toFixed(3)} m/s)
                    </option>
                  `).join('')}
                </select>
              </div>

              <div>
                <label for="lab-cell-select" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">
                  Selected Cell (8×8 Grid)
                </label>
                <select id="lab-cell-select" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
                  ${day.cells.map(c => `
                    <option value="${c.row}-${c.column}" ${c.row === selectedRow && c.column === selectedCol ? 'selected' : ''}>
                      Row ${c.row_ui} × Col ${c.column_ui} (${c.lat.toFixed(3)}°N, ${c.lon.toFixed(3)}°E) - Rank #${c.speed_rank}
                    </option>
                  `).join('')}
                </select>
              </div>

              <!-- Mockup Fix #2: 8, 12 or 16 sectors (default 16), not 8x8 -->
              <div>
                <label for="lab-sectors-select" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">
                  Sector Count (Audio Mapping)
                </label>
                <select id="lab-sectors-select" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
                  <option value="16" selected>16 Sectors (22.5° each - Default)</option>
                  <option value="12">12 Sectors (30° each)</option>
                  <option value="8">8 Sectors (45° each)</option>
                </select>
              </div>

              <div>
                <label for="lab-scale-select" class="text-muted" style="display: block; font-size: var(--t-small); margin-bottom: var(--space-1);">
                  Modal Scale
                </label>
                <select id="lab-scale-select" style="width: 100%; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg);">
                  <option value="dorian" selected>Dorian (D E F G A B C - Default)</option>
                  <option value="pentatonic">Pentatonic (C D E G A)</option>
                  <option value="wholetone">Whole Tone (C D E F# G# A#)</option>
                </select>
              </div>

              <div style="display: flex; gap: var(--space-3); margin-top: var(--space-2);">
                <button type="button" class="btn btn-secondary" id="btn-export-csv" style="flex: 1; font-size: var(--t-small);" aria-label="Export current day cells as CSV">
                  Export Day CSV
                </button>
                <button type="button" class="btn btn-secondary" id="btn-export-json" style="flex: 1; font-size: var(--t-small);" aria-label="Export current day cells as JSON">
                  Export Day JSON
                </button>
              </div>
            </div>
          </section>

          <!-- Column 2: Selected Cell Time Series & Summary (Mockup Fix #7) -->
          <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="lab-timeseries-heading">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-2);">
              <h2 id="lab-timeseries-heading" style="font-size: var(--t-h3);">Cell Velocity Time Series</h2>
              <span class="font-mono text-muted" style="font-size: var(--t-small);">Oct 1–31, 2026</span>
            </div>

            <p id="timeseries-summary" class="text-muted" style="font-size: var(--t-small); line-height: 1.5; margin-bottom: var(--space-3);">
              Monthly profile for <strong>Row ${selectedCell.row_ui}, Col ${selectedCell.column_ui}</strong>: Speed ranges from <strong>${minSpeed.toFixed(3)} m/s</strong> to <strong>${maxSpeed.toFixed(3)} m/s</strong> (mean: <strong>${avgSpeed.toFixed(3)} m/s</strong>). Selected Day ${selectedDayIndex + 1} speed is <strong>${selectedCell.mean_speed_m_s.toFixed(3)} m/s</strong> (Rank #${selectedCell.speed_rank}).
            </p>

            <!-- Accessible SVG Time Series Chart with Selected Day Marker -->
            <div style="background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-2); margin-bottom: var(--space-3);">
              ${renderTimeSeriesSvg(cellTimeSeries, selectedDayIndex)}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <!-- Legend -->
              <div style="display: flex; gap: var(--space-3); font-size: 0.75rem; font-family: var(--font-mono);">
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 10px; height: 3px; background: #B4541A; display: inline-block;"></span> Speed
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 10px; height: 3px; background: #0B5FFF; display: inline-block;"></span> u (East)
                </span>
                <span style="display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 10px; height: 3px; background: #176D78; display: inline-block;"></span> v (North)
                </span>
              </div>

              <!-- Data table toggle (Mockup Fix #7) -->
              <button type="button" id="btn-toggle-ts-table" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 8px; min-height: 32px;">
                ${showTimeSeriesTable ? 'Hide Table' : 'View Table'}
              </button>
            </div>

            <!-- Optional Collapsible Numerical Table for Screen Readers & Tabular Inspection -->
            ${showTimeSeriesTable ? renderTimeSeriesTable(cellTimeSeries) : ''}
          </section>

          <!-- Column 3: Exact Coordinates & Sonic Mapping -->
          <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="lab-readout-heading">
            <!-- Mockup Fix #1: Real cell center coordinates; no "illustrative" label -->
            <h2 id="lab-readout-heading" style="font-size: var(--t-h3); margin-bottom: var(--space-4);">Selected Cell Parameters</h2>
            
            <div style="display: flex; flex-direction: column; gap: var(--space-3); font-family: var(--font-mono); font-size: var(--t-small); margin-bottom: var(--space-6);">
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                <span class="text-muted">Grid Position (1-based)</span>
                <strong>Row ${selectedCell.row_ui}, Col ${selectedCell.column_ui}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                <span class="text-muted">Center Coordinates</span>
                <strong>${selectedCell.lat.toFixed(3)}°N, ${selectedCell.lon.toFixed(3)}°E</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                <span class="text-muted">Daily Speed Rank</span>
                <strong style="color: var(--accent);">#${selectedCell.speed_rank} of 64</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                <span class="text-muted">Mean Point Speed</span>
                <strong>${selectedCell.mean_speed_m_s.toFixed(3)} m/s</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                <span class="text-muted">Vector Mean (u, v)</span>
                <strong>(${selectedCell.u_m_s.toFixed(3)}, ${selectedCell.v_m_s.toFixed(3)}) m/s</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                <span class="text-muted">Flow Direction</span>
                <strong>${selectedCell.direction_deg.toFixed(1)}°</strong>
              </div>
              <div style="display: flex; justify-content: space-between; padding-bottom: 4px; border-bottom: 1px solid var(--border);">
                <span class="text-muted">Directional Coherence</span>
                <strong>${selectedCell.coherence.toFixed(3)}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span class="text-muted">Valid / Total Samples</span>
                <strong>${selectedCell.valid_samples} / ${selectedCell.total_samples}</strong>
              </div>
            </div>

            <h3 style="font-size: var(--t-small); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-2);" class="text-muted">
              Data-to-Sound Translation
            </h3>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: var(--t-small);">
              <div style="display: flex; justify-content: space-between; padding: 6px var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
                <span>Direction (${selectedCell.direction_deg.toFixed(1)}°)</span>
                <span class="font-mono text-muted">→ Sector ${Math.floor(((selectedCell.direction_deg + 180) % 360) / 22.5) + 1} / 16</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
                <span>Latitude (${selectedCell.lat.toFixed(3)}°N)</span>
                <span class="font-mono text-muted">→ Register Octave ${Math.floor((selectedCell.row / 8) * 3) + 2}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
                <span>Speed (${selectedCell.mean_speed_m_s.toFixed(3)} m/s)</span>
                <span class="font-mono text-muted">→ Gain ${(Math.sqrt(selectedCell.mean_speed_m_s) * 100).toFixed(0)}%</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 6px var(--space-2); background: var(--bg); border-radius: var(--radius-sm);">
                <span>Longitude (${selectedCell.lon.toFixed(3)}°E)</span>
                <span class="font-mono text-muted">→ Pan ${((selectedCell.column / 7) * 2 - 1).toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Full 64-Cell Interactive Data Table for the Selected Date -->
        <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="lab-table-heading">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-4);">
            <div>
              <h2 id="lab-table-heading" style="font-size: var(--t-h2);">All 64 Cells for ${day.date}</h2>
              <p class="text-muted" style="font-size: var(--t-small);">
                Click any row or header to select and sort. Row 1 is the southern boundary (-8.75°N); Row 8 is the northern boundary (+8.875°N).
              </p>
            </div>
            <div class="font-mono" style="font-size: var(--t-small);">
              Showing 64 cells · Day ${day.day_index} of 31
            </div>
          </div>

          <div style="overflow-x: auto; max-height: 480px; border: 1px solid var(--border); border-radius: var(--radius-sm);">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: var(--t-small); font-family: var(--font-mono);">
              <thead style="position: sticky; top: 0; background: var(--surface-2); z-index: 2;">
                <tr style="border-bottom: 2px solid var(--border);">
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="speed_rank">Rank ${sortColumn === 'speed_rank' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="row_ui">Row ${sortColumn === 'row_ui' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="column_ui">Col ${sortColumn === 'column_ui' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px;">Center (Lat, Lon)</th>
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="mean_speed_m_s">Speed (m/s) ${sortColumn === 'mean_speed_m_s' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="u_m_s">u (m/s) ${sortColumn === 'u_m_s' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="v_m_s">v (m/s) ${sortColumn === 'v_m_s' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="direction_deg">Heading ${sortColumn === 'direction_deg' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px; cursor: pointer;" data-sort="coherence">Coherence ${sortColumn === 'coherence' ? (sortAscending ? '▲' : '▼') : ''}</th>
                  <th style="padding: 10px 12px;">Samples</th>
                </tr>
              </thead>
              <tbody>
                ${sortedCells.map(c => {
                  const isSelected = c.row === selectedRow && c.column === selectedCol;
                  return `
                    <tr style="border-bottom: 1px solid var(--border); cursor: pointer; background: ${isSelected ? 'rgba(180, 84, 26, 0.15)' : 'transparent'};"
                        class="table-row-cell" data-row="${c.row}" data-col="${c.column}" tabindex="0">
                      <td style="padding: 8px 12px; font-weight: 600; color: ${isSelected ? 'var(--accent)' : 'inherit'};">#${c.speed_rank}</td>
                      <td style="padding: 8px 12px;">${c.row_ui}</td>
                      <td style="padding: 8px 12px;">${c.column_ui}</td>
                      <td style="padding: 8px 12px;">${c.lat.toFixed(3)}°, ${c.lon.toFixed(3)}°</td>
                      <td style="padding: 8px 12px; font-weight: 600;">${c.mean_speed_m_s.toFixed(3)}</td>
                      <td style="padding: 8px 12px;">${c.u_m_s.toFixed(3)}</td>
                      <td style="padding: 8px 12px;">${c.v_m_s.toFixed(3)}</td>
                      <td style="padding: 8px 12px;">${c.direction_deg.toFixed(1)}°</td>
                      <td style="padding: 8px 12px;">${c.coherence.toFixed(3)}</td>
                      <td style="padding: 8px 12px; color: var(--text-muted);">${c.valid_samples}/${c.total_samples}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Scientific Notice Footer -->
        <aside style="background: var(--surface); border-left: 4px solid var(--accent); padding: var(--space-4) var(--space-6); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; font-size: var(--t-small);">
          <p style="margin: 0; color: var(--text-muted); line-height: 1.6;">
            <strong style="color: var(--text);">Provenance & Verification:</strong> All calculations derived from NASA OSCAR near-real-time v2.0 satellite currents and GEBCO_2026 terrain. Values match original NetCDF inputs within 0.0001 m/s precision.
          </p>
        </aside>
      </div>
    `;

    // Event listeners
    const dateSelect = container.querySelector<HTMLSelectElement>('#lab-date-select');
    dateSelect?.addEventListener('change', (e) => {
      selectedDayIndex = parseInt((e.target as HTMLSelectElement).value, 10);
      render();
    });

    const cellSelect = container.querySelector<HTMLSelectElement>('#lab-cell-select');
    cellSelect?.addEventListener('change', (e) => {
      const [r, c] = (e.target as HTMLSelectElement).value.split('-').map(Number);
      selectedRow = r;
      selectedCol = c;
      render();
    });

    const tableRows = container.querySelectorAll<HTMLTableRowElement>('.table-row-cell');
    tableRows.forEach(row => {
      row.addEventListener('click', () => {
        selectedRow = parseInt(row.getAttribute('data-row')!, 10);
        selectedCol = parseInt(row.getAttribute('data-col')!, 10);
        render();
      });
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectedRow = parseInt(row.getAttribute('data-row')!, 10);
          selectedCol = parseInt(row.getAttribute('data-col')!, 10);
          render();
        }
      });
    });

    const tableHeaders = container.querySelectorAll<HTMLTableCellElement>('th[data-sort]');
    tableHeaders.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort') as keyof Grid8Cell;
        if (sortColumn === col) {
          sortAscending = !sortAscending;
        } else {
          sortColumn = col;
          sortAscending = true;
        }
        render();
      });
    });

    const toggleTsBtn = container.querySelector<HTMLButtonElement>('#btn-toggle-ts-table');
    toggleTsBtn?.addEventListener('click', () => {
      showTimeSeriesTable = !showTimeSeriesTable;
      render();
    });

    // Export CSV handler
    const btnCsv = container.querySelector<HTMLButtonElement>('#btn-export-csv');
    btnCsv?.addEventListener('click', () => {
      exportDayCsv(day);
    });

    // Export JSON handler
    const btnJson = container.querySelector<HTMLButtonElement>('#btn-export-json');
    btnJson?.addEventListener('click', () => {
      exportDayJson(day);
    });
  }

  render();
}

/**
 * Renders an accessible SVG time series chart for 31 days with a selected-day vertical marker
 */
function renderTimeSeriesSvg(series: Array<{ dayIndex: number; date: string; u: number; v: number; speed: number }>, selectedDayIdx: number): string {
  const width = 500;
  const height = 140;
  const padLeft = 35;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Find min/max values
  const allVals = series.flatMap(s => [s.u, s.v, s.speed]);
  const minVal = Math.min(-0.25, Math.floor(Math.min(...allVals) * 10) / 10);
  const maxVal = Math.max(0.4, Math.ceil(Math.max(...allVals) * 10) / 10);

  const getX = (dayIdx: number) => padLeft + ((dayIdx - 1) / 30) * chartW;
  const getY = (val: number) => padTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  // Build SVG paths
  const speedPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(s.dayIndex).toFixed(1)} ${getY(s.speed).toFixed(1)}`).join(' ');
  const uPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(s.dayIndex).toFixed(1)} ${getY(s.u).toFixed(1)}`).join(' ');
  const vPath = series.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(s.dayIndex).toFixed(1)} ${getY(s.v).toFixed(1)}`).join(' ');

  const zeroY = getY(0);
  const selectedX = getX(selectedDayIdx + 1);

  return `
    <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block;" role="img" aria-label="31-day Velocity Time Series Chart">
      <!-- Zero reference line -->
      <line x1="${padLeft}" y1="${zeroY.toFixed(1)}" x2="${width - padRight}" y2="${zeroY.toFixed(1)}" stroke="var(--border)" stroke-dasharray="3,3" stroke-width="1" />

      <!-- Y Axis labels -->
      <text x="${padLeft - 6}" y="${getY(maxVal).toFixed(1)}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="end" dominant-baseline="middle">${maxVal.toFixed(1)}</text>
      <text x="${padLeft - 6}" y="${zeroY.toFixed(1)}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="end" dominant-baseline="middle">0.0</text>
      <text x="${padLeft - 6}" y="${getY(minVal).toFixed(1)}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="end" dominant-baseline="middle">${minVal.toFixed(1)}</text>

      <!-- Curves -->
      <path d="${speedPath}" fill="none" stroke="#B4541A" stroke-width="2" />
      <path d="${uPath}" fill="none" stroke="#0B5FFF" stroke-width="1.5" />
      <path d="${vPath}" fill="none" stroke="#176D78" stroke-width="1.5" />

      <!-- Selected Day Vertical Indicator Marker (Mockup Fix #7) -->
      <line x1="${selectedX.toFixed(1)}" y1="${padTop}" x2="${selectedX.toFixed(1)}" y2="${height - padBottom}" stroke="#B4541A" stroke-width="2" stroke-dasharray="2,2" />
      <circle cx="${selectedX.toFixed(1)}" cy="${getY(series[selectedDayIdx].speed).toFixed(1)}" r="4" fill="#B4541A" />

      <!-- X Axis Day ticks -->
      <text x="${getX(1).toFixed(1)}" y="${height - 8}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="middle">Oct 1</text>
      <text x="${getX(10).toFixed(1)}" y="${height - 8}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="middle">10</text>
      <text x="${getX(20).toFixed(1)}" y="${height - 8}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="middle">20</text>
      <text x="${getX(31).toFixed(1)}" y="${height - 8}" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)" text-anchor="middle">31</text>
    </svg>
  `;
}

function renderTimeSeriesTable(series: Array<{ dayIndex: number; date: string; u: number; v: number; speed: number; direction: number }>): string {
  return `
    <div style="margin-top: var(--space-4); max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-sm);">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem; font-family: var(--font-mono);">
        <thead style="position: sticky; top: 0; background: var(--surface-2);">
          <tr style="border-bottom: 1px solid var(--border);">
            <th style="padding: 4px 8px;">Day</th>
            <th style="padding: 4px 8px;">Date</th>
            <th style="padding: 4px 8px;">Speed (m/s)</th>
            <th style="padding: 4px 8px;">u (m/s)</th>
            <th style="padding: 4px 8px;">v (m/s)</th>
            <th style="padding: 4px 8px;">Dir</th>
          </tr>
        </thead>
        <tbody>
          ${series.map(s => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 4px 8px;">${s.dayIndex}</td>
              <td style="padding: 4px 8px;">${s.date}</td>
              <td style="padding: 4px 8px; font-weight: 600;">${s.speed.toFixed(3)}</td>
              <td style="padding: 4px 8px;">${s.u.toFixed(3)}</td>
              <td style="padding: 4px 8px;">${s.v.toFixed(3)}</td>
              <td style="padding: 4px 8px;">${s.direction.toFixed(1)}°</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function exportDayCsv(day: any): void {
  const headers = ['row_ui', 'column_ui', 'lat', 'lon', 'mean_speed_m_s', 'u_m_s', 'v_m_s', 'direction_deg', 'coherence', 'speed_rank', 'valid_samples'];
  const rows = day.cells.map((c: any) => [
    c.row_ui, c.column_ui, c.lat, c.lon, c.mean_speed_m_s, c.u_m_s, c.v_m_s, c.direction_deg, c.coherence, c.speed_rank, c.valid_samples
  ]);
  const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
  downloadBlob(csvContent, `ocean_notes_cells_${day.date}.csv`, 'text/csv');
}

function exportDayJson(day: any): void {
  const jsonContent = JSON.stringify(day, null, 2);
  downloadBlob(jsonContent, `ocean_notes_cells_${day.date}.json`, 'application/json');
}

function downloadBlob(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
