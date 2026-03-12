import { registerRoute, startRouter } from './router.js';
import { initDashboard } from './dashboard.js';
import { initOfferCreate } from './offerCreate.js';
import { initOffers } from './offers.js';
import { initProfile } from './profile.js';

// ── Helpers globales ─────────────────────────────────────────────

/** Toast notification */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}

/** Modal de confirmación */
export function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('modal-overlay');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        overlay.classList.add('is-open');

        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        function cleanup(result) {
            overlay.classList.remove('is-open');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            resolve(result);
        }

        function onConfirm() { cleanup(true); }
        function onCancel() { cleanup(false); }

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

/** Offer Details Modal */
export function showOfferModal(offer, actionsHtml, onActionClick) {
    const overlay = document.getElementById('offer-modal-overlay');
    if (!overlay) return;

    // Populate data
    document.getElementById('offer-modal-title').textContent = offer.title || 'Offer Details';

    // Status
    const statusMap = {
        open: '<span class="pill pill--active">Open</span>',
        active: '<span class="pill pill--active">Active</span>',
        in_process: '<span class="pill pill--in-process">In Process</span>',
        closed: '<span class="pill pill--closed">Closed</span>',
        cancelled: '<span class="pill pill--cancelled">Cancelled</span>',
    };
    document.getElementById('offer-modal-status').innerHTML = statusMap[offer.status] || `<span class="pill">${offer.status}</span>`;

    // Tags — el backend puede devolver strings o {id, name} objects
    const rawTags = [...(offer.categories || []), ...(offer.skills || [])];
    const tags = rawTags.map(t => typeof t === 'object' ? t.name : t);
    document.getElementById('offer-modal-meta').innerHTML = tags.map(t => `<span class="offer-card__tag">${t}</span>`).join('');

    // Details grid
    const modalityMap = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' };
    document.getElementById('offer-modal-exp').textContent = offer.min_experience_years ? `${offer.min_experience_years} years` : '0 years';
    document.getElementById('offer-modal-eng').textContent = offer.required_english_level || '—';
    document.getElementById('offer-modal-mod').textContent = modalityMap[offer.modality] || offer.modality || '—';
    document.getElementById('offer-modal-sal').textContent = offer.salary ? `$${offer.salary.toLocaleString('es-CO')} COP` : 'Not specified';

    // Description
    document.getElementById('offer-modal-desc').textContent = offer.description || 'No description provided.';

    // Actions
    const actionsContainer = document.getElementById('offer-modal-actions');
    actionsContainer.innerHTML = actionsHtml + `<button class="btn btn--outline" id="offer-modal-close">Close</button>`;

    // Event listener for actions
    const clickHandler = (e) => {
        if (e.target.id === 'offer-modal-close') {
            closeModal();
            return;
        }
        if (onActionClick) {
            onActionClick(e, closeModal);
        }
    };

    actionsContainer.addEventListener('click', clickHandler);

    function closeModal() {
        overlay.classList.remove('is-open');
        actionsContainer.removeEventListener('click', clickHandler);
    }

    overlay.classList.add('is-open');
}

// ── Registrar rutas ──────────────────────────────────────────────

registerRoute('dashboard', './dashboard.html', initDashboard);
registerRoute('offers/create', './offerCreate.html', initOfferCreate);
registerRoute('offers', './offers.html', initOffers);
registerRoute('offers/edit', './offerCreate.html', initOfferCreate);   // reutiliza form
registerRoute('profile', './profile.html', initProfile);

import { authLogout } from '../../api/authApi.js';

// ── Logout ───────────────────────────────────────────────────────
document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await authLogout(); // limpia cookie httpOnly en el backend + sesión local
    window.location.href = '../login.html';
});

// ── Iniciar app ──────────────────────────────────────────────────
startRouter();
