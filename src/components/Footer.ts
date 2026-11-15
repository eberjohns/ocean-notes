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
        <div>
          <span>Earth Information Jukebox · NASA Space Apps Challenge 2026</span>
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
