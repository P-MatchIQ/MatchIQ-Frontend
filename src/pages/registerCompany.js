import { registerCompany } from "../api/authApi.js";

// Referencias al DOM
const form          = document.querySelector("form.card");
const emailInput    = document.getElementById("email");
const passInput     = document.getElementById("password");
const confirmInput  = document.getElementById("confirmPassword");
const submitBtn     = document.querySelector(".btn--primary");
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
  submitBtn.textContent = isLoading ? "Creating account…" : "Create Corporate Account →";
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
    await registerCompany({ email, password, confirmPassword });

    showSuccess("Corporate account created! Redirecting to your dashboard…");

    // Redirige al dashboard de la empresa tras 1.5s
    setTimeout(() => {
      window.location.href = "./company/dashboard.html";
    }, 1500);

  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
});
