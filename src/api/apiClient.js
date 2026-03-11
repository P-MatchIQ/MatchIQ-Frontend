// ── API Client ──────────────────────────────────────────────────────
// Wrapper centralizado para llamadas HTTP con autenticación JWT.

const BASE_URL = 'http://localhost:3005';

/**
 * Realiza una petición HTTP con headers de autenticación.
 * @param {string} endpoint - Ruta relativa (ej: '/offers')
 * @param {object} options  - Opciones de fetch (method, body, etc.)
 * @returns {Promise<any>}
 */
export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  // 204 No Content
  if (response.status === 204) return null;

  return response.json();
}

/**
 * Completa el perfil de un candidato.
 * @param {object} profileData - Datos del perfil
 * @returns {Promise<object>}
 */
export async function completeProfile(profileData) {
  return fetchApi('/candidate/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  });
}

// Alias para compatibilidad con otros módulos que importan 'apiFetch'
export { fetchApi as apiFetch };