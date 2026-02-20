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

  const users = await apiFetch(
    `/users?email=${encodeURIComponent(normalizedEmail)}`,
    { method: "GET" }
  );

  if (!Array.isArray(users) || users.length === 0) {
    throw new Error("Invalid credentials.");
  }

  const user = users[0];

  const dbPass = String(user.password ?? "").trim();

  if (dbPass !== normalizedPassword) {
    throw new Error("Invalid credentials.");
  }

  const session = {
    accessToken: generateMockToken(),
    refreshToken: generateMockToken(),
    user: {
      id: user.id,
      email: user.email,
      role: user.role || "candidate",
    },
  };

  saveSession(session, !!remember);

  return { user: session.user };
}

/* ============================= */
/* AUTH ME */
/* ============================= */
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
