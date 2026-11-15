/**
 * Resolves static asset URLs relative to Vite's configured BASE_URL.
 * Supports root deployments ('/') as well as GitHub Pages subpaths ('/ocean-notes/').
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
}
