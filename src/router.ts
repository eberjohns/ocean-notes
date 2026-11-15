import { store } from './state.ts';
import { renderHome } from './pages/Home.ts';
import { renderExplorer } from './pages/Explorer.ts';
import { renderHowItWorks } from './pages/HowItWorks.ts';
import { renderLab } from './pages/Lab.ts';
import { renderAbout } from './pages/About.ts';

type PageRenderer = () => HTMLElement;

interface RouteDefinition {
  title: string;
  render: PageRenderer;
}

const routes: Record<string, RouteDefinition> = {
  '/': {
    title: 'Ocean Notes | Hear the Ocean Move',
    render: renderHome
  },
  '/explore': {
    title: 'Regional Explorer | Ocean Notes',
    render: renderExplorer
  },
  '/how-it-works': {
    title: 'How It Works | Ocean Notes',
    render: renderHowItWorks
  },
  '/lab': {
    title: 'Research Lab | Ocean Notes',
    render: renderLab
  },
  '/about': {
    title: 'About & Provenance | Ocean Notes',
    render: renderAbout
  }
};

export class Router {
  private mountEl: HTMLElement;

  constructor(mountEl: HTMLElement) {
    this.mountEl = mountEl;
    window.addEventListener('hashchange', () => this.handleNavigation());
  }

  init(): void {
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this.handleNavigation();
    }
  }

  navigate(path: string): void {
    window.location.hash = path.startsWith('#') ? path : `#${path}`;
    this.handleNavigation();
  }

  private handleNavigation(): void {
    const rawHash = window.location.hash.slice(1);
    const fullPath = rawHash.startsWith('/') ? rawHash : `/${rawHash}`;
    const cleanPath = fullPath.split('?')[0];
    const route = routes[cleanPath] || routes['/'];

    store.setRoute(cleanPath in routes ? cleanPath : '/');

    // Update body route class for full-viewport app styling
    document.body.className = `route-${cleanPath.replace('/', '') || 'home'}`;

    // Update document title
    document.title = route.title;

    // Render page
    this.mountEl.innerHTML = '';
    const pageEl = route.render();
    this.mountEl.appendChild(pageEl);

    // Focus management for accessible keyboard navigation
    this.mountEl.setAttribute('tabindex', '-1');
    this.mountEl.focus();

    // Scroll to top if supported
    if (typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0, behavior: 'instant' });
      } catch {
        // Fallback for environments lacking smooth/instant scroll options
        window.scrollTo(0, 0);
      }
    }
  }
}
