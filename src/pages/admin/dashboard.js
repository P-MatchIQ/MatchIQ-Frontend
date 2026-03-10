import { authMe, authLogout } from "../../api/authApi.js";
import {
  getDashboard,
  getCompanies, getCompanyById,
  getCandidates, getCandidateById,
  toggleUserStatus,
  getCategories, getAllSkills,
  createCategory, createSkill,
  deleteCategory, deleteSkill,
} from "../../api/adminApi.js";

// ── Utilidades DOM ────────────────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function showError(message) {
  console.error(message);
}

// ── Estado global ─────────────────────────────────────────────────────────────
let allCompanies = [];
let allCandidates = [];
let allCategories = [];
let allSkills = [];
let currentCompany = null;
let currentCandidate = null;

// ── Navegación entre secciones ────────────────────────────────────────────────
function initNav() {
  const links = $$(".sidebar__link");
  const sections = $$(".section");

  links.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.section;

      // Activar link
      links.forEach(l => l.classList.remove("sidebar__link--active"));
      link.classList.add("sidebar__link--active");

      // Mostrar sección
      sections.forEach(s => s.classList.add("section--hidden"));
      $(`#section-${target}`)?.classList.remove("section--hidden");

      // Cargar datos según sección
      if (target === "companies") loadCompanies();
      if (target === "candidates") loadCandidates();
      if (target === "catalog") loadCatalog();
    });
  });

  // Botón "ver todas" del dashboard
  $("#seeAllCompaniesBtn")?.addEventListener("click", () => {
    $$(".sidebar__link").forEach(l => l.classList.remove("sidebar__link--active"));
    $('[data-section="companies"]')?.classList.add("sidebar__link--active");
    $$(".section").forEach(s => s.classList.add("section--hidden"));
    $("#section-companies")?.classList.remove("section--hidden");
    loadCompanies();
  });
}

// ── Overlay y modales ─────────────────────────────────────────────────────────
function openModal(modalId) {
  $(`#${modalId}`)?.classList.remove("modal--hidden");
  $("#overlay")?.classList.remove("overlay--hidden");
}

function closeModal(modalId) {
  $(`#${modalId}`)?.classList.add("modal--hidden");
  $("#overlay")?.classList.add("overlay--hidden");
}

function initModals() {
  // Cerrar al hacer click en overlay
  $("#overlay")?.addEventListener("click", () => {
    ["modal-company", "modal-candidate", "modal-category", "modal-skill"]
      .forEach(id => closeModal(id));
  });

  // Modal empresa
  $("#closeCompanyModal")?.addEventListener("click", () => closeModal("modal-company"));
  $("#closeCompanyModal2")?.addEventListener("click", () => closeModal("modal-company"));

  // Modal candidato
  $("#closeCandidateModal")?.addEventListener("click", () => closeModal("modal-candidate"));
  $("#closeCandidateModal2")?.addEventListener("click", () => closeModal("modal-candidate"));

  // Modal categoría
  $("#openAddCategoryBtn")?.addEventListener("click", () => {
    $("#newCategoryName").value = "";
    $("#categoryError").hidden = true;
    openModal("modal-category");
  });
  $("#closeCategoryModal")?.addEventListener("click", () => closeModal("modal-category"));
  $("#closeCategoryModal2")?.addEventListener("click", () => closeModal("modal-category"));

  // Modal skill
  $("#openAddSkillBtn")?.addEventListener("click", () => {
    $("#newSkillName").value = "";
    $("#newSkillCategory").value = "";
    $("#skillError").hidden = true;
    openModal("modal-skill");
  });
  $("#closeSkillModal")?.addEventListener("click", () => closeModal("modal-skill"));
  $("#closeSkillModal2")?.addEventListener("click", () => closeModal("modal-skill"));
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const data = await getDashboard();

    $("#stat-companies").textContent = data.stats.active_companies.toLocaleString();
    $("#stat-candidates").textContent = data.stats.total_candidates.toLocaleString();
    $("#stat-matches").textContent = data.stats.successful_matches.toLocaleString();

    renderLatestCompanies(data.latest_companies);
  } catch (err) {
    showError("Error cargando dashboard: " + err.message);
  }
}

