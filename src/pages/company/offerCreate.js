// ── Offer Create/Edit View Logic ────────────────────────────────
// Maneja formulario de creación y edición de ofertas.
// Incluye tag inputs para categorías y tecnologías.

import { createOffer, getOfferById, updateOffer } from '../../api/offersApi.js';
import { CATEGORIES_DATA } from '../../data/categoriesData.js';
import { showToast } from './app.js';
import { navigateTo } from './router.js';

/** @type {string[]} */  let categories = [];
/** @type {string[]} */  let skills = [];

/**
 * Inicializa la vista de crear/editar oferta.
 * @param {{ id?: string }} params
 */
export async function initOfferCreate(params = {}) {
    categories = [];
    skills = [];

    const isEdit = !!params.id;

    // Títulos
    const titleEl = document.getElementById('form-title');
    const subtitleEl = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('btn-submit');

    if (isEdit) {
        if (titleEl) titleEl.textContent = 'Edit Offer';
        if (subtitleEl) subtitleEl.textContent = 'Modify the job offer data.';
        if (submitBtn) submitBtn.textContent = 'Update Offer';
    }

    // Setup tag inputs with custom logic
    populateCategorySelect();
    populateSkillSelect();

    setupTagSelect('categories-wrap', 'of-categories', categories, () => {
        populateCategorySelect();
        populateSkillSelect();
    });
    setupTagSelect('skills-wrap', 'of-skills', skills, () => {
        populateSkillSelect();
    });

    // Si es edición, poblar formulario
    if (isEdit) {
        try {
            const offer = await getOfferById(params.id);
            if (offer) populateForm(offer);
        } catch (e) {
            showToast('Error loading offer.', 'error');
        }
    }

    // Submit handler
    const form = document.getElementById('offer-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const data = collectFormData();

        try {
            if (isEdit) {
                await updateOffer(params.id, data);
                showToast('Offer updated successfully.');
            } else {
                await createOffer(data);
                showToast('Offer created successfully.');
            }
            navigateTo('offers');
        } catch (err) {
            showToast(err.message || 'Error saving offer.', 'error');
        }
    });
}

/* ── Tag Input Component ───────────────────────────────────────── */

function setupTagSelect(wrapId, selectId, store, onAddOrRemove) {
    const wrap = document.getElementById(wrapId);
    const select = document.getElementById(selectId);
    if (!wrap || !select) return;

    select.addEventListener('change', (e) => {
        const val = select.value;
        if (val && !store.includes(val)) {
            store.push(val);
            renderTags(wrap, select, store, onAddOrRemove);
            if (onAddOrRemove) onAddOrRemove();
        }
        select.value = '';
    });
}

function renderTags(wrap, input, store, onRemove) {
    // Remover chips existentes
    wrap.querySelectorAll('.tag-chip').forEach(el => el.remove());

    // Insertar antes del input
    store.forEach((tag, i) => {
        const chip = document.createElement('span');
        chip.className = 'tag-chip';
        chip.innerHTML = `${esc(tag)}<button type="button" class="tag-chip__remove" data-index="${i}">&times;</button>`;
        wrap.insertBefore(chip, input);
    });

    // Event delegation para remover
    wrap.querySelectorAll('.tag-chip__remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index);
            store.splice(idx, 1);
            renderTags(wrap, input, store, onRemove);
            if (onRemove) onRemove();
        });
    });
}

function populateCategorySelect() {
    const select = document.getElementById('of-categories');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Select a category</option>';
    CATEGORIES_DATA.forEach(cat => {
        if (!categories.includes(cat.name)) {
            const opt = document.createElement('option');
            opt.value = cat.name;
            opt.textContent = cat.name;
            select.appendChild(opt);
        }
    });
}

function populateSkillSelect() {
    const select = document.getElementById('of-skills');
    if (!select) return;

    if (categories.length === 0) {
        select.innerHTML = '<option value="" disabled selected>Select a category first</option>';
        select.disabled = true;
        return;
    }

    select.innerHTML = '<option value="" disabled selected>Select technologies</option>';

    // Group skills by category name
    let groupedSkills = {};
    const hasFullStack = categories.includes('FullStack');

    CATEGORIES_DATA.forEach(cat => {
        // If the category is explicitly selected, or if FullStack is selected and this is Frontend/Backend
        if (categories.includes(cat.name) || (hasFullStack && (cat.name === 'Frontend' || cat.name === 'Backend'))) {
            if (!groupedSkills[cat.name]) groupedSkills[cat.name] = new Set();
            cat.skills.forEach(s => groupedSkills[cat.name].add(s));
        }
    });

    let hasOptions = false;

    // Render optgroups
    for (const [groupName, skillSet] of Object.entries(groupedSkills)) {
        // Filter out skills that are already selected
        const availableInGroup = Array.from(skillSet).sort().filter(skill => !skills.includes(skill));

        if (availableInGroup.length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = groupName;

            availableInGroup.forEach(skill => {
                const opt = document.createElement('option');
                opt.value = skill;
                opt.textContent = skill;
                optgroup.appendChild(opt);
            });

            select.appendChild(optgroup);
            hasOptions = true;
        }
    }

    select.disabled = !hasOptions;
    if (!hasOptions && categories.length > 0) {
        select.innerHTML = '<option value="" disabled selected>All technologies selected</option>';
    }
}

/* ── Form Helpers ──────────────────────────────────────────────── */

function collectFormData() {
    return {
        title: val('of-title'),
        categories: [...categories],
        skills: [...skills],
        min_experience_years: parseInt(val('of-experience')) || 0,
        positions_available: 1, // field was removed from form logic
        required_english_level: val('of-english'),
        modality: val('of-modality'),
        salary: parseFloat(val('of-salary')) || 0,
        description: val('of-description'),
    };
}

function populateForm(offer) {
    setVal('of-id', offer.id);
    setVal('of-title', offer.title);
    setVal('of-experience', offer.min_experience_years);
    setVal('of-english', offer.required_english_level);
    setVal('of-modality', offer.modality);
    setVal('of-salary', offer.salary);
    setVal('of-description', offer.description);

    // Poblar tags
    if (offer.categories) {
        categories.push(...offer.categories);
        const wrap = document.getElementById('categories-wrap');
        const select = document.getElementById('of-categories');
        renderTags(wrap, select, categories, () => {
            populateCategorySelect();
            populateSkillSelect();
        });
        populateCategorySelect();
        populateSkillSelect();
    }

    if (offer.skills) {
        skills.push(...offer.skills);
        const wrap = document.getElementById('skills-wrap');
        const select = document.getElementById('of-skills');
        renderTags(wrap, select, skills, () => {
            populateSkillSelect();
        });
        populateSkillSelect();
    }
}

function validateForm() {
    let valid = true;

    valid = checkRequired('of-title', 'err-title') && valid;
    valid = checkRequired('of-english', 'err-english') && valid;
    valid = checkRequired('of-modality', 'err-modality') && valid;
    valid = checkRequired('of-description', 'err-description') && valid;

    // Tags
    if (categories.length === 0) {
        showError('err-categories'); valid = false;
    } else { hideError('err-categories'); }

    if (skills.length === 0) {
        showError('err-skills'); valid = false;
    } else { hideError('err-skills'); }

    return valid;
}

function checkRequired(inputId, errorId) {
    const v = val(inputId);
    if (!v) { showError(errorId); return false; }
    hideError(errorId);
    return true;
}

function showError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('is-visible');
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-visible');
}

function val(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

function setVal(id, v) {
    const el = document.getElementById(id);
    if (el) el.value = v || '';
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}
