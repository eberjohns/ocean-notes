export function createFooter(): HTMLElement {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.setAttribute('role', 'contentinfo');

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-citations">
        <p><strong>Ocean Currents:</strong> NASA OSCAR (Ocean Surface Current Analysis Real-time) Level 4 near-real-time v2.0, distributed by NASA PO.DAAC. Model-derived from satellite altimetry, scatterometer winds, and in-situ drifter measurements.</p>
        <p style="margin-top: 8px;"><strong>Bathymetry:</strong> GEBCO Bathymetric Compilation Group 2026 (2026). The GEBCO_2026 Grid - a continuous terrain model for oceans and land at 15 arc-second intervals. <a href="https://doi.org/10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa" target="_blank" rel="noopener noreferrer">doi:10.5285/4f68d5c7-45eb-f999-e063-7086abc036fa</a></p>
      </div>

      <div class="footer-bottom">
        <div style="display: flex; align-items: center; gap: var(--space-2);">
          <svg style="width: 20px; height: 20px; color: var(--accent);" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="50" cy="50" r="38" />
            <circle cx="50" cy="50" r="26" />
            <path d="M50 34V66" />
            <path d="M41 41V59" />
            <path d="M59 38V62" />
          </svg>
          <span>Ocean Notes · NASA Space Apps Challenge 2026</span>
        </div>
        <div style="display: flex; gap: var(--space-4);">
          <a href="#/how-it-works">How It Works</a>
          <a href="#/about">Scientific Provenance & Citations</a>
          <a href="#/lab">Research Lab</a>
        </div>
      </div>
    </div>
  `;

  return footer;
}

