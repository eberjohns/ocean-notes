export function renderHome(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'content-container';

  page.innerHTML = `
    <section class="page-hero" aria-labelledby="hero-title">
      <div style="max-width: 800px;">
        <span class="text-muted" style="text-transform: uppercase; letter-spacing: 0.1em; font-size: var(--t-small); font-weight: 600;">
          An Ocean Sonification Experience
        </span>
        <h1 id="hero-title" style="font-size: var(--t-display); line-height: var(--lh-display); margin: var(--space-3) 0 var(--space-4) 0;">
          Hear the ocean move.
        </h1>
        <p class="page-lead" style="font-size: 1.25rem; margin-bottom: var(--space-6);">
          An evolving orchestral interpretation of real ocean-surface currents across the tropical Indian Ocean for October 2026.
        </p>

        <div style="display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-8);">
          <a href="#/explore" class="btn btn-primary" style="font-size: 1.125rem; padding: var(--space-3) var(--space-6); gap: var(--space-2);">
            <span aria-hidden="true">▶</span>
            <span>Explore the Indian Ocean</span>
          </a>
          <a href="#/how-it-works" class="btn btn-secondary" style="font-size: 1.125rem; padding: var(--space-3) var(--space-6);">
            How It Works
          </a>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: var(--space-6); padding: var(--space-4); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: var(--t-small);">
          <div>
            <div class="text-muted">Region</div>
            <div style="font-weight: 600;">Indian Ocean (10°S–10°N, 60°E–90°E)</div>
          </div>
          <div>
            <div class="text-muted">Period</div>
            <div style="font-weight: 600;">October 2026 (31 Days)</div>
          </div>
          <div>
            <div class="text-muted">Dataset</div>
            <div style="font-weight: 600;">NASA OSCAR L4 v2.0 (Near Real-Time)</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3 Cards: How Currents Become Notes -->
    <section style="margin: var(--space-12) 0;" aria-labelledby="sound-cards-title">
      <h2 id="sound-cards-title" style="font-size: var(--t-h2); margin-bottom: var(--space-6);">
        From currents to chords
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-6);">
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);">
          <div style="font-size: 1.75rem; margin-bottom: var(--space-2);" aria-hidden="true">🧭</div>
          <h3 style="font-size: var(--t-h3); margin-bottom: var(--space-2);">Direction is Pitch</h3>
          <p class="text-muted" style="font-size: var(--t-small);">
            16 compass sectors map deterministically to scale degrees across two octaves. Eastward equatorial jets sing higher tones; westward countercurrents fold into deeper basslines.
          </p>
        </div>

        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);">
          <div style="font-size: 1.75rem; margin-bottom: var(--space-2);" aria-hidden="true">🌊</div>
          <h3 style="font-size: var(--t-h3); margin-bottom: var(--space-2);">Speed is Loudness</h3>
          <p class="text-muted" style="font-size: var(--t-small);">
            Current velocity (0 to 1.0 m/s) drives synthesizer amplitude and note density on a perceptual square-root curve. Faster waters bring rhythmic energy and volume.
          </p>
        </div>

        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-6);">
          <div style="font-size: 1.75rem; margin-bottom: var(--space-2);" aria-hidden="true">🎧</div>
          <h3 style="font-size: var(--t-h3); margin-bottom: var(--space-2);">Longitude is Stereo Pan</h3>
          <p class="text-muted" style="font-size: var(--t-small);">
            Western columns (61.9°E near Africa) sound through the left channel; eastern columns (88.3°E near Indonesia) sound through the right, creating a spatial acoustic scan.
          </p>
        </div>
      </div>
    </section>

    <!-- Context: October Evolution -->
    <section style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-8); margin-bottom: var(--space-12);" aria-labelledby="context-title">
      <h2 id="context-title" style="font-size: var(--t-h2); margin-bottom: var(--space-3);">
        The Indian Ocean in October
      </h2>
      <p style="margin-bottom: var(--space-4); max-width: 800px; color: var(--text-muted);">
        Over October 2026, mean surface speed steadily builds from <strong style="color: var(--text);">0.157 m/s to 0.242 m/s</strong>, with peak currents accelerating from <strong style="color: var(--text);">0.35 m/s to 0.93 m/s</strong>. The month's changing currents build the composition naturally without artificial dynamic enhancement.
      </p>
      <div style="display: flex; gap: var(--space-4);">
        <a href="#/explore" class="btn btn-primary">Start Exploration</a>
        <a href="#/lab" class="btn btn-secondary">Inspect Source Data</a>
      </div>
    </section>
  `;

  return page;
}
