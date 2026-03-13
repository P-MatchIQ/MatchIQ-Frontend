// ── Tests API ───────────────────────────────────────────────────
// Gorilla Test endpoints for offers and candidates.

import { apiFetch } from './apiClient.js';

/**
 * Get Gorilla Test for a candidate (questions WITHOUT correct answers).
 * @param {string} offerId
 * @returns {Promise<{ success: boolean, test: object }>}
 */
export async function getGorillaTest(offerId) {
    const res = await apiFetch(`/tests/job-offers/${offerId}/gorilla-test`);
    return res.test;
}

/**
 * Get FULL Gorilla Test (questions WITH correct answers) — company preview.
 * @param {string} offerId
 * @returns {Promise<object>}
 */
export async function getFullGorillaTest(offerId) {
    const res = await apiFetch(`/tests/job-offers/${offerId}/gorilla-test/full`);
    return res.test;
}

/**
 * Get test metadata (id, offer_id, time_limit_minutes) for an offer.
 * @param {string} offerId
 * @returns {Promise<object>}
 */
export async function getTestInfo(offerId) {
    const res = await apiFetch(`/tests/job-offers/${offerId}/test-info`);
    return res.test;
}

/**
 * Submit candidate answers for a Gorilla Test.
 * @param {string} testId
 * @param {string} candidateId
 * @param {object} answers - e.g. { "1": "A", "2": "C" }
 * @returns {Promise<object>}
 */
export async function submitGorillaTest(testId, candidateId, answers) {
    return apiFetch(`/tests/gorilla-tests/${testId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ candidate_id: candidateId, answers }),
    });
}

/**
 * Get all submissions for a test, ranked by score.
 * @param {string} testId
 * @returns {Promise<Array>}
 */
export async function getTestSubmissions(testId) {
    const res = await apiFetch(`/tests/gorilla-tests/${testId}/submissions`);
    return res.submissions;
}

/**
 * Get detailed result for one candidate in a test.
 * @param {string} testId
 * @param {string} candidateId
 * @returns {Promise<object>}
 */
export async function getCandidateSubmission(testId, candidateId) {
    const res = await apiFetch(`/tests/gorilla-tests/${testId}/submissions/${candidateId}`);
    return res.submission;
}

// ── localStorage helpers for test assignments ────────────────────
const STORAGE_KEY = 'matchiq_test_assignments';

/**
 * Mark a test as "sent" to a candidate (stores in localStorage).
 * @param {{ offerId: string, offerTitle: string, candidateId: string, candidateName: string, testId: string, companyName: string }} data
 */
export function assignTestToCandidate(data) {
    const existing = getTestAssignments();
    // Prevent duplicates
    const key = `${data.offerId}__${data.candidateId}`;
    if (existing.some(a => `${a.offerId}__${a.candidateId}` === key)) return false;
    existing.push({ ...data, sentAt: new Date().toISOString(), status: 'pending' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
}

/**
 * Get all test assignments from localStorage.
 * @returns {Array}
 */
export function getTestAssignments() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
}

/**
 * Get test assignments for a specific candidate.
 * Matches by candidateId OR candidateEmail (since user.id ≠ candidate_id).
 * @param {string} candidateId
 * @param {string} [email]
 * @returns {Array}
 */
export function getTestsForCandidate(candidateId, email) {
    return getTestAssignments().filter(a =>
        a.candidateId === candidateId ||
        (email && a.candidateEmail && a.candidateEmail.toLowerCase() === email.toLowerCase())
    );
}

/**
 * Mark a test assignment as completed.
 * @param {string} offerId
 * @param {string} candidateId
 */
export function markTestCompleted(offerId, candidateId) {
    const all = getTestAssignments();
    const idx = all.findIndex(a => a.offerId === offerId && a.candidateId === candidateId);
    if (idx !== -1) {
        all[idx].status = 'completed';
        all[idx].completedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
}
