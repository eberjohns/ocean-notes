export function renderAbout(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'content-container';

  page.innerHTML = `
    <header class="page-hero">
      <span class="text-muted" style="text-transform: uppercase; letter-spacing: 0.05em; font-size: var(--t-small); font-weight: 600;">
        About & Scientific Provenance
      </span>
      <h1 class="page-title">Ocean Notes</h1>
      <p class="page-lead">
        A static web application developed for the NASA Space Apps Challenge 2026, translating NASA ocean satellite datasets into an evolving orchestral experience you can see, hear, and analytically audit.
      </p>
    </header>

    <div style="display: flex; flex-direction: column; gap: var(--space-8); margin-bottom: var(--space-12);">
      
      <!-- Scientific Honesty & Data Limits -->
      <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="limits-title">
        <h2 id="limits-title" style="font-size: var(--t-h2); margin-bottom: var(--space-3);">Scientific Limits & Honest Data Statement</h2>
        <p class="text-muted" style="line-height: var(--lh-body); margin-bottom: var(--space-3);">
          <strong>Model-Derived Currents:</strong> The ocean surface current data utilized in this project originates from the NASA OSCAR (Ocean Surface Current Analysis Real-time) Level 4 near-real-time v2.0 product. OSCAR currents are derived from a simplified physical diagnostic model combining satellite radar altimeter sea surface height, satellite scatterometer ocean wind fields, and thermal gradients, tuned against in-situ drifting buoys. They represent averaged 0–30 meter surface layer flow, not a direct in-situ current meter observation.
        </p>
        <p class="text-muted" style="line-height: var(--lh-body); margin-bottom: var(--space-3);">
          <strong>Sonification as Interpretation:</strong> While the mapping between physical variables and acoustic synthesis parameters is strictly deterministic and mathematical, musical scales, instrumental timbres, and tempo are aesthetic arrangement choices. No sound exists without a visible and written numeric counterpart.
        </p>
        <p class="text-muted" style="line-height: var(--lh-body);">
          <strong>Spatial and Temporal Scope:</strong> The dataset is constrained to the tropical Indian Ocean (10°S to 10°N, 60°E to 90°E) for the 31 days of October 2026. Ocean dynamics in this region reflect the transition into the northeast monsoon with equatorial jet development.
        </p>
      </section>

      <!-- Credits and Formal Citations -->
      <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="citations-title">
        <h2 id="citations-title" style="font-size: var(--t-h2); margin-bottom: var(--space-4);">Data Sources & Citations</h2>
        
        <div style="display: flex; flex-direction: column; gap: var(--space-4); font-size: var(--t-small); line-height: 1.6;">
          <div>
            <h3 style="font-size: var(--t-h3); margin-bottom: var(--space-1);">Bathymetry</h3>
            <p class="text-muted">
              GEBCO Bathymetric Compilation Group 2026 (2026). The GEBCO_2026 Grid - a continuous terrain model for oceans and land at 15 arc-second intervals. 
              <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener noreferrer">doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa</a>
            </p>
          </div>

          <div>
            <h3 style="font-size: var(--t-h3); margin-bottom: var(--space-1);">Ocean Surface Currents</h3>
            <p class="text-muted">
              NASA Physical Oceanography Distributed Active Archive Center (PO.DAAC). Ocean Surface Current Analysis Real-time (OSCAR) Level 4 Near-Real-Time 0.25 Degree Velocity v2.0. 
              <a href="https://doi.org/10.5067/OSCAR-25N20" target="_blank" rel="noopener noreferrer">doi:10.5067/OSCAR-25N20</a>
            </p>
          </div>

          <div>
            <h3 style="font-size: var(--t-h3); margin-bottom: var(--space-1);">Open Typography</h3>
            <p class="text-muted">
              This application strictly self-hosts open-licensed fonts under the SIL Open Font License (OFL 1.1):
              <strong>Sora</strong> (by Jonathan Barnbrook, Julieta Ulanovsky), 
              <strong>Inter</strong> (by Rasmus Andersson), and 
              <strong>IBM Plex Mono</strong> (by Mike Abbink, Bold Monday).
            </p>
          </div>
        </div>
      </section>

      <!-- Accessibility Statement -->
      <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);" aria-labelledby="a11y-title">
        <h2 id="a11y-title" style="font-size: var(--t-h2); margin-bottom: var(--space-3);">Accessibility Statement</h2>
        <p class="text-muted" style="line-height: var(--lh-body); margin-bottom: var(--space-3);">
          Ocean Notes is engineered to conform strictly to <strong>WCAG 2.2 Level AA</strong>:
        </p>
        <ul style="list-style-position: inside; color: var(--text-muted); line-height: 1.8;">
          <li><strong>Non-Visual Path:</strong> All 64 acoustic grid cells are fully navigable via standard keyboard controls with ARIA grid roles and polite live regions announcing exact coordinates and velocities.</li>
          <li><strong>Sound Optionality:</strong> Audio is completely disabled by default. The Web Audio context is only initialized upon an explicit user interaction. All information conveyed by sound has visual and written text counterparts.</li>
          <li><strong>Contrast Compliance:</strong> Every color pair across both the Public Dark and Research Light themes is pre-verified using an automated contrast checking script ensuring minimum 4.5:1 for body copy and 3.0:1 for large display text and UI components.</li>
          <li><strong>Reduced Motion:</strong> Full respect for <code class="font-mono">prefers-reduced-motion</code>, replacing 3D camera dives with gentle crossfades and substituting animated particles with static directional vector arrows.</li>
        </ul>
      </section>
    </div>
  `;

  return page;
}

