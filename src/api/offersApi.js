// ── Offers API ──────────────────────────────────────────────────────
// CRUD de ofertas laborales.
// Usa JSON Server como backend temporal.

import { fetchApi } from './apiClient.js';

/* ── API Pública ───────────────────────────────────────────────── */

/**
 * Obtener todas las ofertas de la empresa.
 * @returns {Promise<Array>}
 */
export async function getOffers() {
    return fetchApi('/offers');
}

/**
 * Obtener una oferta por su ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getOfferById(id) {
    return fetchApi(`/offers/${id}`).catch(() => null);
}

/**
 * Crear una nueva oferta.
 * @param {object} data - Datos de la oferta
 * @returns {Promise<object>} - Oferta creada
 */
export async function createOffer(data) {
    const newOffer = {
        ...data,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return fetchApi('/offers', { method: 'POST', body: JSON.stringify(newOffer) });
}

/**
 * Actualizar una oferta existente.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updateOffer(id, data) {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    return fetchApi(`/offers/${id}`, { method: 'PATCH', body: JSON.stringify(updateData) });
}

/**
 * Cerrar una oferta (status → closed).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function closeOffer(id) {
    return fetchApi(`/offers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'closed' })
    });
}

/**
 * Cancelar una oferta (status → cancelled).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function cancelOffer(id) {
    return fetchApi(`/offers/${id}/force-cancel`, {
        method: 'PATCH'
    });
}
