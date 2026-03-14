import { registerCandidate } from "../api/authApi.js";

// Referencias al DOM.
const form        = document.querySelector("form.card");
const emailInput  = document.getElementById("email");
const passInput   = document.getElementById("password");
const confirmInput= document.getElementById("confirmPassword");
const submitBtn     = document.getElementById("submitBtn");
const errorBanner   = document.getElementById("error-banner");
const successBanner = document.getElementById("success-banner");

// Utilidades UI 
function showError(message) {
  errorBanner.textContent = message;
  errorBanner.hidden = false;
  successBanner.hidden = true;
}

function showSuccess(message) {
  successBanner.textContent = message;
  successBanner.hidden = false;
  errorBanner.hidden = true;
}

function clearBanners() {
  errorBanner.hidden = true;
  successBanner.hidden = true;
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

// Submit handler
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearBanners();

  const email           = emailInput.value.trim();
  const password        = passInput.value.trim();
  const confirmPassword = confirmInput.value.trim();

  setLoading(true);

  try {
    await registerCandidate({ email, password, confirmPassword });

    showSuccess("Account created! Redirecting to sign in…");

    // Redirige al login tras 1.5s (el token se guarda al loguearse)
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1500);

  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
});
