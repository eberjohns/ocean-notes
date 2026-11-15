import { TopographyWave } from '../components/effects/TopographyWave.ts';
import { GhostCursor } from '../components/effects/GhostCursor.ts';

export function renderAbout(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'info-page-container';

  page.innerHTML = `
    <!-- Topography Wave Visual Background Host at bottom -->
    <div class="page-topography-host" id="about-topography" aria-hidden="true"></div>

    <!-- Page Hero (Unboxed, Proportional Typography) -->
    <header class="info-page-hero">
      <div class="info-hero-eyebrow">
        <span class="info-eyebrow-text">ABOUT THE PROJECT</span>
        <span class="info-eyebrow-line" aria-hidden="true"></span>
      </div>
      <h1 class="info-hero-title">Ocean Notes</h1>
      <p class="info-hero-lead">
        A NASA Space Apps Challenge 2026 project that translates real ocean-surface currents into an evolving, data-driven orchestral experience you can see, hear, and analytically audit.
      </p>
      
      <div class="info-hero-actions">
        <a href="https://www.spaceappschallenge.org" target="_blank" rel="noopener noreferrer" class="btn-hero-primary" style="padding: 12px 22px;">
          <span>NASA Space Apps Challenge</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
          </svg>
        </a>
        <a href="#/how-it-works" class="btn-secondary-glass">
          <span>View Project Docs</span>
        </a>
      </div>
    </header>

    <!-- 3 Metric Highlights Cards -->
    <section class="about-metrics-row" aria-label="Key Project Metrics">
      <!-- Metric 1: Indian Ocean -->
      <div class="about-metric-card">
        <svg class="about-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <div>
          <div class="about-metric-title">Indian Ocean</div>
          <div class="about-metric-sub">10&deg;S &ndash; 10&deg;N &nbsp;&bull;&nbsp; 60&deg;E &ndash; 90&deg;E</div>
        </div>
      </div>

      <!-- Metric 2: October 2026 -->
      <div class="about-metric-card">
        <svg class="about-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <div>
          <div class="about-metric-title">October 2026</div>
          <div class="about-metric-sub">31 days &nbsp;&bull;&nbsp; 4:30 composition</div>
        </div>
      </div>

      <!-- Metric 3: NASA OSCAR + GEBCO -->
      <div class="about-metric-card">
        <svg class="about-metric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <div>
          <div class="about-metric-title">NASA OSCAR L4 v2.0</div>
          <div class="about-metric-sub">+ GEBCO 2026 bathymetry</div>
        </div>
      </div>
    </section>

    <!-- 2x2 Grid of Detailed Cards -->
    <div class="about-grid-2x2">
      <!-- Card 1: Scientific Limits & Honest Data Statement -->
      <section class="about-panel" aria-labelledby="limits-heading">
        <h2 id="limits-heading" class="about-panel-title">Scientific Limits & Honest Data Statement</h2>
        
        <div class="about-item-stack">
          <!-- Item 1: Model-Derived Currents -->
          <div class="about-item">
            <svg class="about-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
              <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
            </svg>
            <div>
              <div class="about-item-title">Model-Derived Currents</div>
              <p class="about-item-desc">
                The ocean surface currents are from the NASA OSCAR (Ocean Surface Current Analysis Real-time) Level 4 near-real-time v2.0 product. They are model-derived from satellite altimetry, scatterometer winds, and in-situ drifter data, and represent ~0&ndash;30 m surface layer flow.
              </p>
            </div>
          </div>

          <!-- Item 2: Sonification as Interpretation -->
          <div class="about-item">
            <svg class="about-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <div>
              <div class="about-item-title">Sonification as Interpretation</div>
              <p class="about-item-desc">
                The mapping from physical variables to sound is strictly deterministic and mathematical. Musical scales, timbres, and arrangement are aesthetic choices. No sound exists without a visible and written numerical counterpart.
              </p>
            </div>
          </div>

          <!-- Item 3: Spatial and Temporal Scope -->
          <div class="about-item">
            <svg class="about-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="22" y1="12" x2="18" y2="12"/>
              <line x1="6" y1="12" x2="2" y2="12"/>
              <line x1="12" y1="6" x2="12" y2="2"/>
              <line x1="12" y1="22" x2="12" y2="18"/>
            </svg>
            <div>
              <div class="about-item-title">Spatial and Temporal Scope</div>
              <p class="about-item-desc">
                The dataset is constrained to the tropical Indian Ocean (10&deg;S to 10&deg;N, 60&deg;E to 90&deg;E) for the 31 days of October 2026. Ocean dynamics in this region reflect the transition into the northeast monsoon with equatorial jet development.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Card 2: Data Sources & Citations -->
      <section class="about-panel" aria-labelledby="citations-heading">
        <h2 id="citations-heading" class="about-panel-title">Data Sources & Citations</h2>

        <div class="about-item-stack">
          <!-- Bathymetry (Non-negotiable Rule 12 GEBCO citation) -->
          <div class="about-item">
            <svg class="about-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M8 3l4 8 5-5 5 15H2L8 3z"/>
            </svg>
            <div>
              <div class="about-item-title">Bathymetry</div>
              <p class="about-item-desc">
                GEBCO Bathymetric Compilation Group 2026 (2026). The GEBCO_2026 Grid - a continuous terrain model for oceans and land at 15 arc-second intervals.
              </p>
              <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener noreferrer" class="about-link">
                <span>doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa</span>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Ocean Surface Currents -->
          <div class="about-item">
            <svg class="about-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 12h20M2 12l5-5M2 12l5 5"/>
            </svg>
            <div>
              <div class="about-item-title">Ocean Surface Currents</div>
              <p class="about-item-desc">
                NASA PO.DAAC. Ocean Surface Current Analysis Real-time (OSCAR) Level 4 near-real-time 0.25&deg; velocity v2.0.
              </p>
              <a href="https://doi.org/10.5067/OSCAR-25N20" target="_blank" rel="noopener noreferrer" class="about-link">
                <span>doi:10.5067/OSCAR-25N20</span>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
            </div>
          </div>

          <!-- Open Typography -->
          <div class="about-item">
            <svg class="about-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.5 16h5M12 8v8"/>
            </svg>
            <div>
              <div class="about-item-title">Open Typography</div>
              <p class="about-item-desc">
                Fonts under SIL Open Font License (OFL 1.1): <strong>Sora</strong>, <strong>Inter</strong>, and <strong>IBM Plex Mono</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Card 3: Accessibility -->
      <section class="about-panel" aria-labelledby="a11y-heading">
        <div class="about-item" style="gap: 16px;">
          <div class="about-metric-icon" style="width: 32px; height: 32px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="4" r="2"/>
              <path d="M5 9h14M12 9v11M9 20l3-5 3 5"/>
            </svg>
          </div>
          <div>
            <h2 id="a11y-heading" class="about-panel-title" style="margin-bottom: 8px;">Accessibility</h2>
            <p class="about-item-desc">
              Engineered to <strong>WCAG 2.2 Level AA</strong>, with full keyboard navigation, screen-reader support, high-contrast themes, and a reduced-motion mode that replaces particle animations with static directional vectors.
            </p>
          </div>
        </div>
      </section>

      <!-- Card 4: Acknowledgements -->
      <section class="about-panel" aria-labelledby="ack-heading">
        <div class="about-item" style="gap: 16px;">
          <div class="about-metric-icon" style="width: 32px; height: 32px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div>
            <h2 id="ack-heading" class="about-panel-title" style="margin-bottom: 8px;">Acknowledgements</h2>
            <p class="about-item-desc">
              Built for the NASA Space Apps Challenge 2026, using open NASA PO.DAAC data and GEBCO bathymetry. We acknowledge the teams and communities that make these open datasets possible.
            </p>
          </div>
        </div>
      </section>

      <!-- Card 5: Super Intelligence (SI) & AI Assistance Disclosure -->
      <section class="about-panel" aria-labelledby="si-heading" style="grid-column: 1 / -1;">
        <div class="about-item" style="gap: 16px;">
          <div class="about-metric-icon" style="width: 32px; height: 32px; color: var(--accent);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <div style="flex: 1;">
            <h2 id="si-heading" class="about-panel-title" style="margin-bottom: 8px;">Super Intelligence (SI) & AI Assistance Disclosure</h2>
            <p class="about-item-desc" style="margin-bottom: 12px;">
              In accordance with NASA Space Apps Challenge regulations, Super Intelligence (SI) tools were utilized to accelerate development and innovation. Generated content strictly omits and does not contain or modify any NASA logos, flags, or mission identifiers.
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; font-size: var(--t-small); line-height: 1.5; color: var(--text-muted);">
              <div>
                <strong style="color: var(--text);">Tools Used:</strong> Anthropic Claude, OpenAI ChatGPT, and Google Antigravity.
              </div>
              <div>
                <strong style="color: var(--text);">Images & Imagery:</strong> The planetary horizon background is SI-generated and bears a visible watermark.
              </div>
              <div>
                <strong style="color: var(--text);">Audio & Synthesis:</strong> Web Audio DSP synthesis architecture, polyphony management, and scale mapping were designed and verified with AI assistance.
              </div>
              <div>
                <strong style="color: var(--text);">Code & Data Processing:</strong> Data pipeline decoders, WebGL Three.js shaders, and automated test harnesses were authored with AI assistance.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  // Mount ReactBits-inspired interactive effects: TopographyWave & GhostCursor
  const prefersReducedMotion = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  let waveEffect: TopographyWave | null = null;
  let ghostCursor: GhostCursor | null = null;

  if (!prefersReducedMotion) {
    const topoHost = page.querySelector<HTMLElement>('#about-topography');
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
