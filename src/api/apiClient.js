// ── API Client ──────────────────────────────────────────────────────
// Wrapper centralizado para llamadas HTTP con autenticación JWT.
// Cuando el backend esté listo, cambia BASE_URL.

const BASE_URL = 'http://localhost:3000'; // apuntando a json-server

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
