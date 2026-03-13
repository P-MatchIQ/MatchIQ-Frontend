// ── Matches View Logic ──────────────────────────────────────────
// Shows candidate matches ranked by compatibility for a specific offer.

import { getMatchesForOffer } from '../../api/matchingApi.js';
import { getOfferById } from '../../api/offersApi.js';
import { getTestInfo, getFullGorillaTest, assignTestToCandidate, getTestAssignments } from '../../api/testsApi.js';
import { getCompanyProfile } from '../../api/companyApi.js';
import { showToast } from './app.js';

/* ── SVG Icons ─────────────────────────────────────────────────── */
const ICON = {
    experience: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z"/></svg>`,
    english: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 014.33-3.56A15.65 15.65 0 008.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/></svg>`,
    seniority: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>`,
    person: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24" style="opacity:0.4"><path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2c-3.3 0-10 1.7-10 5v3h20v-3c0-3.3-6.7-5-10-5z"/></svg>`,
    test: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>`,
};

const ICON_LG = {
    experience: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 0h-4V4h4v2z"/></svg>`,
    english: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26z"/></svg>`,
    seniority: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/></svg>`,
};

const REC_COLORS = {
    strong: { bg: 'rgba(22, 163, 74, 0.12)', border: 'rgba(22, 163, 74, 0.35)', text: '#15803d', label: 'Strong' },
    moderate: { bg: 'rgba(234, 179, 8, 0.12)', border: 'rgba(234, 179, 8, 0.40)', text: '#a16207', label: 'Moderate' },
    weak: { bg: 'rgba(220, 38, 38, 0.12)', border: 'rgba(220, 38, 38, 0.30)', text: '#b91c1c', label: 'Weak' },
};

/** Build display name from whichever fields the backend provides */
function getCandidateName(candidate) {
    if (candidate.first_name || candidate.last_name) {
        return [candidate.first_name, candidate.last_name].filter(Boolean).join(' ');
    }
    return candidate.candidate_name || candidate.email || `Candidate ${String(candidate.candidate_id || '').slice(0, 8)}`;
}

/** Store candidates for modal access */
let candidatesMap = new Map();
let aiMapGlobal = new Map();
let currentOfferId = null;
let currentOfferTitle = '';
let cachedTestInfo = null;
let companyName = '';

/**
 * Initializes the matches view.
 * @param {{ id: string }} params - Must contain offer ID
 */
export async function initMatches(params = {}) {
    const container = document.getElementById('matches-container');
    const kpisEl = document.getElementById('matches-kpis');
    const titleEl = document.getElementById('matches-title');
    const subtitleEl = document.getElementById('matches-subtitle');

    candidatesMap.clear();
    aiMapGlobal.clear();
    cachedTestInfo = null;
    currentOfferId = params.id || null;

    if (!params.id) {
        container.innerHTML = emptyState('No offer selected', 'Go back to offers and click "Find Matches" on an offer.');
        return;
    }

    // Show loader
    container.innerHTML = `
        <div class="page-loader" style="grid-column: 1 / -1;">
            <div class="page-loader__spinner"></div>
            <span class="page-loader__text">Running matching algorithm…</span>
        </div>`;

    try {
        // Fetch offer details + matching + test info + company profile in parallel
        const [offer, matchResult, testInfo, companyProfile] = await Promise.all([
            getOfferById(params.id),
            getMatchesForOffer(params.id),
            getTestInfo(params.id).catch(() => null),
            getCompanyProfile().catch(() => null),
        ]);

        cachedTestInfo = testInfo;
        currentOfferTitle = offer?.title || '';
        companyName = companyProfile?.company_name || '';

        // Update header
        if (offer) {
            titleEl.textContent = `Matches for "${esc(offer.title)}"`;
            subtitleEl.textContent = `Candidates ranked by compatibility with this offer.`;
        }

        const { ranking = [], ai_evaluation_candidates: aiCandidates = [], total_candidates = 0 } = matchResult;

        // KPIs
        document.getElementById('match-kpi-total').textContent = total_candidates;
        document.getElementById('match-kpi-best').textContent = ranking.length > 0
            ? `${Math.round(ranking[0].final_match_percentage)}%`
            : '—';
        document.getElementById('match-kpi-ai').textContent = aiCandidates.length;
        kpisEl.style.display = '';

        // Empty state
        if (ranking.length === 0) {
            container.innerHTML = emptyState(
                'No matching candidates',
                'There are no candidates that match the requirements of this offer yet.'
            );
            return;
        }

        // Build AI lookup map
        aiCandidates.forEach(c => {
            if (c.ai_feedback) {
                aiMapGlobal.set(String(c.candidate_id), c.ai_feedback);
            }
        });

        // Store all candidates for modal
        ranking.forEach((c, i) => {
            candidatesMap.set(String(c.candidate_id), { ...c, rank: i + 1 });
        });

        // Render candidate cards
        container.innerHTML = ranking.map((c, i) => renderCandidateCard(c, i, aiMapGlobal)).join('');

        // Event delegation for card clicks
        container.addEventListener('click', (e) => {
            // Send Test button click
            const sendTestBtn = e.target.closest('.match-card__send-test');
            if (sendTestBtn) {
                e.stopPropagation();
                const candidateId = sendTestBtn.dataset.candidateId;
                if (candidateId) handleSendTest(candidateId);
                return;
            }

            // AI toggle
            const toggle = e.target.closest('.match-card__ai-toggle');
            if (toggle) {
                e.stopPropagation();
                const detail = toggle.closest('.match-card').querySelector('.match-card__ai-detail');
                if (detail) {
                    detail.classList.toggle('is-open');
                    toggle.textContent = detail.classList.contains('is-open') ? 'Hide AI insight ▲' : 'View AI insight ▼';
                }
                return;
            }

            // Card click → open profile modal
            const card = e.target.closest('.match-card');
            if (card) {
                const candidateId = card.dataset.candidateId;
                if (candidateId) openCandidateModal(candidateId);
            }
        });

        // Modal close handlers
        setupModalClose();
        setupPreviewModal();

    } catch (err) {
        console.error('Matching error:', err);
        container.innerHTML = emptyState(
            'Error running matching',
            err.message || 'Something went wrong. Please try again.'
        );
    }
}

/* ── Send Test Logic ────────────────────────────────────────────── */

let pendingSendCandidateId = null;

async function handleSendTest(candidateId) {
    const candidate = candidatesMap.get(candidateId);
    if (!candidate) return;

    const name = getCandidateName(candidate);

    if (!cachedTestInfo) {
        showToast('No test available for this offer. Tests are generated automatically when an offer is created.', 'error');
        return;
    }

    // Check if already sent
    const assignments = getTestAssignments();
    const alreadySent = assignments.some(a => a.offerId === currentOfferId && a.candidateId === candidateId);
    if (alreadySent) {
        showToast(`Test already sent to ${name}`, 'error');
        return;
    }

    // Fetch full test for preview
    try {
        showToast('Loading test preview…', 'info');
        const fullTest = await getFullGorillaTest(currentOfferId);
        pendingSendCandidateId = candidateId;
        openTestPreview(fullTest, name);
    } catch (err) {
        console.error('Error loading test preview:', err);
        showToast('Error loading test: ' + (err.message || 'Unknown error'), 'error');
    }
}

function openTestPreview(test, candidateName) {
    const modal = document.getElementById('testPreviewModal');
    if (!modal) return;

    document.getElementById('preview-test-title').textContent = test.test_title || 'Gorilla Test';
    document.getElementById('preview-test-meta').textContent =
        `${test.questions?.length || 0} questions · ${test.time_limit_minutes || 30} min · Sending to ${candidateName}`;

    const container = document.getElementById('preview-questions-container');
    container.innerHTML = (test.questions || []).map((q, idx) => `
        <div class="preview-question">
            <div class="preview-question__header">
                <span class="preview-question__number">Q${idx + 1}</span>
                ${q.difficulty ? `<span class="preview-question__difficulty preview-question__difficulty--${q.difficulty}">${esc(q.difficulty)}</span>` : ''}
            </div>
            <p class="preview-question__text">${esc(q.question)}</p>
            <div class="preview-question__options">
                ${Object.entries(q.options || {}).map(([key, value]) => {
                    const isCorrect = key === q.correct_answer;
                    return `
                        <div class="preview-option ${isCorrect ? 'preview-option--correct' : ''}">
                            <span class="preview-option__key">${key}</span>
                            <span class="preview-option__text">${esc(value)}</span>
                            ${isCorrect ? '<span class="preview-option__badge">Correct</span>' : ''}
                        </div>`;
                }).join('')}
            </div>
        </div>
    `).join('');

    modal.showModal();
}

function confirmSendTest() {
    if (!pendingSendCandidateId) return;

    const candidateId = pendingSendCandidateId;
    const candidate = candidatesMap.get(candidateId);
    const name = getCandidateName(candidate);

    const sent = assignTestToCandidate({
        offerId: currentOfferId,
        offerTitle: currentOfferTitle,
        candidateId: candidateId,
        candidateName: name,
        candidateEmail: candidate?.email || '',
        testId: cachedTestInfo.id,
        companyName: companyName,
    });

    if (sent) {
        showToast(`Test sent to ${name}`, 'success');

        // Update the button visually
        const btn = document.querySelector(`.match-card__send-test[data-candidate-id="${candidateId}"]`);
        if (btn) {
            btn.classList.add('match-card__send-test--sent');
            btn.innerHTML = `${ICON.test} Test Sent`;
            btn.disabled = true;
        }

        // Update modal button if open
        const modalBtn = document.getElementById('modal-send-test-btn');
        if (modalBtn && modalBtn.dataset.candidateId === candidateId) {
            modalBtn.classList.add('btn--ghost');
            modalBtn.classList.remove('btn--primary');
            modalBtn.textContent = '✓ Test Sent';
            modalBtn.disabled = true;
        }
    }

    // Close preview modal
    document.getElementById('testPreviewModal')?.close();
    pendingSendCandidateId = null;
}

function setupPreviewModal() {
    const modal = document.getElementById('testPreviewModal');
    const closeBtn = document.getElementById('closeTestPreview');
    const cancelBtn = document.getElementById('previewCancelBtn');
    const confirmBtn = document.getElementById('previewConfirmBtn');

    closeBtn?.addEventListener('click', () => { modal.close(); pendingSendCandidateId = null; });
    cancelBtn?.addEventListener('click', () => { modal.close(); pendingSendCandidateId = null; });
    confirmBtn?.addEventListener('click', confirmSendTest);
    modal?.addEventListener('click', (e) => { if (e.target === modal) { modal.close(); pendingSendCandidateId = null; } });
}

/* ── Modal ──────────────────────────────────────────────────────── */

function openCandidateModal(candidateId) {
    const modal = document.getElementById('candidateModal');
    const candidate = candidatesMap.get(candidateId);
    if (!modal || !candidate) return;

    const ai = aiMapGlobal.get(candidateId);
    const pct = Math.round(candidate.final_match_percentage || 0);
    const name = getCandidateName(candidate);

    const skills = candidate.matched_skills
        ? (typeof candidate.matched_skills === 'string' ? candidate.matched_skills.split(',') : candidate.matched_skills)
        : [];

    // Check if test already sent
    const assignments = getTestAssignments();
    const alreadySent = assignments.some(a => a.offerId === currentOfferId && a.candidateId === candidateId);

    // Header
    document.getElementById('modal-candidate-name').textContent = name;
    document.getElementById('modal-candidate-email').textContent = candidate.email || '';

    // Score section
    document.getElementById('modal-score-section').innerHTML = `
        <div class="candidate-modal__score-card">
            <div class="match-card__score match-card__score--lg" style="--pct: ${pct}">
                <svg class="match-card__gauge" viewBox="0 0 36 36">
                    <path class="match-card__gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    <path class="match-card__gauge-fill" stroke-dasharray="${pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                </svg>
                <span class="match-card__pct match-card__pct--lg">${pct}%</span>
            </div>
            <div>
                <strong class="candidate-modal__score-label">Match Score</strong>
                <span class="candidate-modal__rank-label">Ranked #${candidate.rank}</span>
            </div>
        </div>`;

    // Details grid
    document.getElementById('modal-details-grid').innerHTML = `
        <div class="candidate-modal__detail">
            <span class="candidate-modal__detail-icon">${ICON_LG.experience}</span>
            <div>
                <span class="candidate-modal__detail-label">Experience</span>
                <strong>${candidate.experience_years != null ? `${candidate.experience_years} years` : '—'}</strong>
            </div>
        </div>
        <div class="candidate-modal__detail">
            <span class="candidate-modal__detail-icon">${ICON_LG.english}</span>
            <div>
                <span class="candidate-modal__detail-label">English Level</span>
                <strong>${esc(candidate.english_level || '—')}</strong>
            </div>
        </div>
        <div class="candidate-modal__detail">
            <span class="candidate-modal__detail-icon">${ICON_LG.seniority}</span>
            <div>
                <span class="candidate-modal__detail-label">Seniority</span>
                <strong>${esc(candidate.seniority || '—')}</strong>
            </div>
        </div>`;

    // Skills
    document.getElementById('modal-skills-section').innerHTML = skills.length > 0 ? `
        <div class="candidate-modal__section">
            <h4>Matched Skills</h4>
            <div class="match-card__skills">
                ${skills.map(s => `<span class="match-card__skill">${esc(typeof s === 'string' ? s.trim() : s.name || s)}</span>`).join('')}
            </div>
        </div>` : '';

    // AI evaluation
    if (ai) {
        const rec = REC_COLORS[ai.recommendation] || REC_COLORS.moderate;
        document.getElementById('modal-ai-section').innerHTML = `
            <div class="candidate-modal__section">
                <h4>AI Evaluation</h4>
                <div class="match-card__ai-badge" style="background:${rec.bg}; border-color:${rec.border}; color:${rec.text}; margin-bottom: 12px;">
                    ${rec.label} match${ai.fit_score != null ? ` · ${ai.fit_score}/100` : ''}
                </div>
                <p class="ai-insight">${esc(ai.insight || '')}</p>
                ${ai.strengths?.length ? `
                <div class="ai-list ai-list--strengths">
                    <strong>Strengths</strong>
                    <ul>${ai.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
                </div>` : ''}
                ${ai.risks?.length ? `
                <div class="ai-list ai-list--risks">
                    <strong>Risks</strong>
                    <ul>${ai.risks.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
                </div>` : ''}
            </div>`;
    } else {
        document.getElementById('modal-ai-section').innerHTML = '';
    }

    // Send Test button in modal
    const testSection = document.getElementById('modal-test-section');
    if (testSection && cachedTestInfo) {
        testSection.innerHTML = `
            <div class="candidate-modal__section candidate-modal__test-action">
                <h4><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>Gorilla Test</h4>
                <p class="muted" style="margin-bottom: 12px;">Send a technical assessment to evaluate this candidate's skills.</p>
                <button class="btn ${alreadySent ? 'btn--ghost' : 'btn--primary'} btn--full"
                        id="modal-send-test-btn"
                        data-candidate-id="${candidateId}"
                        ${alreadySent ? 'disabled' : ''}>
                    ${alreadySent ? '✓ Test Sent' : 'Send Gorilla Test'}
                </button>
            </div>`;

        const modalSendBtn = document.getElementById('modal-send-test-btn');
        if (modalSendBtn && !alreadySent) {
            modalSendBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleSendTest(candidateId);
            });
        }
    } else if (testSection) {
        testSection.innerHTML = '';
    }

    modal.showModal();
}

function setupModalClose() {
    const modal = document.getElementById('candidateModal');
    const closeBtn = document.getElementById('closeCandidateModal');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.close());
    }

    // Close on backdrop click
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) modal.close();
    });
}

/* ── Render ─────────────────────────────────────────────────────── */

function renderCandidateCard(candidate, index, aiMap) {
    const pct = Math.round(candidate.final_match_percentage || 0);
    const ai = aiMap.get(String(candidate.candidate_id));
    const isTop = !!ai;

    const skills = candidate.matched_skills
        ? (typeof candidate.matched_skills === 'string' ? candidate.matched_skills.split(',') : candidate.matched_skills)
        : [];

    // Check if test already sent
    const assignments = getTestAssignments();
    const alreadySent = assignments.some(a => a.offerId === currentOfferId && a.candidateId === String(candidate.candidate_id));

    return `
    <article class="match-card${isTop ? ' match-card--ai' : ''}" data-candidate-id="${candidate.candidate_id}" role="button" tabindex="0">
        <div class="match-card__rank">#${index + 1}</div>

        <div class="match-card__body">
            <div class="match-card__header">
                <div>
                    <h3 class="match-card__name">${esc(getCandidateName(candidate))}</h3>
                    <span class="match-card__email">${esc(candidate.email || '')}</span>
                </div>
                <div class="match-card__score" style="--pct: ${pct}">
                    <svg class="match-card__gauge" viewBox="0 0 36 36">
                        <path class="match-card__gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        <path class="match-card__gauge-fill" stroke-dasharray="${pct}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    </svg>
                    <span class="match-card__pct">${pct}%</span>
                </div>
            </div>

            <div class="match-card__meta">
                ${candidate.experience_years != null ? `<span class="match-card__tag">${ICON.experience} ${candidate.experience_years} yrs exp</span>` : ''}
                ${candidate.english_level ? `<span class="match-card__tag">${ICON.english} ${esc(candidate.english_level)}</span>` : ''}
                ${candidate.seniority ? `<span class="match-card__tag">${ICON.seniority} ${esc(candidate.seniority)}</span>` : ''}
            </div>

            ${skills.length > 0 ? `
            <div class="match-card__skills">
                ${skills.map(s => `<span class="match-card__skill">${esc(typeof s === 'string' ? s.trim() : s.name || s)}</span>`).join('')}
            </div>` : ''}

            ${isTop ? renderAiBadge(ai) : ''}

            <div class="match-card__footer">
                <span class="match-card__view-profile">View profile →</span>
                ${cachedTestInfo ? `
                <button class="match-card__send-test${alreadySent ? ' match-card__send-test--sent' : ''}"
                        data-candidate-id="${candidate.candidate_id}"
                        ${alreadySent ? 'disabled' : ''}>
                    ${ICON.test} ${alreadySent ? 'Test Sent' : 'Send Test'}
                </button>` : ''}
            </div>
        </div>
    </article>`;
}

function renderAiBadge(ai) {
    const rec = REC_COLORS[ai.recommendation] || REC_COLORS.moderate;
    return `
    <div class="match-card__ai-section">
        <div class="match-card__ai-badge" style="background:${rec.bg}; border-color:${rec.border}; color:${rec.text};">
            AI: ${rec.label} match
            ${ai.fit_score != null ? ` · ${ai.fit_score}/100` : ''}
        </div>
        <button class="match-card__ai-toggle" type="button">View AI insight ▼</button>
        <div class="match-card__ai-detail">
            <p class="ai-insight">${esc(ai.insight || '')}</p>
            ${ai.strengths?.length ? `
            <div class="ai-list ai-list--strengths">
                <strong>Strengths</strong>
                <ul>${ai.strengths.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
            </div>` : ''}
            ${ai.risks?.length ? `
            <div class="ai-list ai-list--risks">
                <strong>Risks</strong>
                <ul>${ai.risks.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
            </div>` : ''}
        </div>
    </div>`;
}

function emptyState(title, text) {
    return `
    <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-state__icon">${ICON.person}</div>
        <h2 class="empty-state__title">${title}</h2>
        <p class="empty-state__text">${text}</p>
        <a href="#/offers" class="btn btn--primary">Back to Offers</a>
    </div>`;
}

function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}
