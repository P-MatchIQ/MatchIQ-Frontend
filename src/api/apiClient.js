// ── API Client ──────────────────────────────────────────────────────
// Wrapper centralizado para llamadas HTTP con autenticación JWT.

if (window.location.hostname === "127.0.0.1") {
  window.location.href = window.location.href.replace("127.0.0.1", "localhost");
}

const DEFAULT_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:3005"
  : "https://matchiq-backend-production.up.railway.app";

/**
 * Cliente HTTP principal. Compatible con ambos nombres: fetchApi y apiFetch.
 * @param {string} path - Ruta relativa (ej: '/offers')
 * @param {object} options  - Opciones de fetch (method, body, etc.)
 * @returns {Promise<any>}
 */
export async function apiFetch(path, options = {}) {
  const url = `${DEFAULT_BASE_URL}${path}`;
  const token = localStorage.getItem('token');

  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {})
    },
    ...options,
  });

  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Alias: fetchApi === apiFetch (compatibilidad con módulo company)
export { apiFetch as fetchApi };
  if (window.location.hostname === "127.0.0.1") {
    window.location.href = window.location.href.replace("127.0.0.1", "localhost");
  }

  const DEFAULT_BASE_URL = window.location.hostname === "localhost"
    ? "http://localhost:3005"
    : "https://tubackend.up.railway.app";

  export async function apiFetch(path, options = {}) {
    const url = `${ DEFAULT_BASE_URL }${ path }`;

    const res = await fetch(url, {
      credentials: "include", // ← esto envía la cookie automáticamente
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options,
    });

    let data = null;
    const text = await res.text();

    try { data = text ? JSON.parse(text) : null; } catch { data = text || null; }

    if (!res.ok) {
      const message =
        (data && (data.message || data.error)) ||
        `Request failed (${ res.status })`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  }