function renderLatestCompanies(companies) {
  const tbody = $("#latest-companies-body");
  if (!tbody) return;

  if (!companies?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">No hay empresas registradas</td></tr>`;
    return;
  }

  tbody.innerHTML = companies.map(c => `
    <tr>
      <td><strong>${c.company_name || "Sin nombre"}</strong></td>
      <td>${c.email}</td>
      <td>${c.location || "—"}</td>
      <td>${c.total_offers || 0}</td>
      <td><span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
        ${c.is_active ? "Activa" : "Suspendida"}
      </span></td>
      <td>${formatDate(c.created_at)}</td>
    </tr>
  `).join("");
}

// ── EMPRESAS ──────────────────────────────────────────────────────────────────
async function loadCompanies() {
  const tbody = $("#companies-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Cargando...</td></tr>`;

  try {
    const search = $("#searchCompanies")?.value?.trim() || "";
    allCompanies = await getCompanies({ search });
    renderCompanies(allCompanies);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Error cargando empresas</td></tr>`;
  }
}

function sortCompanies(companies, criteria) {
  const sorted = [...companies];
  if (criteria === "name") sorted.sort((a, b) => (a.company_name || "").localeCompare(b.company_name || ""));
  if (criteria === "offers") sorted.sort((a, b) => (b.total_offers || 0) - (a.total_offers || 0));
  if (criteria === "recent") sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return sorted;
}

function renderCompanies(companies) {
  const tbody = $("#companies-body");
  if (!tbody) return;

  if (!companies?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">No se encontraron empresas</td></tr>`;
    return;
  }

  tbody.innerHTML = companies.map(c => `
    <tr>
      <td><strong>${c.company_name || "Sin nombre"}</strong></td>
      <td>${c.email}</td>
      <td>${c.location || "—"}</td>
      <td>${c.total_offers || 0}</td>
      <td><span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
        ${c.is_active ? "Activa" : "Suspendida"}
      </span></td>
      <td>
        <button class="btn--icon" title="Ver detalle" data-company-id="${c.id}">🔍</button>
      </td>
    </tr>
  `).join("");

  // Escuchar clicks en botones de detalle
  tbody.querySelectorAll("[data-company-id]").forEach(btn => {
    btn.addEventListener("click", () => openCompanyModal(btn.dataset.companyId));
  });
}

async function openCompanyModal(companyId) {
  openModal("modal-company");
  const body = $("#modal-company-body");
  body.innerHTML = "Cargando...";

  try {
    const c = await getCompanyById(companyId);
    currentCompany = c;

    $("#modal-company-name").textContent = c.company_name || "Sin nombre";

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <p class="detail-item__label">Email</p>
          <p class="detail-item__value">${c.email}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Ubicación</p>
          <p class="detail-item__value">${c.location || "—"}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Website</p>
          <p class="detail-item__value">${c.website ? `<a href="${c.website}" target="_blank">${c.website}</a>` : "—"}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Ofertas totales</p>
          <p class="detail-item__value">${c.total_offers || 0}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Registro</p>
          <p class="detail-item__value">${formatDate(c.created_at)}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Estado</p>
          <p class="detail-item__value">
            <span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
              ${c.is_active ? "Activa" : "Suspendida"}
            </span>
          </p>
        </div>
      </div>
      ${c.description ? `<p style="color: var(--gray-600); font-size:14px">${c.description}</p>` : ""}
    `;

    const toggleBtn = $("#modal-company-toggle-btn");
    toggleBtn.textContent = c.is_active ? "Suspender empresa" : "Activar empresa";
    toggleBtn.className = `btn ${c.is_active ? "btn--danger" : "btn--primary"}`;
  } catch (err) {
    body.innerHTML = `<p style="color:var(--red)">Error cargando empresa</p>`;
  }
}

// ── CANDIDATOS ────────────────────────────────────────────────────────────────
async function loadCandidates() {
  const tbody = $("#candidates-body");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Cargando...</td></tr>`;

  try {
    const search = $("#searchCandidates")?.value?.trim() || "";
    allCandidates = await getCandidates({ search });
    renderCandidates(allCandidates);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">Error cargando candidatos</td></tr>`;
  }
}

function sortCandidates(candidates, criteria) {
  const seniorityOrder = { senior: 3, mid: 2, junior: 1 };
  const sorted = [...candidates];
  if (criteria === "seniority") sorted.sort((a, b) =>
    (seniorityOrder[b.seniority] || 0) - (seniorityOrder[a.seniority] || 0));
  if (criteria === "experience") sorted.sort((a, b) =>
    (b.experience_years || 0) - (a.experience_years || 0));
  if (criteria === "recent") sorted.sort((a, b) =>
    new Date(b.created_at) - new Date(a.created_at));
  return sorted;
}

function renderCandidates(candidates) {
  const tbody = $("#candidates-body");
  if (!tbody) return;

  if (!candidates?.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table__empty">No se encontraron candidatos</td></tr>`;
    return;
  }

  tbody.innerHTML = candidates.map(c => `
    <tr>
      <td>${c.email}</td>
      <td>${c.seniority || "—"}</td>
      <td>${c.experience_years != null ? `${c.experience_years} años` : "—"}</td>
      <td>${c.english_level || "—"}</td>
      <td><span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
        ${c.is_active ? "Activo" : "Suspendido"}
      </span></td>
      <td>
        <button class="btn--icon" title="Ver detalle" data-candidate-id="${c.id}">🔍</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-candidate-id]").forEach(btn => {
    btn.addEventListener("click", () => openCandidateModal(btn.dataset.candidateId));
  });
}

async function openCandidateModal(candidateId) {
  openModal("modal-candidate");
  const body = $("#modal-candidate-body");
  body.innerHTML = "Cargando...";

  try {
    const c = await getCandidateById(candidateId);
    currentCandidate = c;

    $("#modal-candidate-email").textContent = c.email;

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item">
          <p class="detail-item__label">Seniority</p>
          <p class="detail-item__value">${c.seniority || "—"}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Experiencia</p>
          <p class="detail-item__value">${c.experience_years != null ? `${c.experience_years} años` : "—"}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Inglés</p>
          <p class="detail-item__value">${c.english_level || "—"}</p>
        </div>
        <div class="detail-item">
          <p class="detail-item__label">Estado</p>
          <p class="detail-item__value">
            <span class="badge ${c.is_active ? "badge--active" : "badge--inactive"}">
              ${c.is_active ? "Activo" : "Suspendido"}
            </span>
          </p>
        </div>
      </div>
      ${c.categories?.length ? `
        <p class="detail-item__label">Categorías</p>
        <div class="tags">
          ${c.categories.map(cat => `<span class="tag">${cat.name}</span>`).join("")}
        </div>
      ` : ""}
      ${c.skills?.length ? `
        <p class="detail-item__label" style="margin-top:12px">Skills</p>
        <div class="tags">
          ${c.skills.map(s => `<span class="tag">${s.name} (${s.level}/5)</span>`).join("")}
        </div>
      ` : ""}
    `;

    const toggleBtn = $("#modal-candidate-toggle-btn");
    toggleBtn.textContent = c.is_active ? "Suspender candidato" : "Activar candidato";
    toggleBtn.className = `btn ${c.is_active ? "btn--danger" : "btn--primary"}`;
  } catch (err) {
    body.innerHTML = `<p style="color:var(--red)">Error cargando candidato</p>`;
  }
}

// ── SUSPENDER / ACTIVAR ───────────────────────────────────────────────────────
function initToggleStatus() {
  $("#modal-company-toggle-btn")?.addEventListener("click", async () => {
    if (!currentCompany) return;
    try {
      await toggleUserStatus(currentCompany.user_id, !currentCompany.is_active);
      closeModal("modal-company");
      loadCompanies();
      loadDashboard();
    } catch (err) {
      showError("Error cambiando estado: " + err.message);
    }
  });

  $("#modal-candidate-toggle-btn")?.addEventListener("click", async () => {
    if (!currentCandidate) return;
    try {
      await toggleUserStatus(currentCandidate.user_id, !currentCandidate.is_active);
      closeModal("modal-candidate");
      loadCandidates();
    } catch (err) {
      showError("Error cambiando estado: " + err.message);
    }
  });
}

// ── CATÁLOGO ──────────────────────────────────────────────────────────────────
async function loadCatalog() {
  try {
    allCategories = await getCategories();
    allSkills = await getAllSkills();

    renderCategories();
    renderSkills();
    populateCategorySelects();
  } catch (err) {
    showError("Error cargando catálogo: " + err.message);
  }
}

function renderCategories() {
  const list = $("#categories-list");
  if (!list) return;

  if (!allCategories.length) {
    list.innerHTML = `<li class="table__empty">No hay categorías</li>`;
    return;
  }

  list.innerHTML = allCategories.map(cat => `
    <li>
      <span class="catalog-list__name">${cat.name}</span>
      <button class="btn--icon" data-delete-category="${cat.id}" title="Eliminar">🗑️</button>
    </li>
  `).join("");

  list.querySelectorAll("[data-delete-category]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`¿Eliminar la categoría "${btn.closest("li").querySelector(".catalog-list__name").textContent}"?`)) return;
      try {
        await deleteCategory(btn.dataset.deleteCategory);
        loadCatalog();
      } catch (err) {
        alert("Error eliminando categoría: " + err.message);
      }
    });
  });
}

