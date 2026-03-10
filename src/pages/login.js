import { authLogin, authMe, /* authRecoverPassword  */} from "../api/authApi.js";

const $ = (sel) => document.querySelector(sel);

function setText(el, txt) {
  if (!el) return;
  el.textContent = txt || "";
}

function setAlert(el, message, type = "info") {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
  el.classList.toggle("is-error", type === "error");
}

function setLoading(buttonEl, isLoading) {
  if (!buttonEl) return;
  buttonEl.classList.toggle("is-loading", isLoading);
  buttonEl.disabled = isLoading;
}

function redirectAfterLogin(user) {
  const role = user?.role;

  const pending = sessionStorage.getItem("redirectTo");
  if (pending) {
    sessionStorage.removeItem("redirectTo");
    window.location.href = pending;
    return;
  }

  if (role === "admin") window.location.href = "./admin/dashboard.html";
  else if (role === "company") window.location.href = "./company/dashboard.html";
  else window.location.href = "./candidate/dashboard.html";
}

async function redirectIfAuthenticated() {
  // Si ya hay sesión mock, no mostramos login: redirigimos.
  try {
    const me = await authMe();
    if (me?.authenticated && me.user) redirectAfterLogin(me.user);
  } catch {
    // si falla, dejamos que se muestre el login
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // ELEMENTOS LOGIN
  const loginForm = $("#loginForm");
  const emailInput = $("#email");
  const passwordInput = $("#password");
  const rememberMeInput = $("#rememberMe");
  const emailError = $("#emailError");
  const passwordError = $("#passwordError");
  const loginAlert = $("#loginAlert");
  const loginSubmitBtn = $("#loginSubmitBtn");
  const loginSuccessHint = $("#loginSuccessHint");
  const goRecoverBtn = $("#goRecoverBtn");

  // ELEMENTOS RECOVER
  const recoverForm = $("#recoverForm");
  const recoverEmailInput = $("#recoverEmail");
  const recoverEmailError = $("#recoverEmailError");
  const recoverAlert = $("#recoverAlert");
  const recoverSubmitBtn = $("#recoverSubmitBtn");
  const recoverSuccessHint = $("#recoverSuccessHint");
  const backToLoginBtn = $("#backToLoginBtn");

  // Si tus IDs no existen, te aviso en consola (esto te ayuda a depurar rápido)
  if (!loginForm || !emailInput || !passwordInput) {
    console.warn("[login.js] Missing required login elements. Check IDs in login.html");
    return;
  }

  // Redirección empresarial: si ya hay sesión, no se ve el login
  await redirectIfAuthenticated();

  function clearErrors() {
    setText(emailError, "");
    setText(passwordError, "");
    setText(recoverEmailError, "");
  }

  function showRecover() {
    clearErrors();
    setAlert(loginAlert, "");
    if (loginSuccessHint) loginSuccessHint.hidden = true;

    if (loginForm) loginForm.hidden = true;
    if (recoverForm) recoverForm.hidden = false;
  }

  function showLogin() {
    clearErrors();
    setAlert(recoverAlert, "");
    if (recoverSuccessHint) recoverSuccessHint.hidden = true;

    if (recoverForm) recoverForm.hidden = true;
    if (loginForm) loginForm.hidden = false;
  }

  function validateLogin() {
    let ok = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      setText(emailError, "Email is required.");
      ok = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setText(emailError, "Please enter a valid email.");
      ok = false;
    }

    if (!password) {
      setText(passwordError, "Password is required.");
      ok = false;
    }

    return ok;
  }

  function validateRecover() {
    let ok = true;
    const email = recoverEmailInput?.value.trim() || "";

    if (!email) {
      setText(recoverEmailError, "Email is required.");
      ok = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      setText(recoverEmailError, "Please enter a valid email.");
      ok = false;
    }
    return ok;
  }

  goRecoverBtn?.addEventListener("click", showRecover);
  backToLoginBtn?.addEventListener("click", showLogin);

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    setAlert(loginAlert, "");
    if (loginSuccessHint) loginSuccessHint.hidden = true;

    if (!validateLogin()) {
      setAlert(loginAlert, "Please fix the highlighted fields.", "error");
      return;
    }

    setLoading(loginSubmitBtn, true);

    try {
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const remember = !!rememberMeInput?.checked;

      // ✅ MOCK (json-server)
      // TODO (BACKEND REAL): POST /auth/login with credentials:"include" (httpOnly cookies)
      const result = await authLogin({ email, password, remember });

      if (loginSuccessHint) loginSuccessHint.hidden = false;
      redirectAfterLogin(result.user);
    } catch (err) {
      setAlert(loginAlert, err?.message || "Login failed. Please try again.", "error");
    } finally {
      setLoading(loginSubmitBtn, false);
    }
  });

  recoverForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    setAlert(recoverAlert, "");
    if (recoverSuccessHint) recoverSuccessHint.hidden = true;

    if (!validateRecover()) {
      setAlert(recoverAlert, "Please fix the highlighted fields.", "error");
      return;
    }

    setLoading(recoverSubmitBtn, true);

    try {
      const email = recoverEmailInput.value.trim();

      // ✅ MOCK
      // TODO (BACKEND REAL): POST /auth/forgot-password
      await authRecoverPassword({ email });

      if (recoverSuccessHint) recoverSuccessHint.hidden = false;
      setAlert(recoverAlert, "If the email exists, recovery instructions were sent.", "info");
    } catch (err) {
      setAlert(recoverAlert, err?.message || "Recovery failed. Please try again.", "error");
    } finally {
      setLoading(recoverSubmitBtn, false);
    }
  });
});
