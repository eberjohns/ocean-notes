import { store } from '../state.ts';
import { audioEngine } from '../audio/engine.ts';

export function renderHome(): HTMLElement {
  const page = document.createElement('div');
  page.className = 'home-page-container';

  page.innerHTML = `
    <!-- Dynamic Globe Visual Background Layer -->
    <div class="home-globe-layer" id="home-globe-layer" aria-hidden="true">
      <div class="home-globe-visual" id="home-globe-visual"></div>
      <div class="home-globe-ambient"></div>
    </div>

    <!-- Hero Viewport -->
    <section class="home-hero-viewport" aria-labelledby="hero-title">
      <div class="home-hero-inner">
        
        <!-- Top / Main Hero Content Block -->
        <div class="home-hero-main" id="home-hero-content">
          <!-- Eyebrow -->
          <div class="hero-eyebrow">
            <span class="hero-eyebrow-text">AN OCEAN SONIFICATION EXPERIENCE</span>
            <span class="hero-eyebrow-line" aria-hidden="true"></span>
          </div>

          <!-- Display Headline (Sora typography) -->
          <h1 class="hero-headline" id="hero-title">Hear the <span class="headline-block">ocean move.</span></h1>

          <!-- Lead Description -->
          <p class="hero-lead">
            An evolving orchestral interpretation of real ocean-surface currents across the tropical Indian Ocean.
          </p>

          <!-- Action Buttons -->
          <div class="hero-actions">
            <a href="#/explore" class="btn-hero-primary" id="btn-hero-explore" aria-label="Explore the Indian Ocean regional map">
              <span>Explore the Indian Ocean</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#/how-it-works" class="hero-text-link" id="link-hero-how-it-works">
              <span>How it works</span>
            </a>
          </div>

          <!-- Coordinates Callout (Unboxed, Vertical Accent Line) -->
          <div class="hero-coordinates-callout">
            <div class="hero-callout-bar" aria-hidden="true"></div>
            <div class="hero-callout-text font-mono">
              <div class="hero-coords-line">INDIAN OCEAN &nbsp;&bull;&nbsp; 10&deg;S&ndash;10&deg;N &nbsp;&bull;&nbsp; 60&deg;E&ndash;90&deg;E</div>
              <div class="hero-coords-subline">OCTOBER 2026 &nbsp;&bull;&nbsp; 31 DAYS</div>
            </div>
          </div>
        </div>

        <!-- Bottom Telemetry & Scroll Cue (Unboxed Spacing) -->
        <div class="home-hero-footer" id="home-hero-footer">
          <div class="hero-meta-group">
            <div class="hero-meta-item">
              <span class="hero-meta-label">REGION</span>
              <span class="hero-meta-val">Tropical Indian Ocean</span>
            </div>

            <div class="hero-meta-item">
              <span class="hero-meta-label">DATA</span>
              <span class="hero-meta-val">NASA OSCAR L4 v2.0</span>
            </div>

            <div class="hero-meta-item">
              <span class="hero-meta-label">COMPOSITION</span>
              <span class="hero-meta-val">31 days &nbsp;&bull;&nbsp; 4:30</span>
            </div>
          </div>

          <!-- Right Side: Scroll to Explore Cue -->
          <a href="#/explore" class="hero-scroll-cue" id="hero-scroll-cue" aria-label="Scroll to explore regional ocean map">
            <span class="hero-scroll-text">SCROLL TO EXPLORE</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="scroll-chevron" aria-hidden="true">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </a>
        </div>

      </div>
    </section>
  `;

  // Meaningful Cinematic Globe-Dive Motion Transition
  let isNavigating = false;
  const triggerDiveTransition = (targetHash = '#/explore') => {
    if (isNavigating) return;
    isNavigating = true;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      window.location.hash = targetHash;
      return;
    }

    const globeVisual = page.querySelector<HTMLElement>('#home-globe-visual');
    const heroContent = page.querySelector<HTMLElement>('#home-hero-content');
    const heroFooter = page.querySelector<HTMLElement>('#home-hero-footer');

    globeVisual?.classList.add('is-diving');
    heroContent?.classList.add('is-diving');
    heroFooter?.classList.add('is-diving');

    // Subtle audio cue if sound is active
    if (!store.getState().isMuted && audioEngine.isInitialized()) {
      try {
        const ctx = audioEngine.getAudioContext();
        if (ctx && ctx.state === 'running') {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(293.66, ctx.currentTime); // D4 resonant harmonic
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch {
        // AudioContext may not be active yet, gracefully ignore
      }
    }

    setTimeout(() => {
      window.location.hash = targetHash;
    }, 450);
  };

  // Bind explore buttons to transition
  const exploreBtn = page.querySelector<HTMLAnchorElement>('#btn-hero-explore');
  exploreBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    triggerDiveTransition('#/explore');
  });

  const scrollCue = page.querySelector<HTMLAnchorElement>('#hero-scroll-cue');
  scrollCue?.addEventListener('click', (e) => {
    e.preventDefault();
    triggerDiveTransition('#/explore');
  });

  // Wheel and swipe down trigger dive transition into regional map
  const onWheel = (e: WheelEvent) => {
    if (isNavigating) return;
    if (e.deltaY > 25) {
      window.removeEventListener('wheel', onWheel);
      triggerDiveTransition('#/explore');
    }
  };
  window.addEventListener('wheel', onWheel, { passive: true });

  let touchStartY = 0;
  const onTouchStart = (e: TouchEvent) => {
    if (e.touches && e.touches[0]) {
      touchStartY = e.touches[0].clientY;
    }
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (isNavigating) return;
    if (e.changedTouches && e.changedTouches[0]) {
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (deltaY > 50) { // Swiped up (scrolling down)
        window.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchend', onTouchEnd);
        triggerDiveTransition('#/explore');
      }
    }
  };
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });

  return page;
}
