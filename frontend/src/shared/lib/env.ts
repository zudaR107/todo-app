export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL;

  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim().replace(/\/+$/, '');
  }
  
  return '/api';
}
