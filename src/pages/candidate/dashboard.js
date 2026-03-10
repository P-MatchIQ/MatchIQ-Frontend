import { authMe, authLogout } from "../../api/authApi.js";

const $ = (selector) => document.querySelector(selector);

const CATEGORIES_DATA = [
  {
    id: "9b161bda-00ee-4c4d-91a2-86a7bab7191e",
    name: "Frontend",
    skills: ["HTML5", "CSS3", "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "Sass / SCSS", "Tailwind CSS", "Bootstrap", "Material UI", "Jest", "Cypress", "Testing Library", "Webpack", "Vite", "Responsive Design", "Web Accessibility (a11y)"]
  },
  {
    id: "a589a9e7-f496-4cb1-be92-a9bbb0a29258",
    name: "Backend",
    skills: ["Node.js", "Python", "Java", "C#", "PHP", "Go", "Ruby", "Express.js", "NestJS", "Django", "Flask", "Spring Boot", ".NET", "Laravel", "Ruby on Rails", "FastAPI", "REST APIs", "GraphQL", "Microservices", "Authentication (JWT, OAuth)", "WebSockets"]
  },
  {
    id: "ecf7dcda-62a6-4b67-8064-e9c426f9abd9",
    name: "FullStack",
    skills: ["MERN Stack", "MEAN Stack", "JAMstack", "Server-Side Rendering (SSR)", "Monorepos"]
  },
  {
    id: "371e0d8e-6152-46d5-87d8-6203e752a2c2",
    name: "DevOps",
    skills: ["Docker", "Kubernetes", "CI/CD", "GitHub Actions", "GitLab CI", "Jenkins", "Terraform", "Ansible", "Linux Administration", "Nginx", "Apache", "Monitoring (Prometheus, Grafana)"]
  },
  {
    id: "87000992-93b4-47cd-be7c-aa68d1d5aa6f",
    name: "QA",
    skills: ["Manual Testing", "Automated Testing", "Selenium", "Cypress", "Playwright", "JUnit", "TestNG", "Postman", "API Testing", "Performance Testing (JMeter)", "TDD", "BDD"]
  },
  {
    id: "92cde516-5313-4ca6-b1b0-6beccd3ceb45",
    name: "UX/UI",
    skills: ["Figma", "Adobe XD", "Sketch", "Wireframing", "Prototyping", "User Research", "Design Systems", "Usability Testing", "Interaction Design"]
  },
  {
    id: "50315af5-269c-4f71-a346-276da668d11c",
    name: "Databases",
    skills: ["PostgreSQL", "MySQL", "SQL Server", "Oracle", "MongoDB", "Redis", "Cassandra", "Firebase", "Database Design", "Indexing", "Query Optimization", "Data Modeling"]
  },
  {
    id: "mobile-id",
    name: "Mobile",
    skills: ["React Native", "Flutter", "Swift", "Kotlin", "Android SDK", "iOS Development", "Xamarin", "Mobile UI/UX"]
  },
  {
    id: "data-science-id",
    name: "Data Science",
    skills: ["Python (Pandas, NumPy)", "R", "Data Visualization (Tableau, Power BI)", "Matplotlib", "Seaborn", "Statistical Analysis", "Data Cleaning", "Jupyter Notebook"]
  },
  {
    id: "ml-ai-id",
    name: "Machine Learning / AI",
    skills: ["Scikit-learn", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "Deep Learning", "Model Training", "Model Deployment", "MLOps"]
  },
  {
    id: "cloud-id",
    name: "Cloud",
    skills: ["AWS", "Azure", "Google Cloud", "Serverless", "Cloud Architecture", "Cloud Security", "Cloud Networking"]
  },
  {
    id: "cybersecurity-id",
    name: "Cybersecurity",
    skills: ["Ethical Hacking", "Penetration Testing", "OWASP", "Network Security", "Cryptography", "SIEM", "Security Auditing", "IAM"]
  },
  {
    id: "blockchain-id",
    name: "Blockchain",
    skills: ["Solidity", "Ethereum", "Smart Contracts", "Web3.js", "Hyperledger", "DeFi", "NFT Development"]
  },
  {
    id: "gamedev-id",
    name: "Game Development",
    skills: ["Unity", "Unreal Engine", "C++", "C#", "Game Physics", "Multiplayer Networking", "Game Design"]
  },
  {
    id: "embedded-id",
    name: "Embedded / IoT",
    skills: ["C", "C++", "Microcontrollers (Arduino, ESP32)", "Raspberry Pi", "RTOS", "MQTT", "Embedded Linux", "Firmware Development"]
  },
  {
    id: "data-eng-id",
    name: "Data Engineering",
    skills: ["Apache Spark", "Hadoop", "Airflow", "ETL Pipelines", "Data Warehousing", "BigQuery", "Snowflake", "Kafka"]
  }
];

const state = {
  user: null,
  profile: null,
  offers: [],
  filteredOffers: [],
  selectedCategories: [],
  selectedSkills: [],
};

function setAlert(el, message, type = "info") {
  if (!el) return;
  el.hidden = !message;
  el.textContent = message || "";
  el.classList.toggle("is-error", type === "error");
}

function createTag(text) {
  const span = document.createElement("span");
  span.className = "tag";
  span.textContent = text;
  return span;
}

function renderTags(container, values = []) {
  if (!container) return;
  container.innerHTML = "";

  if (!values.length) {
    container.appendChild(createTag("Not defined"));
    return;
  }

  values.forEach((value) => {
    container.appendChild(createTag(value));
  });
}

function calculateProfileCompleteness(profile) {
  if (!profile) return 0;

  const checks = [
    Array.isArray(profile.categories) && profile.categories.length > 0,
    Array.isArray(profile.skills) && profile.skills.length > 0,
    Number.isFinite(profile.yearsExperience) && profile.yearsExperience >= 0,
    !!profile.englishLevel,
    !!profile.seniority,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

function normalizeRole(role) {
  return String(role || "").toLowerCase();
}

function redirectByRole(role) {
  const normalized = normalizeRole(role);

  if (normalized === "admin") {
    window.location.href = "../admin/dashboard.html";
    return;
  }

  if (normalized === "company") {
    window.location.href = "../company/dashboard.html";
    return;
  }

  window.location.href = "./dashboard.html";
}

async function ensureCandidateAccess() {
  const me = await authMe();

  if (!me?.authenticated || !me?.user) {
    sessionStorage.setItem("redirectTo", window.location.pathname);
    window.location.href = "../login.html";
    return null;
  }

  if (normalizeRole(me.user.role) !== "candidate") {
    redirectByRole(me.user.role);
    return null;
  }

  return me.user;
}

/* =========================
   MOCK DATA
========================= */
async function getCandidateProfileMock(user) {
  return {
    id: user.id,
    fullName: "Juan Candidate",
    email: user.email,
    categories: ["Frontend", "Backend"],
    skills: ["React", "TypeScript", "Node.js", "CSS3", "REST APIs"],
    yearsExperience: 3,
    englishLevel: "B2",
    seniority: "Mid",
    available: true,
  };
}

async function getMatchedOffersMock() {
  return [
    {
      id: "offer-1",
      role: "Frontend Developer",
      company: "TechNova",
      requiredSkills: ["React", "TypeScript", "CSS3"],
      requiredExperience: 2,
      workMode: "Remote",
      salary: "$2,500 - $3,300",
      matchPercentage: 92,
      description: "We are looking for a Frontend Developer to build and maintain modern interfaces for our SaaS platform.",
      requirements: [
        "Experience with component-based UI",
        "Strong JavaScript or TypeScript knowledge",
        "Ability to work with REST APIs",
      ],
    },
    {
      id: "offer-2",
      role: "Fullstack Engineer",
      company: "MatchCore",
      requiredSkills: ["React", "Node.js", "PostgreSQL"],
      requiredExperience: 3,
      workMode: "Hybrid",
      salary: "$3,000 - $4,200",
      matchPercentage: 88,
      description: "Join our engineering team to develop new fullstack features across internal and client-facing systems.",
      requirements: [
        "Experience in frontend and backend environments",
        "Database design knowledge",
        "Comfortable working in agile teams",
      ],
    },
    {
      id: "offer-3",
      role: "Backend Developer",
      company: "CloudAxis",
      requiredSkills: ["Node.js", "Express.js", "MongoDB"],
      requiredExperience: 2,
      workMode: "On-site",
      salary: "$2,200 - $3,100",
      matchPercentage: 76,
      description: "Backend position focused on API development, authentication flows, and service integrations.",
      requirements: [
        "Node.js backend experience",
        "Knowledge of REST API design",
        "Understanding of authentication mechanisms",
      ],
    },
  ];
}

async function saveProfileMock(payload) {
  return {
    ...state.profile,
    ...payload,
  };
}

/* =========================
   PICKERS
========================= */
function getAvailableSkills(selectedCategories = []) {
  const selectedSet = new Set(selectedCategories);
  const skills = new Set();

  CATEGORIES_DATA.forEach((category) => {
    if (selectedSet.has(category.name)) {
      category.skills.forEach((skill) => skills.add(skill));
    }
  });

  return Array.from(skills).sort((a, b) => a.localeCompare(b));
}

function updateSkillsCounter() {
  const counter = $("#skillsCounter");
  if (!counter) return;

  const total = state.selectedSkills.length;
  counter.textContent = `${total} skill${total === 1 ? "" : "s"} selected`;
}

function createPickerCard({ name, meta = "", checked = false, group = "generic", onChange }) {
  const label = document.createElement("label");
  label.className = `picker-card${checked ? " is-selected" : ""}`;

  label.innerHTML = `
    <input type="checkbox" ${checked ? "checked" : ""} />
    <span class="picker-card__check" aria-hidden="true"></span>
    <span class="picker-card__text">
      <span class="picker-card__title">${name}</span>
      ${meta ? `<span class="picker-card__meta">${meta}</span>` : ""}
    </span>
  `;

  const input = label.querySelector("input");
  input.name = group;

  input.addEventListener("change", () => {
    label.classList.toggle("is-selected", input.checked);
    onChange?.(input.checked);
  });

  return label;
}

function renderCategoriesPicker() {
  const container = $("#categoriesPicker");
  if (!container) return;

  container.innerHTML = "";

  CATEGORIES_DATA.forEach((category) => {
    const checked = state.selectedCategories.includes(category.name);

    const card = createPickerCard({
      name: category.name,
      meta: `${category.skills.length} skills`,
      checked,
      group: "categories",
      onChange: (isChecked) => {
        if (isChecked) {
          if (!state.selectedCategories.includes(category.name)) {
            state.selectedCategories.push(category.name);
          }
        } else {
          state.selectedCategories = state.selectedCategories.filter(
            (item) => item !== category.name
          );
        }

        const availableSkills = getAvailableSkills(state.selectedCategories);
        state.selectedSkills = state.selectedSkills.filter((skill) =>
          availableSkills.includes(skill)
        );

        renderSkillsPicker();
        updateSkillsCounter();
      },
    });

    container.appendChild(card);
  });
}

function renderSkillsPicker() {
  const container = $("#skillsPicker");
  if (!container) return;

  container.innerHTML = "";

  const availableSkills = getAvailableSkills(state.selectedCategories);

  if (!availableSkills.length) {
    const empty = document.createElement("div");
    empty.className = "picker-empty";
    empty.textContent = "Select at least one category to unlock related skills.";
    container.appendChild(empty);
    return;
  }

  availableSkills.forEach((skill) => {
    const checked = state.selectedSkills.includes(skill);

    const card = createPickerCard({
      name: skill,
      checked,
      group: "skills",
      onChange: (isChecked) => {
        if (isChecked) {
          if (!state.selectedSkills.includes(skill)) {
            state.selectedSkills.push(skill);
          }
        } else {
          state.selectedSkills = state.selectedSkills.filter((item) => item !== skill);
        }

        updateSkillsCounter();
      },
    });

    container.appendChild(card);
  });
}

/* =========================
   RENDER
========================= */
function renderProfile(profile) {
  $("#welcomeText").textContent = `Welcome, ${profile.fullName || "Candidate"}`;
  $("#experienceValue").textContent = `${profile.yearsExperience ?? "-"} years`;
  $("#englishValue").textContent = profile.englishLevel || "-";
  $("#seniorityValue").textContent = profile.seniority || "-";
  $("#availabilityValue").textContent = profile.available ? "Available" : "Not available";
  $("#availabilityText").textContent = profile.available
    ? "Available for matching"
    : "Not participating in new rankings";

  const completeness = calculateProfileCompleteness(profile);
  $("#profileCompletenessValue").textContent = `${completeness}%`;
  $("#profileStatusText").textContent =
    completeness === 100 ? "Match-ready" : "Profile incomplete";

  renderTags($("#categoriesTags"), profile.categories);
  renderTags($("#skillsTags"), profile.skills);
}

function renderSummary(offers = []) {
  $("#totalOffersValue").textContent = String(offers.length);
  $("#bestMatchValue").textContent = offers.length
    ? `${Math.max(...offers.map((offer) => offer.matchPercentage))}%`
    : "0%";
}

function createOfferCard(offer) {
  const article = document.createElement("article");
  article.className = "offer-card";

  const skillsHTML = offer.requiredSkills
    .map((skill) => `<span class="tag">${skill}</span>`)
    .join("");

  article.innerHTML = `
    <div class="offer-card__top">
      <div>
        <h4 class="offer-card__title">${offer.role}</h4>
        <p class="offer-card__company">${offer.company}</p>
      </div>
      <div class="match-badge">${offer.matchPercentage}%</div>
    </div>

    <div class="offer-meta">
      <span>${offer.workMode}</span>
      <span>${offer.requiredExperience}+ years</span>
      <span>${offer.salary}</span>
    </div>

    <div class="tags">${skillsHTML}</div>

    <div class="offer-card__actions">
      <button class="btn btn--ghost" type="button" data-offer-id="${offer.id}">
        View details
      </button>
    </div>
  `;

  article
    .querySelector("[data-offer-id]")
    .addEventListener("click", () => openOfferModal(offer));

  return article;
}

function renderOffers(offers = []) {
  const list = $("#offersList");
  const empty = $("#offersEmpty");

  list.innerHTML = "";

  if (!offers.length) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  offers.forEach((offer) => {
    list.appendChild(createOfferCard(offer));
  });
}

function applyFilters() {
  const search = $("#offerSearchInput").value.trim().toLowerCase();
  const workMode = $("#workModeFilter").value;

  const filtered = state.offers.filter((offer) => {
    const matchesSearch =
      !search ||
      offer.role.toLowerCase().includes(search) ||
      offer.company.toLowerCase().includes(search) ||
      offer.requiredSkills.some((skill) => skill.toLowerCase().includes(search));

    const matchesWorkMode = !workMode || offer.workMode === workMode;

    return matchesSearch && matchesWorkMode;
  });

  state.filteredOffers = filtered;
  renderOffers(filtered);
}

function openOfferModal(offer) {
  const modal = $("#offerModal");

  $("#modalRoleTitle").textContent = offer.role;
  $("#modalCompanyText").textContent = offer.company;
  $("#modalMatch").textContent = `${offer.matchPercentage}% Match`;
  $("#modalWorkMode").textContent = offer.workMode;
  $("#modalSalary").textContent = offer.salary;
  $("#modalExperience").textContent = `${offer.requiredExperience}+ years`;
  $("#modalDescription").textContent = offer.description || "-";

  renderTags($("#modalSkillsTags"), offer.requiredSkills);

  const requirementsList = $("#modalRequirementsList");
  requirementsList.innerHTML = "";

  (offer.requirements || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    requirementsList.appendChild(li);
  });

  modal.showModal();
}

function closeDialog(dialog) {
  if (dialog?.open) dialog.close();
}

/* =========================
   PROFILE FORM
========================= */
function fillProfileForm(profile) {
  state.selectedCategories = [...(profile.categories || [])];
  state.selectedSkills = [...(profile.skills || [])];

  $("#experienceInput").value = profile.yearsExperience ?? "";
  $("#englishInput").value = profile.englishLevel || "";
  $("#seniorityInput").value = profile.seniority || "";
  $("#availabilityInput").checked = !!profile.available;

  renderCategoriesPicker();
  renderSkillsPicker();
  updateSkillsCounter();
}

function validateProfilePayload(payload) {
  if (!payload.categories.length) {
    return "Select at least one category.";
  }

  if (!payload.skills.length) {
    return "Select at least one skill.";
  }

  if (!Number.isFinite(payload.yearsExperience) || payload.yearsExperience < 0) {
    return "Years of experience cannot be negative.";
  }

  const validEnglish = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (payload.englishLevel && !validEnglish.includes(payload.englishLevel)) {
    return "English level is invalid.";
  }

  return "";
}

async function handleProfileSubmit(event) {
  event.preventDefault();

  const alert = $("#profileFormAlert");
  setAlert(alert, "");

  const payload = {
    categories: [...state.selectedCategories],
    skills: [...state.selectedSkills],
    yearsExperience: Number($("#experienceInput").value),
    englishLevel: $("#englishInput").value,
    seniority: $("#seniorityInput").value,
    available: $("#availabilityInput").checked,
  };

  const validationError = validateProfilePayload(payload);
  if (validationError) {
    setAlert(alert, validationError, "error");
    return;
  }

  try {
    const updatedProfile = await saveProfileMock(payload);

    state.profile = updatedProfile;
    renderProfile(updatedProfile);
    closeDialog($("#profileModal"));

    setAlert(
      $("#dashboardAlert"),
      "Profile updated successfully. Future matches should be recalculated.",
      "info"
    );
  } catch (error) {
    setAlert(alert, error?.message || "Could not save profile.", "error");
  }
}

/* =========================
   DATA LOAD
========================= */
async function loadDashboardData() {
  $("#offersLoading").hidden = false;

  try {
    const [profile, offers] = await Promise.all([
      getCandidateProfileMock(state.user),
      getMatchedOffersMock(),
    ]);

    state.profile = profile;
    state.offers = [...offers].sort((a, b) => b.matchPercentage - a.matchPercentage);
    state.filteredOffers = state.offers;

    renderProfile(profile);
    renderSummary(state.offers);
    renderOffers(state.offers);
  } catch (error) {
    setAlert(
      $("#dashboardAlert"),
      error?.message || "Could not load dashboard data.",
      "error"
    );
  } finally {
    $("#offersLoading").hidden = true;
  }
}

async function handleLogout() {
  try {
    await authLogout();
  } finally {
    window.location.href = "../login.html";
  }
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await ensureCandidateAccess();
  if (!user) return;

  state.user = user;

  $("#offerSearchInput").addEventListener("input", applyFilters);
  $("#workModeFilter").addEventListener("change", applyFilters);
  $("#logoutBtn").addEventListener("click", handleLogout);
  $("#refreshMatchesBtn").addEventListener("click", loadDashboardData);

  $("#closeOfferModalBtn").addEventListener("click", () => closeDialog($("#offerModal")));
  $("#closeProfileModalBtn").addEventListener("click", () => closeDialog($("#profileModal")));
  $("#cancelProfileBtn").addEventListener("click", () => closeDialog($("#profileModal")));
  $("#clearSkillsBtn").addEventListener("click", () => {
    state.selectedSkills = [];
    renderSkillsPicker();
    updateSkillsCounter();
  });

  const openEditor = () => {
    fillProfileForm(state.profile || {});
    setAlert($("#profileFormAlert"), "");
    $("#profileModal").showModal();
  };

  $("#editProfileBtn").addEventListener("click", openEditor);
  $("#profileForm").addEventListener("submit", handleProfileSubmit);

  await loadDashboardData();
});