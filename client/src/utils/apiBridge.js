/**
 * Puente transparente para Despliegue en Nube (PLAN.md Sección 2.F.1 - Vercel + Render).
 * - En entorno local o servidor Express unificado (VITE_API_URL vacío), mantiene las rutas '/api/...' intactas.
 * - En Vercel apuntando a un backend externo (Render/Railway), antepone automáticamente VITE_API_URL.
 */
const rawBaseUrl = import.meta.env.VITE_API_URL;
const API_BASE_URL = typeof rawBaseUrl === 'string' ? rawBaseUrl.trim().replace(/\/+$/, '') : '';

if (API_BASE_URL && typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return nativeFetch(`${API_BASE_URL}${input}`, init);
    }
    return nativeFetch(input, init);
  };
}
