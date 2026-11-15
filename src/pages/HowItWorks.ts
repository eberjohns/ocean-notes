import { TopographyWave } from '../components/effects/TopographyWave.ts';
import { GhostCursor } from '../components/effects/GhostCursor.ts';

export function renderHowItWorks(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'info-page-container';

  page.innerHTML = `
    <!-- Topography Wave Visual Background Host at bottom -->
    <div class="page-topography-host" id="how-it-works-topography" aria-hidden="true"></div>

    <!-- Page Hero (Unboxed, Proportional Typography) -->
    <header class="info-page-hero">
      <div class="info-hero-eyebrow">
        <span class="info-eyebrow-text">METHODOLOGY & SONIFICATION</span>
        <span class="info-eyebrow-line" aria-hidden="true"></span>
      </div>
      <h1 class="info-hero-title">From currents to composition.</h1>
      <p class="info-hero-lead">
        A transparent, data-driven process that turns real ocean surface currents into a 4½-minute orchestral composition.
      </p>
    </header>

    <!-- 4 Pipeline Stages Row with Connecting Track -->
    <section class="pipeline-track-wrapper" aria-labelledby="pipeline-heading">
      <h2 id="pipeline-heading" class="sr-only">Four-Stage Sonification Pipeline</h2>
      <div class="pipeline-track-line" aria-hidden="true"></div>

      <div class="pipeline-cards-grid">
        <!-- Step 01: Collect (Active in Mockup) -->
        <div class="pipeline-card is-active">
          <div class="pipeline-card-header">
            <span class="pipeline-badge">01</span>
            <svg class="pipeline-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
          <h3 class="pipeline-card-title">Collect</h3>
          <div class="pipeline-card-highlight">NASA OSCAR L4</div>
          <span class="sr-only">Collect: NASA OSCAR</span>
          <p class="pipeline-card-desc">surface currents (u, v)</p>
        </div>

        <!-- Step 02: Map -->
        <div class="pipeline-card">
          <div class="pipeline-card-header">
            <span class="pipeline-badge">02</span>
            <svg class="pipeline-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <h3 class="pipeline-card-title">Map</h3>
          <p class="pipeline-card-desc">Dual spatial resolution: 0.25° fine grid (visual) and 8×8 grid (audio)</p>
        </div>

        <!-- Step 03: Translate -->
        <div class="pipeline-card">
          <div class="pipeline-card-header">
            <span class="pipeline-badge">03</span>
            <svg class="pipeline-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 10v4M6 6v12M10 3v18M14 8v8M18 5v14M22 10v4"/>
            </svg>
          </div>
          <h3 class="pipeline-card-title">Translate</h3>
          <p class="pipeline-card-desc">Deterministic rules that map physical variables to musical parameters</p>
        </div>

        <!-- Step 04: Compose -->
        <div class="pipeline-card">
          <div class="pipeline-card-header">
            <span class="pipeline-badge">04</span>
            <svg class="pipeline-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <h3 class="pipeline-card-title">Compose</h3>
          <p class="pipeline-card-desc">A 31-day orchestral piece at 110 BPM (4 bars per day)</p>
        </div>
      </div>
    </section>

    <!-- Two-Column Section: The Sonification Mapping & The Musical Framework -->
    <div class="methodology-two-col">
      <!-- Left Column: The Sonification Mapping -->
      <section aria-labelledby="mapping-heading">
        <div class="col-header">
          <h2 id="mapping-heading" class="col-title">The Sonification Mapping</h2>
          <p class="col-sub">Each ocean property is converted to a specific musical element using fixed, reproducible rules.</p>
        </div>

        <div class="mapping-rows-list">
          <!-- Row 1: Direction -->
          <div class="mapping-row-item">
            <div class="mapping-row-left">
              <div class="mapping-row-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                </svg>
              </div>
              <div>
                <div class="mapping-prop-title">Direction (θ)</div>
                <div class="mapping-prop-sub">atan2(v, u) &rarr; 16 sectors (22.5&deg; each)</div>
              </div>
            </div>
            <div class="mapping-arrow" aria-hidden="true">&rarr;</div>
            <div class="mapping-row-right">
              <div class="mapping-target-title">Pitch class</div>
              <div class="mapping-target-sub">(2 octaves)</div>
            </div>
          </div>

          <!-- Row 2: Latitude -->
          <div class="mapping-row-item">
            <div class="mapping-row-left">
              <div class="mapping-row-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                  <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
                </svg>
              </div>
              <div>
                <div class="mapping-prop-title">Latitude (&phi;)</div>
                <div class="mapping-prop-sub">-10&deg;S to +10&deg;N</div>
              </div>
            </div>
            <div class="mapping-arrow" aria-hidden="true">&rarr;</div>
            <div class="mapping-row-right">
              <div class="mapping-target-title">Register</div>
              <div class="mapping-target-sub">(3 octaves)</div>
            </div>
          </div>

          <!-- Row 3: Speed -->
          <div class="mapping-row-item">
            <div class="mapping-row-left">
              <div class="mapping-row-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <div>
                <div class="mapping-prop-title">Speed (S)</div>
                <div class="mapping-prop-sub">0 to 1.0 m/s (&radic;S curve)</div>
              </div>
            </div>
            <div class="mapping-arrow" aria-hidden="true">&rarr;</div>
            <div class="mapping-row-right">
              <div class="mapping-target-title">Loudness & note density</div>
              <div class="mapping-target-sub">Dynamic Gain</div>
            </div>
          </div>

          <!-- Row 4: Longitude -->
          <div class="mapping-row-item">
            <div class="mapping-row-left">
              <div class="mapping-row-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 11l4-4-4-4M21 7H3M7 13l-4 4 4 4M3 17h18"/>
                </svg>
              </div>
              <div>
                <div class="mapping-prop-title">Longitude (&lambda;)</div>
                <div class="mapping-prop-sub">61.9&deg;E to 88.3&deg;E</div>
              </div>
            </div>
            <div class="mapping-arrow" aria-hidden="true">&rarr;</div>
            <div class="mapping-row-right">
              <div class="mapping-target-title">Stereo pan</div>
              <div class="mapping-target-sub">(left to right)</div>
            </div>
          </div>

          <!-- Row 5: Coherence -->
          <div class="mapping-row-item">
            <div class="mapping-row-left">
              <div class="mapping-row-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="6" cy="6" r="3"/>
                  <circle cx="18" cy="6" r="3"/>
                  <circle cx="12" cy="18" r="3"/>
                  <line x1="8.5" y1="7.5" x2="10.5" y2="15.5"/>
                  <line x1="15.5" y1="7.5" x2="13.5" y2="15.5"/>
                </svg>
              </div>
              <div>
                <div class="mapping-prop-title">Coherence (C)</div>
                <div class="mapping-prop-sub">|V&#772;| / S&#772; (0 to 1)</div>
              </div>
            </div>
            <div class="mapping-arrow" aria-hidden="true">&rarr;</div>
            <div class="mapping-row-right">
              <div class="mapping-target-title">Harmonic density</div>
              <div class="mapping-target-sub">(consonant &rarr; dissonant)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column: The Musical Framework -->
      <section aria-labelledby="framework-heading">
        <div class="col-header">
          <h2 id="framework-heading" class="col-title">The Musical Framework</h2>
          <p class="col-sub">Architectural structure ensuring acoustic balance and musical coherence.</p>
        </div>

        <div class="framework-cards-list">
          <!-- Framework 1: Tempo & Meter -->
          <div class="framework-card">
            <div class="framework-card-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 22 22 22 12 2"/>
                <line x1="12" y1="11" x2="18" y2="7"/>
              </svg>
            </div>
            <div>
              <div class="framework-card-title">Tempo & Meter</div>
              <div class="framework-card-value">110 BPM &nbsp;&bull;&nbsp; 4/4 time</div>
            </div>
          </div>

          <!-- Framework 2: Structure -->
          <div class="framework-card">
            <div class="framework-card-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </div>
            <div>
              <div class="framework-card-title">Structure</div>
              <div class="framework-card-value">4 bars per day &nbsp;&bull;&nbsp; 31 days &nbsp;&bull;&nbsp; &approx; 4:30 total</div>
            </div>
          </div>

          <!-- Framework 3: Scales -->
          <div class="framework-card">
            <div class="framework-card-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div>
              <div class="framework-card-title">Scales</div>
              <div class="framework-card-value">Dorian (default) &nbsp;&bull;&nbsp; Pentatonic &nbsp;&bull;&nbsp; Whole Tone</div>
            </div>
          </div>

          <!-- Framework 4: Synthesizer Voices -->
          <div class="framework-card">
            <div class="framework-card-icon-wrap" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 13.5V10.5M6 16.5V7.5M10 20.5V3.5M14 17.5V6.5M18 19.5V4.5M22 13.5V10.5"/>
              </svg>
            </div>
            <div>
              <div class="framework-card-title">Synthesizer Voices</div>
              <div class="framework-card-value">Pad &nbsp;&bull;&nbsp; Lead &nbsp;&bull;&nbsp; Pulse &nbsp;&bull;&nbsp; Bass (16-voice polyphony)</div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Data vs. Arrangement Separation Table (Ensuring Scientific Auditability) -->
    <section class="about-panel" style="margin-top: clamp(32px, 4vw, 48px);" aria-labelledby="table-title">
      <h2 id="table-title" class="about-panel-title">
        Data Encoding vs. Arrangement Choices
      </h2>
      <p class="about-item-desc" style="margin-bottom: var(--space-4);">
        To preserve scientific integrity, our interface and documentation strictly separate what is dictated by the satellite data from what is chosen in the musical arrangement.
      </p>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.875rem;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(107, 225, 208, 0.2); background: rgba(0,0,0,0.25);">
              <th style="padding: 12px 16px; color: var(--accent);">Parameter</th>
              <th style="padding: 12px 16px; color: var(--accent);">Data Encoding (Fixed by Numbers)</th>
              <th style="padding: 12px 16px; color: var(--accent);">Arrangement (Artistic Choice)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 12px 16px; font-weight: 600; color: var(--text);">Pitch Class</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Current direction in 16 sectors (atan2(v, u))</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Dorian modal scale (switchable to Pentatonic/Whole Tone)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 12px 16px; font-weight: 600; color: var(--text);">Pitch Register</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Latitude (-8.75&deg; to +8.875&deg;) across 3 octaves</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Bass octave in South, lead and pad in North</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 12px 16px; font-weight: 600; color: var(--text);">Loudness & Velocity</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Current speed S in m/s (&radic;S scaling)</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Master dynamics range, limiter threshold</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 12px 16px; font-weight: 600; color: var(--text);">Stereo Pan</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Longitude 61.9&deg;E to 88.3&deg;E mapped from -1.0 to +1.0</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Linear equal-power stereo panner</td>
            </tr>
            <tr>
              <td style="padding: 12px 16px; font-weight: 600; color: var(--text);">Harmonic Density</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Directional coherence (|V&#772;| / S&#772;) 0.0 to 1.0</td>
              <td style="padding: 12px 16px; color: var(--text-muted);">Clean consonances for laminar flow, clusters for eddies</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `;

  // Mount ReactBits-inspired interactive effects: TopographyWave & GhostCursor
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  let waveEffect: TopographyWave | null = null;
  let ghostCursor: GhostCursor | null = null;

  if (!prefersReducedMotion) {
    const topoHost = page.querySelector<HTMLElement>('#how-it-works-topography');
    if (topoHost) {
      waveEffect = new TopographyWave(topoHost);
    }
    ghostCursor = new GhostCursor(page);
  }

  // Cleanup observers when page detached from DOM
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!document.body.contains(page)) {
        waveEffect?.destroy();
        ghostCursor?.destroy();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  return page;
}
