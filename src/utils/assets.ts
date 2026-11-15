/**
 * Resolves static asset URLs relative to Vite's configured BASE_URL.
 * Supports root deployments ('/'), local Node test runners, and GitHub Pages subpaths ('/ocean-notes/').
 */
export function assetUrl(path: string): string {
  const envBase = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.BASE_URL) as string | undefined;
  const base = envBase || '/';
  const cleanPath = path.replace(/^(\.\/|\/)/, '');
  return base.endsWith('/') ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
}
