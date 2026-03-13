import { authMe, authLogout } from "../../api/authApi.js";
import {
  getCandidateProfile,
  updateCandidateProfile,
  updateCandidateCategories,
  updateCandidateSkills,
  getCategories,
  getSkillsByCategory,
} from "../../api/candidateApi.js";

const $ = (sel) => document.querySelector(sel);

// ── Estado global ─────────────────────────────────────────────────────────────
const state = {
  user: null,
  profile: null,
  categories: [],
  allSkills: [],
  selectedCategories: [],
  selectedSkills: [],
};

// ── Utilidades ────────────────────────────────────────────────────────────────
function setAlert(el, message, type = "info") {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
  el.className = `alert${type === "error" ? " is-error" : ""}`;
}

function renderTags(container, values = []) {
  if (!container) return;
  container.innerHTML = "";
  if (!values.length) {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = "No definido";
    container.appendChild(span);
    return;
  }
  values.forEach((v) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = v;
    container.appendChild(span);
  });
}

function calculateCompleteness(profile) {
  if (!profile) return 0;
  const checks = [
    !!profile.first_name,
    !!profile.last_name,
    Array.isArray(profile.categories) && profile.categories.length > 0,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    profile.experience_years != null,
    !!profile.english_level,
    !!profile.seniority,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function isProfileComplete(profile) {
  return (
    !!profile.first_name &&
    !!profile.last_name &&
    profile.categories?.length > 0 &&
    profile.skills?.length > 0
  );
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function ensureCandidateAccess() {
  const me = await authMe();
  if (!me?.authenticated || !me?.user) {
    window.location.href = "/public/login.html";
    return null;
  }
  if (me.user.role !== "candidate") {
    window.location.href = "/public/login.html";
    return null;
  }
  return me.user;
}

// ── Render perfil ─────────────────────────────────────────────────────────────
function renderProfile(profile) {
  $("#welcomeText").textContent = `Hola, ${profile.first_name || "Candidato"}`;
  $("#experienceValue").textContent = profile.experience_years != null ? `${profile.experience_years} años` : "-";
  $("#englishValue").textContent = profile.english_level || "-";
  $("#seniorityValue").textContent = profile.seniority || "-";

  const completeness = calculateCompleteness(profile);
  $("#profileCompletenessValue").textContent = `${completeness}%`;

  // Summary cards — clear skeletons
  $("#totalOffersValue").textContent = "—";
  $("#bestMatchValue").textContent = "—";

  renderTags($("#categoriesTags"), (profile.categories || []).map((c) => c.name));
  renderTags($("#skillsTags"), (profile.skills || []).map((s) => s.name));
}

// ── Catálogo ──────────────────────────────────────────────────────────────────
async function loadSkillsForCategories(categoryIds) {
  const skillsMap = {};
  await Promise.all(
    categoryIds.map(async (id) => {
      const skills = await getSkillsByCategory(id);
      skills.forEach((s) => { skillsMap[s.id] = s; });
    })
  );
  return Object.values(skillsMap);
}

// ── Picker de categorías ──────────────────────────────────────────────────────
function renderCategoriesPicker(containerId = "categoriesPicker") {
  const container = $(`#${containerId}`);
  if (!container) return;
  container.innerHTML = "";

  const skillsPickerId = containerId === "ob-categoriesPicker" ? "ob-skillsPicker" : "skillsPicker";
  const counterPickerId = containerId === "ob-categoriesPicker" ? "ob-skillsCounter" : "skillsCounter";

  state.categories.forEach((cat) => {
    const isSelected = state.selectedCategories.some((c) => c.id === cat.id);
    const label = document.createElement("label");
    label.className = `picker-card${isSelected ? " is-selected" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${isSelected ? "checked" : ""} />
      <span class="picker-card__check" aria-hidden="true"></span>
      <span class="picker-card__text">
        <span class="picker-card__title">${cat.name}</span>
      </span>
    `;

    const input = label.querySelector("input");
    input.addEventListener("change", async () => {
      label.classList.toggle("is-selected", input.checked);
      if (input.checked) {
        if (!state.selectedCategories.some((c) => c.id === cat.id)) {
          state.selectedCategories.push({ id: cat.id, name: cat.name });
        }
      } else {
        state.selectedCategories = state.selectedCategories.filter((c) => c.id !== cat.id);
        state.selectedSkills = state.selectedSkills.filter((s) => s.category_id !== cat.id);
      }
      const categoryIds = state.selectedCategories.map((c) => c.id);
      state.allSkills = await loadSkillsForCategories(categoryIds);
      renderSkillsPicker(skillsPickerId);
      updateSkillsCounter(counterPickerId);
    });

    container.appendChild(label);
  });
}

// ── Picker de skills ──────────────────────────────────────────────────────────
function renderSkillsPicker(containerId = "skillsPicker") {
  const container = $(`#${containerId}`);
  if (!container) return;
  container.innerHTML = "";

  const counterPickerId = containerId === "ob-skillsPicker" ? "ob-skillsCounter" : "skillsCounter";

  if (!state.allSkills.length) {
    const empty = document.createElement("div");
    empty.className = "picker-empty";
    empty.textContent = "Selecciona al menos una categoría para ver sus skills.";
    container.appendChild(empty);
    return;
  }

  state.allSkills.forEach((skill) => {
    const existing = state.selectedSkills.find((s) => s.skill_id === skill.id);
    const isSelected = !!existing;

    const label = document.createElement("label");
    label.className = `picker-card${isSelected ? " is-selected" : ""}`;
    label.innerHTML = `
      <input type="checkbox" ${isSelected ? "checked" : ""} />
      <span class="picker-card__check" aria-hidden="true"></span>
      <span class="picker-card__text">
        <span class="picker-card__title">${skill.name}</span>
        <span class="picker-card__meta">${skill.category || ""}</span>
      </span>
    `;

    const input = label.querySelector("input");
    input.addEventListener("change", () => {
      label.classList.toggle("is-selected", input.checked);
      if (input.checked) {
        if (!state.selectedSkills.some((s) => s.skill_id === skill.id)) {
          state.selectedSkills.push({
            skill_id: skill.id,
            name: skill.name,
            level: 3,
            category_id: skill.category_id,
          });
        }
      } else {
        state.selectedSkills = state.selectedSkills.filter((s) => s.skill_id !== skill.id);
      }
      updateSkillsCounter(counterPickerId);
    });

    container.appendChild(label);
  });
}

function updateSkillsCounter(counterId = "skillsCounter") {
  const counter = $(`#${counterId}`);
  if (!counter) return;
  const total = state.selectedSkills.length;
  counter.textContent = `${total} skill${total !== 1 ? "s" : ""} seleccionado${total !== 1 ? "s" : ""}`;
}

// ── Llenar formulario de perfil ───────────────────────────────────────────────
async function fillProfileForm() {
  const profile = state.profile;

  $("#firstNameInput").value = profile.first_name || "";
  $("#lastNameInput").value = profile.last_name || "";
  $("#experienceInput").value = profile.experience_years ?? "";
  $("#englishInput").value = profile.english_level || "";
  $("#seniorityInput").value = profile.seniority || "";

  state.selectedCategories = (profile.categories || []).map((c) => ({ id: c.id, name: c.name }));

  const categoryIds = state.selectedCategories.map((c) => c.id);
  state.allSkills = categoryIds.length ? await loadSkillsForCategories(categoryIds) : [];

  state.selectedSkills = (profile.skills || []).map((s) => ({
    skill_id: s.id,
    name: s.name,
    level: s.level || 3,
    category_id: s.category_id,
  }));

  renderCategoriesPicker("categoriesPicker");
  renderSkillsPicker("skillsPicker");
  updateSkillsCounter("skillsCounter");
}

// ── Guardar perfil ────────────────────────────────────────────────────────────
async function saveProfile() {
  const alertEl = $("#profileFormAlert");
  setAlert(alertEl, "");

  const first_name = $("#firstNameInput")?.value.trim();
  const last_name = $("#lastNameInput")?.value.trim();
  const experience_years = Number($("#experienceInput")?.value);
  const english_level = $("#englishInput")?.value;
  const seniority = $("#seniorityInput")?.value;

  if (!first_name || !last_name) {
    setAlert(alertEl, "Nombre y apellido son obligatorios.", "error");
    return false;
  }

  if (!state.selectedCategories.length) {
    setAlert(alertEl, "Selecciona al menos una categoría.", "error");
    return false;
  }

  if (!state.selectedSkills.length) {
    setAlert(alertEl, "Selecciona al menos un skill.", "error");
    return false;
  }

  try {
    await updateCandidateProfile({ first_name, last_name, experience_years, english_level, seniority });
    await updateCandidateCategories(state.selectedCategories.map((c) => c.id));
    await updateCandidateSkills(state.selectedSkills.map((s) => ({ skill_id: s.skill_id, level: s.level })));

    state.profile = await getCandidateProfile();
    renderProfile(state.profile);
    return true;
  } catch (err) {
    setAlert(alertEl, err.message || "Error guardando perfil.", "error");
    return false;
  }
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────
function showOnboarding() {
  $("#onboardingOverlay").classList.remove("onboarding--hidden");
}

function hideOnboarding() {
  $("#onboardingOverlay").classList.add("onboarding--hidden");
}

function initOnboarding() {
  const steps = [$("#ob-step-1"), $("#ob-step-2"), $("#ob-step-3")];

  function goToStep(index) {
    steps.forEach((s, i) => s.classList.toggle("ob-step--hidden", i !== index));
    const percentages = ["33%", "66%", "100%"];
    const bar = $("#ob-progressBar");
    if (bar) bar.style.width = percentages[index];
  }

  goToStep(0);

  // Paso 1 → 2
  $("#ob_nextStep1")?.addEventListener("click", async () => {
    const alertEl = $("#onboardingAlert");
    const first_name = $("#ob_firstName")?.value.trim();
    const last_name = $("#ob_lastName")?.value.trim();

    if (!first_name || !last_name) {
      setAlert(alertEl, "Nombre y apellido son obligatorios.", "error");
      return;
    }

    setAlert(alertEl, "");
    goToStep(1);

    state.selectedCategories = [];
    state.selectedSkills = [];
    state.allSkills = [];
    renderCategoriesPicker("ob-categoriesPicker");
  });

  // Paso 2 → 3
  $("#ob_nextStep2")?.addEventListener("click", async () => {
    const alertEl = $("#onboardingAlert");

    if (!state.selectedCategories.length) {
      setAlert(alertEl, "Selecciona al menos una categoría.", "error");
      return;
    }

    setAlert(alertEl, "");
    goToStep(2);

    state.allSkills = await loadSkillsForCategories(state.selectedCategories.map((c) => c.id));
    renderSkillsPicker("ob-skillsPicker");
    updateSkillsCounter("ob-skillsCounter");
  });

  // Paso 3 → guardar
  $("#ob_saveBtn")?.addEventListener("click", async () => {
    const alertEl = $("#onboardingAlert");

    if (!state.selectedSkills.length) {
      setAlert(alertEl, "Selecciona al menos un skill.", "error");
      return;
    }

    const first_name = $("#ob_firstName")?.value.trim();
    const last_name = $("#ob_lastName")?.value.trim();
    const experience_years = Number($("#ob_experience")?.value || 0);
    const english_level = $("#ob_english")?.value;
    const seniority = $("#ob_seniority")?.value;

    try {
      await updateCandidateProfile({ first_name, last_name, experience_years, english_level, seniority });
      await updateCandidateCategories(state.selectedCategories.map((c) => c.id));
      await updateCandidateSkills(state.selectedSkills.map((s) => ({ skill_id: s.skill_id, level: s.level })));

      state.profile = await getCandidateProfile();
      renderProfile(state.profile);
      hideOnboarding();
    } catch (err) {
      setAlert(alertEl, err.message || "Error guardando perfil.", "error");
    }
  });

  // Limpiar skills en onboarding
  $("#ob-clearSkillsBtn")?.addEventListener("click", () => {
    state.selectedSkills = [];
    renderSkillsPicker("ob-skillsPicker");
    updateSkillsCounter("ob-skillsCounter");
  });
}

// ── MODAL DE EDICIÓN ──────────────────────────────────────────────────────────
function initProfileModal() {
  const openEditor = async () => {
    setAlert($("#profileFormAlert"), "");
    await fillProfileForm();
    $("#profileModal").showModal();
  };

  $("#editProfileBtn")?.addEventListener("click", openEditor);

  $("#closeProfileModalBtn")?.addEventListener("click", () => $("#profileModal").close());
  $("#cancelProfileBtn")?.addEventListener("click", () => $("#profileModal").close());

  $("#clearSkillsBtn")?.addEventListener("click", () => {
    state.selectedSkills = [];
    renderSkillsPicker("skillsPicker");
    updateSkillsCounter("skillsCounter");
  });

  $("#profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = $("#saveProfileBtn");
    saveBtn?.classList.add("btn--loading");
    const ok = await saveProfile();
    saveBtn?.classList.remove("btn--loading");
    if (ok) $("#profileModal").close();
  });
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
function initLogout() {
  $("#logoutBtn")?.addEventListener("click", async () => {
    await authLogout();
    window.location.href = "/public/login.html";
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const user = await ensureCandidateAccess();
  if (!user) return;

  state.user = user;

  try {
    const [profile, categories] = await Promise.all([
      getCandidateProfile(),
      getCategories(),
    ]);

    console.log("PERFIL:", JSON.stringify(profile, null, 2));

    state.profile = profile;
    state.categories = categories;

    renderProfile(profile);
  } catch (err) {
    console.error("Error loading profile:", err);
    setAlert($("#dashboardAlert"), "Error cargando tu perfil: " + (err.message || "Intenta de nuevo."), "error");
  }

  // Hide offers loader, show empty state
  const offersLoading = document.getElementById("offersLoading");
  const offersEmpty = document.getElementById("offersEmpty");
  if (offersLoading) offersLoading.style.display = "none";
  if (offersEmpty) offersEmpty.style.display = "";

  // Hide page loader, show main layout
  const pageLoader = document.getElementById("pageLoader");
  const mainLayout = document.getElementById("mainLayout");
  if (pageLoader) pageLoader.remove();
  if (mainLayout) mainLayout.style.display = "";

  if (state.profile && !isProfileComplete(state.profile)) {
    initOnboarding();
    showOnboarding();
  }

  initProfileModal();
  initLogout();
});
