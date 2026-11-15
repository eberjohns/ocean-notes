export function renderHowItWorks(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'content-container';

  page.innerHTML = `
    <header class="page-hero">
      <span class="text-muted" style="text-transform: uppercase; letter-spacing: 0.05em; font-size: var(--t-small); font-weight: 600;">
        Methodology & Sonification
      </span>
      <h1 class="page-title">From currents to composition.</h1>
      <p class="page-lead">
        We transform real NASA satellite-derived ocean surface currents into a living orchestral composition through an open, mathematically deterministic process.
      </p>
    </header>

    <!-- 4 Pipeline Stages -->
    <section style="display: flex; flex-direction: column; gap: var(--space-8); margin-bottom: var(--space-12);" aria-labelledby="stages-title">
      <h2 id="stages-title" class="sr-only">Four Stages of Data Sonification</h2>

      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #06131F; font-weight: 700; font-size: var(--t-small);">01</span>
          <h3 style="font-size: var(--t-h3);">Collect: NASA OSCAR L4 Current Vectors</h3>
        </div>
        <p class="text-muted" style="line-height: var(--lh-body); margin-bottom: var(--space-3);">
          Daily surface current velocity fields (<code class="font-mono">u</code> eastward, <code class="font-mono">v</code> northward in m/s) are obtained from the NASA OSCAR Level 4 near-real-time v2.0 dataset via PO.DAAC. The data is model-derived from satellite sea surface height altimetry, ocean vector scatterometer surface winds, and in-situ drifting buoy trajectories.
        </p>
        <div class="font-mono text-muted" style="font-size: var(--t-small); background: rgba(0,0,0,0.2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm);">
          Source: 81 lat × 121 lon grid = 9,801 points daily (9,641 valid marine points).
        </div>
      </div>

      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #06131F; font-weight: 700; font-size: var(--t-small);">02</span>
          <h3 style="font-size: var(--t-h3);">Map: Dual Spatial Resolution Architecture</h3>
        </div>
        <p class="text-muted" style="line-height: var(--lh-body); margin-bottom: var(--space-3);">
          Visual particles are driven directly by the raw 0.25° fine grid (<code class="font-mono">fine-uv.bin</code>) for seamless fluid advection. For audio synthesis, the domain is partitioned into an 8×8 grid of 64 acoustic cells. This 8×8 resolution is a deliberate musical decision: an 8-column arpeggiator structure allows the ear to cleanly resolve distinct musical voices without sonic cacophony.
        </p>
        <div class="font-mono text-muted" style="font-size: var(--t-small); background: rgba(0,0,0,0.2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm);">
          Cell speed = Mean of point speeds (scalar energy preserved, avoiding vector cancellation).
        </div>
      </div>

      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #06131F; font-weight: 700; font-size: var(--t-small);">03</span>
          <h3 style="font-size: var(--t-h3);">Translate: Deterministic Sonification Rules</h3>
        </div>
        <p class="text-muted" style="line-height: var(--lh-body); margin-bottom: var(--space-3);">
          Physical variables map directly to acoustic parameters with zero random variance:
        </p>
        <ul style="list-style-position: inside; color: var(--text-muted); line-height: 1.8;">
          <li><strong style="color: var(--text);">Direction (atan2(v, u)):</strong> Quantized into 16 compass sectors (22.5° each) mapped to pitch classes across two octaves.</li>
          <li><strong style="color: var(--text);">Latitude (-10°S to +10°N):</strong> Southern cells play low root registers; northern cells play higher registers across 3 octaves.</li>
          <li><strong style="color: var(--text);">Speed (0 to 1.0 m/s):</strong> Drives synthesizer gain and note velocity on a perceptual square-root curve.</li>
          <li><strong style="color: var(--text);">Longitude (61.9°E to 88.3°E):</strong> Mapped directly to stereo pan from full-left to full-right.</li>
          <li><strong style="color: var(--text);">Directional Coherence:</strong> Ratio of vector mean to point speed controls chord thickness (clean harmonic intervals for laminar flows, dense clusters for turbulent eddies).</li>
        </ul>
      </div>

      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);">
        <div style="display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3);">
          <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: var(--accent); color: #06131F; font-weight: 700; font-size: var(--t-small);">04</span>
          <h3 style="font-size: var(--t-h3);">Compose: The Orchestral Arc</h3>
        </div>
        <p class="text-muted" style="line-height: var(--lh-body);">
          The piece runs at 110 BPM in 4/4 time. Each day of October corresponds to exactly 4 musical bars (~8.72 seconds), spanning 124 bars over ~4 minutes and 30 seconds. In bars 1–3, the 8 columns arpeggiate from West to East; in bar 4, the column voices sustain into a collective daily chord. The natural strengthening of October currents produces a natural crescendo.
        </p>
      </div>
    </section>

    <!-- Data vs Arrangement Separation Table -->
    <section style="margin-bottom: var(--space-12);" aria-labelledby="table-title">
      <h2 id="table-title" style="font-size: var(--t-h2); margin-bottom: var(--space-4);">
        Data Encoding vs. Arrangement Choices
      </h2>
      <p class="text-muted" style="margin-bottom: var(--space-6);">
        To preserve scientific integrity, the interface and provenance documentation strictly separate what is dictated by the data from what is chosen in the musical arrangement.
      </p>

      <div style="overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: var(--t-small);">
          <thead>
            <tr style="border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.2);">
              <th style="padding: var(--space-3) var(--space-4);">Parameter</th>
              <th style="padding: var(--space-3) var(--space-4);">Data Encoding (Fixed by Numbers)</th>
              <th style="padding: var(--space-3) var(--space-4);">Arrangement (Artistic Choice)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: var(--space-3) var(--space-4); font-weight: 600;">Pitch Class</td>
              <td style="padding: var(--space-3) var(--space-4);">Current direction in 16 sectors</td>
              <td style="padding: var(--space-3) var(--space-4);">Dorian modal scale (switchable to Pentatonic/Whole Tone)</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: var(--space-3) var(--space-4); font-weight: 600;">Pitch Register</td>
              <td style="padding: var(--space-3) var(--space-4);">Latitude (-8.75° to +8.875°) across 3 octaves</td>
              <td style="padding: var(--space-3) var(--space-4);">Base frequency anchor (D2 = 73.4 Hz)</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: var(--space-3) var(--space-4); font-weight: 600;">Loudness & Attack</td>
              <td style="padding: var(--space-3) var(--space-4);">Mean speed (0 to 1.0 m/s sqrt curve)</td>
              <td style="padding: var(--space-3) var(--space-4);">Master volume ceiling (-12 dBFS) & brickwall limiter</td>
            </tr>
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: var(--space-3) var(--space-4); font-weight: 600;">Stereo Position</td>
              <td style="padding: var(--space-3) var(--space-4);">Longitude (61.9°E to 88.3°E)</td>
              <td style="padding: var(--space-3) var(--space-4);">Equal-power stereo panner curve</td>
            </tr>
            <tr>
              <td style="padding: var(--space-3) var(--space-4); font-weight: 600;">Tone & Timbre</td>
              <td style="padding: var(--space-3) var(--space-4);">Cell speed distribution percentile</td>
              <td style="padding: var(--space-3) var(--space-4);">Synthesizer voicings: Pad, Sine Lead, Filtered Pulse, Sub Bass</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;

  return page;
}
