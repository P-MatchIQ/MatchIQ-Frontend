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


/** Register Candidate */
export async function registerCandidate({ email, password, confirmPassword }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();
  const normalizedConfirm = String(confirmPassword ?? "").trim();

  // Validaciones en cliente antes de ir al backend
  if (!normalizedEmail || !normalizedPassword || !normalizedConfirm) {
    throw new Error("All fields are required.");
  }

  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (normalizedPassword !== normalizedConfirm) {
    throw new Error("Passwords do not match.");
  }

    // POST /auth/register/candidate
  // El backend retorna: { token }
  const response = await apiFetch("/auth/register/candidate", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      confirmPassword: normalizedConfirm,
    }),
  });

  // Guardamos sesión automáticamente (el backend ya loguea al registrar)
  const session = {
    accessToken: response.token,
    user: {
      email: normalizedEmail,
      role: "candidate",
    },
  };

  saveSession(session, true);

  return { user: session.user };
}


/** Register Company */
export async function registerCompany({ email, password, confirmPassword }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();
  const normalizedConfirm = String(confirmPassword ?? "").trim();

  // Validaciones en cliente antes de ir al backend
  if (!normalizedEmail || !normalizedPassword || !normalizedConfirm) {
    throw new Error("All fields are required.");
  }

  if (normalizedPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  if (normalizedPassword !== normalizedConfirm) {
    throw new Error("Passwords do not match.");
  }

  // POST /auth/register/company
  // El backend retorna: { token }
  const response = await apiFetch("/auth/register/company", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      confirmPassword: normalizedConfirm,
    }),
  });

  // Guardamos sesión automáticamente
  const session = {
    accessToken: response.token,
    user: {
      email: normalizedEmail,
      role: "company",
    },
  };

  saveSession(session, true);

  return { user: session.user };
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
