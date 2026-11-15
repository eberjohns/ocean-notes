import './styles/tokens.css';
import './styles/fonts.css';
import './styles/base.css';
import './styles/layout.css';

import { createHeader } from './components/Header.ts';
import { createSoundBanner } from './components/SoundBanner.ts';
import { createFooter } from './components/Footer.ts';
import { Router } from './router.ts';

function initApp(): void {
  const appContainer = document.getElementById('app');
  if (!appContainer) {
    throw new Error('Root #app container not found in DOM.');
  }

  // Clear container
  appContainer.innerHTML = '';

  // 1. Mount Header
  const header = createHeader();
  appContainer.appendChild(header);

  // 2. Mount Sound Opt-in Banner
  const soundBanner = createSoundBanner();
  appContainer.appendChild(soundBanner);

  // 3. Mount Main Content Region
  const main = document.createElement('main');
  main.id = 'main-content';
  main.setAttribute('role', 'main');
  appContainer.appendChild(main);

  // 4. Mount Footer
  const footer = createFooter();
  appContainer.appendChild(footer);

  // 5. Initialize Client Router
  const router = new Router(main);
  router.init();

  console.log(
    '%c Earth Information Jukebox %c Initialized Step 1: Foundations ',
    'background: #103C4A; color: #6BE1D0; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;',
    'background: #06131F; color: #E7F1ED; padding: 4px 8px; border-radius: 0 4px 4px 0;'
  );
}

// Bootstrap on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
