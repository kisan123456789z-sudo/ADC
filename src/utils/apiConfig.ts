/**
 * API Configuration Helper
 * Allows frontend to connect to local Express server (/api/*)
 * or a remote backend URL (e.g. VITE_API_BASE_URL=https://api.example.com) when hosted statically on GitHub Pages.
 */
export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  // When running on GitHub Pages (github.io), forward API calls to the live Cloud Run backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return 'https://ais-pre-og4a3djs6rc3avj7n7ll3e-849735471452.asia-east1.run.app';
  }
  return '';
};

export const apiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

