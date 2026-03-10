const DEFAULT_BASE_URL = "http://localhost:3005";

function getToken() {
  return localStorage.getItem("matchiq_token") || sessionStorage.getItem("matchiq_token");
}

export async function apiFetch(path, options = {}) {
  const url = `${DEFAULT_BASE_URL}${path}`;
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    credentials: "include",
    headers,
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