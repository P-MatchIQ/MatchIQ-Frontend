const DEFAULT_BASE_URL = "http://localhost:3005"; // json-server

export async function apiFetch(path, options = {}) {
  const url = `${DEFAULT_BASE_URL}${path}`;

  // TODO (BACKEND REAL):
  // Cuando uses cookies httpOnly, agrega:
  //   credentials: "include"
  // y configura CORS del backend si hay dominios distintos.
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
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
