import { apiFetch } from "./apiClient.js";

const SESSION_KEY = "matchiq_session";

function saveSession(user, remember = true) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(user));
  (remember ? sessionStorage : localStorage).removeItem(SESSION_KEY);
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ── Registro candidato ────────────────────────────────────────────────────────
export async function registerCandidate({ email, password, confirmPassword }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();
  const normalizedConfirm = String(confirmPassword ?? "").trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedConfirm) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (normalizedPassword.length < 6) {
    throw new Error("La contraseña debe tener mínimo 6 caracteres.");
  }
  if (normalizedPassword !== normalizedConfirm) {
    throw new Error("Las contraseñas no coinciden.");
  }

  // El backend devuelve { token } y la cookie se guarda automáticamente
  await apiFetch("/auth/register/candidate", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      confirmPassword: normalizedConfirm,
    }),
  });

  // Guardamos el usuario en localStorage para saber el rol
  const user = { email: normalizedEmail, role: "candidate" };
  saveSession(user, true);

  return { user };
}

// ── Registro empresa ──────────────────────────────────────────────────────────
export async function registerCompany({ email, password, confirmPassword }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();
  const normalizedConfirm = String(confirmPassword ?? "").trim();

  if (!normalizedEmail || !normalizedPassword || !normalizedConfirm) {
    throw new Error("Todos los campos son obligatorios.");
  }
  if (normalizedPassword.length < 6) {
    throw new Error("La contraseña debe tener mínimo 6 caracteres.");
  }
  if (normalizedPassword !== normalizedConfirm) {
    throw new Error("Las contraseñas no coinciden.");
  }

  await apiFetch("/auth/register/company", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      confirmPassword: normalizedConfirm,
    }),
  });

  const user = { email: normalizedEmail, role: "company" };
  saveSession(user, true);

  return { user };
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function authLogin({ email, password, remember }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();

  // El backend devuelve { user: { id, email, role } }
  // El token va en la cookie automáticamente
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword,
      rememberMe: !!remember,
    }),
  });

  // Guardamos solo el user en localStorage para saber el rol sin llamar al backend
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("matchiq_token", response.token);
  saveSession(response.user, !!remember);

  return { user: response.user };
}

// ── Auth Me ───────────────────────────────────────────────────────────────────
export async function authMe() {
  try {
    // Pregunta al backend si la cookie es válida
    const response = await apiFetch("/auth/me", { method: "GET" });

    if (response?.authenticated && response.user) {
      saveSession(response.user, true);
      return { authenticated: true, user: response.user };
    }

    clearSession();
    return { authenticated: false, user: null };

  } catch {
    clearSession();
    return { authenticated: false, user: null };
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function authLogout() {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } catch {}
  localStorage.removeItem("matchiq_token");
  sessionStorage.removeItem("matchiq_token");
  clearSession();
  return { ok: true };
}

// ── Obtener sesión local (sin llamar al backend) ───────────────────────────────
export function getSession() {
  return loadSession();
}