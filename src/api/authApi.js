import { apiFetch } from "./apiClient.js";

/* ============================= */
/* LOGIN */
/* ============================= */
export async function authLogin({ email, password }) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "").trim();

  // Llama al backend
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: normalizedEmail,
      password: normalizedPassword
    })
  });

  // El backend guarda el token en cookie httpOnly
  // Aquí solo devolvemos el usuario
  return { user: response.user };
}


/* ============================= */
/* AUTH ME */
/* ============================= */
export async function authMe() {
  try {
    const user = await apiFetch("/auth/me", {
      method: "GET"
    });

    return {
      authenticated: true,
      user
    };

  } catch {
    return {
      authenticated: false,
      user: null
    };
  }
}


/* ============================= */
/* RECOVER PASSWORD */
/* ============================= */
export async function authRecoverPassword({ email }) {
  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email })
  });

  return { ok: true };
}


/* ============================= */
/* LOGOUT */
/* ============================= */
export async function authLogout() {
  await apiFetch("/auth/logout", {
    method: "POST"
  });

  return { ok: true };
}