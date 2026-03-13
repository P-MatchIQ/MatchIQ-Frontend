// ── Offers List View Logic ──────────────────────────────────────
// Renderiza la lista de ofertas con filtros y acciones
// (editar, cerrar, cancelar con confirmación).

import { getOffers, closeOffer, cancelOffer } from '../../api/offersApi.js';
import { showToast, showConfirmModal, showOfferModal } from './app.js';

const MODALITY_LABELS = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' };

const STATUS_LABELS = {
    open: { label: 'Open', cls: 'pill--active' },
    active: { label: 'Active', cls: 'pill--active' },
    in_process: { label: 'In Process', cls: 'pill--in-process' },
    closed: { label: 'Closed', cls: 'pill--closed' },
    cancelled: { label: 'Cancelled', cls: 'pill--cancelled' },
};

let allOffers = [];
let filter = 'all';

/**
 * Inicializa la vista de lista de ofertas.
 */
export async function initOffers() {
    // Show loader in container
    const container = document.getElementById('offers-container');
    if (container) {
        container.innerHTML = `
            <div class="page-loader" style="grid-column: 1 / -1;">
                <div class="page-loader__spinner"></div>
                <span class="page-loader__text">Loading offers…</span>
            </div>`;
    }

    allOffers = await getOffers();
    filter = 'all';

    // Setup filtros
    const filtersContainer = document.getElementById('offer-filters');
    if (filtersContainer) {
        filtersContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.filter-btn');
            if (!btn) return;
            filter = btn.dataset.filter;
            filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            renderOffers();
        });
    }

    renderOffers();
}

/* ── Render ─────────────────────────────────────────────────────── */

function renderOffers() {
    const container = document.getElementById('offers-container');
    if (!container) return;

    const filtered = filter === 'all'
        ? allOffers
        : allOffers.filter(o => o.status === filter);

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-state__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24" style="opacity:0.4">
                        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                    </svg>
                </div>
                <h2 class="empty-state__title">No ${filter !== 'all' ? STATUS_LABELS[filter]?.label.toLowerCase() : ''} offers</h2>
                <p class="empty-state__text">
                    ${filter === 'all'
                ? 'Create your first job offer to get started.'
                : 'You have no offers with this status.'}
                </p>
                ${filter === 'all' ? '<a href="#/offers/create" class="btn btn--primary">Create Offer</a>' : ''}
            </div>`;
        return;
    }

    container.innerHTML = filtered.map(o => renderOfferCard(o)).join('');

    // Event delegation para acciones — avoid stacking listeners
    container.removeEventListener('click', handleAction);
    container.addEventListener('click', handleAction);
}

function isActiveOffer(offer) {
    return offer.status === 'active' || offer.status === 'open';
}

function renderOfferCard(offer) {
    const status = STATUS_LABELS[offer.status] || { label: offer.status, cls: '' };
    const salary = offer.salary
        ? `$${offer.salary.toLocaleString('es-CO')} COP`
        : 'Not specified';

    return `
    <article class="offer-card" data-id="${offer.id}">
        <div class="offer-card__header">
            <h3 class="offer-card__title">${esc(offer.title)}</h3>
            <span class="pill ${status.cls}">${status.label}</span>
        </div>

        <div class="offer-card__details">
            <div class="offer-card__detail">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8z"/>
                </svg>
                <strong>${esc(offer.required_english_level || '—')}</strong>
            </div>
            <div class="offer-card__detail">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                </svg>
                <strong>${MODALITY_LABELS[offer.modality] || '—'}</strong>
            </div>
            <div class="offer-card__detail">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
                <strong>${salary}</strong>
            </div>
        </div>

        ${isActiveOffer(offer) ? `
        <div class="offer-card__actions">
            <a href="#/matches/${offer.id}" class="btn btn--ghost btn--sm" onclick="event.stopPropagation()">Find Matches</a>
            <a href="#/offers/edit/${offer.id}" class="btn btn--ghost btn--sm">Edit</a>
            <button class="btn btn--warning btn--sm" data-action="close" data-id="${offer.id}">Close</button>
            <button class="btn btn--danger btn--sm" data-action="cancel" data-id="${offer.id}">Cancel</button>
        </div>` : ''}
    </article>`;
}

/* ── Actions ───────────────────────────────────────────────────── */

async function handleAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) {
        if (e.target.closest('a')) return;

        const card = e.target.closest('.offer-card');
        if (card) {
            const cardId = card.dataset.id;
            const offer = allOffers.find(o => String(o.id) === String(cardId));
            if (offer) {
                const actionsHtml = isActiveOffer(offer) ? `<a href="#/offers/edit/${offer.id}" class="btn btn--primary" style="text-decoration: none;">Edit</a>` : '';
                showOfferModal(offer, actionsHtml);
            }
        }
        return;
    }

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === 'close') {
        await closeOffer(id);
        showToast('Offer closed.');
        allOffers = await getOffers();
        renderOffers();
    }

    if (action === 'cancel') {
        const confirmed = await showConfirmModal(
            'Cancel offer',
            'Are you sure you want to cancel this offer? This action cannot be undone.'
        );
        if (!confirmed) return;

        await cancelOffer(id);
        showToast('Offer cancelled.');
        allOffers = await getOffers();
        renderOffers();
    }
}

/* ── Helpers ───────────────────────────────────────────────────── */

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}
