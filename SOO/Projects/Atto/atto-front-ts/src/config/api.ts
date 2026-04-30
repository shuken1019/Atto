export const API_BASE_URL = (() => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return String(envUrl).replace(/\/+$/, '');

  if (typeof window !== 'undefined') {
    // Default to same-origin so Nginx can proxy /api to backend.
    return '';
  }

  return 'https://api.atto.live';
})();
