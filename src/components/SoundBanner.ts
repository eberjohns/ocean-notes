import { store, type AppState } from '../state.ts';
import { audioEngine } from '../audio/engine.ts';

export function createSoundBanner(): HTMLElement {
  const banner = document.createElement('aside');
  banner.className = 'sound-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Audio Playback Preference');

  banner.innerHTML = `
    <div class="sound-banner-text">
      <span aria-hidden="true">🎵</span>
      <span>Experience ocean currents as evolving sound. Sound is off by default.</span>
    </div>
    <div class="sound-banner-actions">
      <button type="button" class="btn btn-primary" id="btn-sound-on">
        Turn on sound
      </button>
      <button type="button" class="btn btn-secondary" id="btn-sound-silent">
        Continue silent
      </button>
    </div>
  `;

  const btnOn = banner.querySelector<HTMLButtonElement>('#btn-sound-on');
  const btnSilent = banner.querySelector<HTMLButtonElement>('#btn-sound-silent');

  btnOn?.addEventListener('click', async () => {
    store.setSoundOptIn(true);
    try {
      await audioEngine.init();
      audioEngine.setMuted(false);
    } catch (err) {
      console.warn('AudioContext init error:', err);
    }
  });

  btnSilent?.addEventListener('click', () => {
    store.setSoundOptIn(false);
    audioEngine.setMuted(true);
  });

  store.subscribe((state: AppState) => {
    // Hide banner once user has made an explicit choice
    if (state.soundOptIn !== null) {
      banner.style.display = 'none';
    } else {
      banner.style.display = 'flex';
    }
  });

  return banner;
}