function renderSkills(filteredCategoryId = "") {
  const list = $("#skills-list");
  if (!list) return;

  const filtered = filteredCategoryId
    ? allSkills.filter(s => s.category_id === filteredCategoryId)
    : allSkills;

  if (!filtered.length) {
    list.innerHTML = `<li class="table__empty">No hay skills</li>`;
    return;
  }

  list.innerHTML = filtered.map(s => `
    <li>
      <div>
        <span class="catalog-list__name">${s.name}</span>
        <span class="catalog-list__cat">${s.category}</span>
      </div>
      <button class="btn--icon" data-delete-skill="${s.id}" title="Eliminar">🗑️</button>
    </li>
  `).join("");

  list.querySelectorAll("[data-delete-skill]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm(`¿Eliminar este skill?`)) return;
      try {
        await deleteSkill(btn.dataset.deleteSkill);
        loadCatalog();
      } catch (err) {
        alert("Error eliminando skill: " + err.message);
      }
    });
  });
}

function populateCategorySelects() {
  // Select del filtro de skills
  const filterSelect = $("#filterSkillsByCategory");
  if (filterSelect) {
    filterSelect.innerHTML = `<option value="">Todas las categorías</option>` +
      allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }

  // Select del modal de nuevo skill
  const skillCatSelect = $("#newSkillCategory");
  if (skillCatSelect) {
    skillCatSelect.innerHTML = `<option value="">Selecciona una categoría</option>` +
      allCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  }
}

