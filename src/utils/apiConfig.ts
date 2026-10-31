/**
 * API Configuration Helper
 * Allows frontend to connect to local Express server (/api/*)
 * or a remote backend URL (e.g. VITE_API_BASE_URL=https://api.example.com) when hosted statically on GitHub Pages.
 */
export const getApiBaseUrl = (): string => {
  return (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
};

export const apiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
