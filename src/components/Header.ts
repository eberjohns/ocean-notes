import { store, type AppState } from '../state.ts';

export function createHeader(): HTMLElement {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.setAttribute('role', 'banner');

  header.innerHTML = `
    <div class="header-inner">
      <a href="#/" class="brand" aria-label="Ocean Notes Home">
        <svg class="brand-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M4 10 C8 6, 12 14, 16 10 C20 6, 24 14, 28 10" />
          <path d="M4 16 C8 12, 12 20, 16 16 C20 12, 24 20, 28 16" />
          <path d="M4 22 C8 18, 12 26, 16 22 C20 18, 24 26, 28 22" />
        </svg>
        <span>Ocean Notes</span>
      </a>

      <nav class="site-nav" aria-label="Main Navigation">
        <ul class="nav-list">
          <li><a href="#/" class="nav-link" data-route="/">Home</a></li>
          <li><a href="#/explore" class="nav-link" data-route="/explore">Explore</a></li>
          <li><a href="#/how-it-works" class="nav-link" data-route="/how-it-works">How It Works</a></li>
          <li><a href="#/lab" class="nav-link" data-route="/lab">Lab</a></li>
          <li><a href="#/about" class="nav-link" data-route="/about">About</a></li>
        </ul>
      </nav>

      <div class="header-actions">
        <!-- Mockup Fix #8: Pair of direct links for Public (Explore) vs Research (Lab) -->
        <div class="mode-pill" role="navigation" aria-label="Experience Mode">
          <a href="#/explore" class="mode-pill-link" id="pill-public" data-route="/explore">Public</a>
          <a href="#/lab" class="mode-pill-link" id="pill-research" data-route="/lab">Research</a>
        </div>

        <!-- Mute Button -->
        <button type="button" class="audio-toggle-btn" id="header-mute-btn" aria-label="Mute audio">
          <span id="mute-icon" aria-hidden="true">🔊</span>
          <span id="mute-label">Audio</span>
        </button>
      </div>
    </div>
  `;

  // Update active navigation state
  store.subscribe((state: AppState) => {
    const navLinks = header.querySelectorAll<HTMLAnchorElement>('.nav-link');
    navLinks.forEach(link => {
      const route = link.getAttribute('data-route');
      if (route === state.currentRoute) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    const pillPublic = header.querySelector<HTMLAnchorElement>('#pill-public');
    const pillResearch = header.querySelector<HTMLAnchorElement>('#pill-research');

    if (state.currentRoute === '/lab') {
      pillResearch?.setAttribute('aria-current', 'page');
      pillPublic?.removeAttribute('aria-current');
    } else {
      pillPublic?.setAttribute('aria-current', 'page');
      pillResearch?.removeAttribute('aria-current');
    }

    const muteBtn = header.querySelector<HTMLButtonElement>('#header-mute-btn');
    const muteIcon = header.querySelector<HTMLSpanElement>('#mute-icon');
    const muteLabel = header.querySelector<HTMLSpanElement>('#mute-label');

    if (state.isMuted) {
      if (muteIcon) muteIcon.textContent = '🔇';
      if (muteLabel) muteLabel.textContent = 'Muted';
      muteBtn?.setAttribute('aria-label', 'Unmute audio');
    } else {
      if (muteIcon) muteIcon.textContent = state.soundOptIn ? '🔊' : '🔈';
      if (muteLabel) muteLabel.textContent = state.soundOptIn ? 'Sound On' : 'Sound Off';
      muteBtn?.setAttribute('aria-label', state.soundOptIn ? 'Mute audio' : 'Turn on sound');
    }
  });

  const muteBtn = header.querySelector<HTMLButtonElement>('#header-mute-btn');
  muteBtn?.addEventListener('click', () => {
    store.toggleMute();
  });

  return header;
}