function initCatalogEvents() {
  // Filtrar skills por categoría
  $("#filterSkillsByCategory")?.addEventListener("change", (e) => {
    renderSkills(e.target.value);
  });

  // Guardar nueva categoría
  $("#saveCategoryBtn")?.addEventListener("click", async () => {
    const name = $("#newCategoryName")?.value?.trim();
    const errorEl = $("#categoryError");

    if (!name) {
      errorEl.textContent = "El nombre es obligatorio";
      errorEl.hidden = false;
      return;
    }

    try {
      await createCategory(name);
      closeModal("modal-category");
      loadCatalog();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });

  // Guardar nuevo skill
  $("#saveSkillBtn")?.addEventListener("click", async () => {
    const name = $("#newSkillName")?.value?.trim();
    const category_id = $("#newSkillCategory")?.value;
    const errorEl = $("#skillError");

    if (!name || !category_id) {
      errorEl.textContent = "Todos los campos son obligatorios";
      errorEl.hidden = false;
      return;
    }

    try {
      await createSkill(name, category_id);
      closeModal("modal-skill");
      loadCatalog();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    }
  });
}

// ── BÚSQUEDA Y ORDENAMIENTO ───────────────────────────────────────────────────
function initSearchAndSort() {
  let searchTimeout;

  $("#searchCompanies")?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadCompanies(), 400);
  });

  $("#sortCompanies")?.addEventListener("change", (e) => {
    renderCompanies(sortCompanies(allCompanies, e.target.value));
  });

  $("#searchCandidates")?.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadCandidates(), 400);
  });

  $("#sortCandidates")?.addEventListener("change", (e) => {
    renderCandidates(sortCandidates(allCandidates, e.target.value));
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
  const { getSession } = await import("../../api/authApi.js");
  const session = getSession();

  if (!session || session.role !== "admin") {
    window.location.href = "../login.html";
    return;
  }

  initNav();
  initModals();
  initToggleStatus();
  initCatalogEvents();  
  initSearchAndSort();
  initLogout();

  // Cargar dashboard al inicio
  loadDashboard();
});