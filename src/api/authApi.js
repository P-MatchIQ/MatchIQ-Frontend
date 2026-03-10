import { apiFetch } from "./apiClient.js";

const SESSION_KEY = "matchiq_session_mock";

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  (remember ? sessionStorage : localStorage).removeItem(SESSION_KEY);
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function generateMockToken() {
  return `mock_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

/* ============================= */
/* LOGIN */
/* ============================= */
export async function authLogin({ email, password, remember }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();

  // POST al endpoint /login del backend
  const response = await apiFetch(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        email: normalizedEmail,
        password: normalizedPassword,
      }),
    }
  );

  // El backend retorna: { accessToken, refreshToken, user: { id, email, role } }
  const session = {
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    user: response.user,
  };

  saveSession(session, !!remember);

  return { user: session.user };
}


// ── Auth Me ───────────────────────────────────────────────────────────────────
export async function authMe() {
  const session = loadSession();
  if (!session?.user) {
    return { authenticated: false, user: null };
  }
  return { authenticated: true, user: session.user };
}

/* ============================= */
/* RECOVER PASSWORD */
/* ============================= */
export async function authRecoverPassword({ email }) {
  await apiFetch(
    `/users?email=${encodeURIComponent(String(email).trim().toLowerCase())}`,
    { method: "GET" }
  );
  return { ok: true };
}

/* ============================= */
/* LOGOUT */
/* ============================= */
export async function authLogout() {
  clearSession();
  return { ok: true };
}
