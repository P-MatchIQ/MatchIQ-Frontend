// ── Candidate Tests Page ────────────────────────────────────────
// Shows tests assigned by companies and lets candidates resolve them.

import { authMe, authLogout } from '../../api/authApi.js';
import {
    getTestsForCandidate,
    getGorillaTest,
    submitGorillaTest,
    markTestCompleted,
} from '../../api/testsApi.js';

const $ = (sel) => document.querySelector(sel);

let state = {
    user: null,
    tests: [],
    currentTest: null,
    currentAssignment: null,
    answers: {},
    timerInterval: null,
    timeLeft: 0,
};

// ── Auth ──────────────────────────────────────────────────────────
async function ensureCandidateAccess() {
    const me = await authMe();
    if (!me?.authenticated || !me?.user) {
        window.location.href = '/public/login.html';
        return null;
    }
    if (me.user.role !== 'candidate') {
        window.location.href = '/public/login.html';
        return null;
    }
    return me.user;
}

// ── Render Tests List ─────────────────────────────────────────────
function renderTestsList() {
    const container = $('#testsContainer');
    const assignments = getTestsForCandidate(state.user.id, state.user.email);
    state.tests = assignments;

    const pending = assignments.filter(a => a.status === 'pending');
    const completed = assignments.filter(a => a.status === 'completed');

    $('#pendingCount').textContent = pending.length;
    $('#completedCount').textContent = completed.length;

    if (assignments.length === 0) {
        container.innerHTML = `
            <div class="empty-state test-empty">
                <div style="margin-bottom: 12px; opacity: 0.4;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg></div>
                <p>No tienes tests asignados todavía.</p>
                <p style="font-size: 13px; opacity: 0.7;">Las empresas te enviarán tests cuando les interese tu perfil.</p>
            </div>`;
        return;
    }

    container.innerHTML = `
        <div class="tests-list">
            ${assignments.map(a => renderTestCard(a)).join('')}
        </div>`;

    // Bind click events
    container.querySelectorAll('.test-card__action').forEach(btn => {
        btn.addEventListener('click', () => {
            const offerId = btn.dataset.offerId;
            const assignment = assignments.find(a => a.offerId === offerId);
            if (assignment) startTest(assignment);
        });
    });
}

function renderTestCard(assignment) {
    const isCompleted = assignment.status === 'completed';
    const sentDate = new Date(assignment.sentAt).toLocaleDateString('es-CO', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    const iconDone = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#10b981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`;
    const iconPending = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="var(--bg-800)" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`;

    return `
    <div class="test-card ${isCompleted ? 'test-card--completed' : ''}">
        <div class="test-card__left">
            <div class="test-card__icon">${isCompleted ? iconDone : iconPending}</div>
            <div class="test-card__info">
                <h4 class="test-card__title">${esc(assignment.offerTitle || 'Gorilla Test')}</h4>
                <p class="test-card__company">${esc(assignment.companyName || 'Empresa')}</p>
                <span class="test-card__date">Enviado el ${sentDate}</span>
            </div>
        </div>
        <div class="test-card__right">
            <span class="test-card__status ${isCompleted ? 'test-card__status--done' : 'test-card__status--pending'}">
                ${isCompleted ? 'Completado' : 'Pendiente'}
            </span>
            ${!isCompleted ? `
            <button class="btn btn--primary test-card__action" data-offer-id="${assignment.offerId}">
                Resolver →
            </button>` : ''}
        </div>
    </div>`;
}

// ── Start Test ────────────────────────────────────────────────────
async function startTest(assignment) {
    try {
        // Show loading
        $('#testsListView').style.display = 'none';
        $('#testTakingView').style.display = '';
        $('#testResultsView').style.display = 'none';

        $('#testQuestionsContainer').innerHTML = `
            <div class="page-loader-overlay" style="position: relative; min-height: 200px; background: transparent;">
                <div class="page-loader-overlay__spinner"></div>
                <span class="page-loader-overlay__text">Cargando test…</span>
            </div>`;

        // Fetch the test
        const test = await getGorillaTest(assignment.offerId);
        state.currentTest = test;
        state.currentAssignment = assignment;
        state.answers = {};

        $('#testTitle').textContent = test.test_title || 'Gorilla Test';

        // Start timer
        state.timeLeft = (test.time_limit_minutes || 30) * 60;
        updateTimerDisplay();
        state.timerInterval = setInterval(() => {
            state.timeLeft--;
            updateTimerDisplay();
            if (state.timeLeft <= 0) {
                clearInterval(state.timerInterval);
                autoSubmitTest();
            }
        }, 1000);

        // Render questions
        renderQuestions(test.questions);

    } catch (err) {
        console.error('Error loading test:', err);
        $('#testQuestionsContainer').innerHTML = `
            <div class="alert is-error" style="text-align: center;">
                Error cargando el test: ${esc(err.message)}
            </div>`;
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(state.timeLeft / 60);
    const secs = state.timeLeft % 60;
    const timer = $('#testTimer');
    timer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (state.timeLeft <= 60) {
        timer.classList.add('test-timer--danger');
    }
}

function renderQuestions(questions) {
    const container = $('#testQuestionsContainer');

    container.innerHTML = questions.map((q, idx) => `
        <div class="test-question" data-question="${idx + 1}">
            <div class="test-question__header">
                <span class="test-question__number">Pregunta ${idx + 1} de ${questions.length}</span>
                ${q.difficulty ? `<span class="test-question__difficulty test-question__difficulty--${q.difficulty}">${esc(q.difficulty)}</span>` : ''}
            </div>
            <h4 class="test-question__text">${esc(q.question)}</h4>
            <div class="test-question__options">
                ${Object.entries(q.options || {}).map(([key, value]) => `
                    <label class="test-option" data-question="${idx + 1}" data-option="${key}">
                        <input type="radio" name="q${idx + 1}" value="${key}" />
                        <span class="test-option__check"></span>
                        <span class="test-option__label">
                            <strong>${key}.</strong> ${esc(value)}
                        </span>
                    </label>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Bind option clicks
    container.querySelectorAll('input[type="radio"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const questionNum = e.target.name.replace('q', '');
            state.answers[questionNum] = e.target.value;

            // Update visual state
            const parentQuestion = e.target.closest('.test-question');
            parentQuestion.querySelectorAll('.test-option').forEach(opt =>
                opt.classList.remove('test-option--selected'));
            e.target.closest('.test-option').classList.add('test-option--selected');

            updateProgress(questions.length);
        });
    });
}

function updateProgress(total) {
    const answered = Object.keys(state.answers).length;
    const pct = Math.round((answered / total) * 100);
    $('#testProgressBar').style.width = `${pct}%`;

    const submitBtn = $('#submitTestBtn');
    submitBtn.disabled = answered < total;
    submitBtn.textContent = answered < total
        ? `Enviar respuestas (${answered}/${total})`
        : 'Enviar respuestas ✓';
}

// ── Submit Test ───────────────────────────────────────────────────
async function autoSubmitTest() {
    await doSubmitTest();
}

async function doSubmitTest() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    const submitBtn = $('#submitTestBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    try {
        const result = await submitGorillaTest(
            state.currentTest.id,
            state.user.id,
            state.answers
        );

        // Mark as completed in localStorage
        markTestCompleted(
            state.currentAssignment.offerId,
            state.currentAssignment.candidateId
        );

        // Show results
        showResults(result);
    } catch (err) {
        console.error('Submit error:', err);

        // If already submitted, still show the view
        if (err.message?.includes('already submitted')) {
            markTestCompleted(
                state.currentAssignment.offerId,
                state.currentAssignment.candidateId
            );
            showResults({
                evaluation: { percentage_score: 0, correct_answers: '?', total_questions: '?', attention_level: '?' },
                message: 'Ya habías enviado este test anteriormente.',
            });
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar respuestas';
            alert(`Error enviando: ${err.message}`);
        }
    }
}

function showResults(result) {
    $('#testsListView').style.display = 'none';
    $('#testTakingView').style.display = 'none';
    $('#testResultsView').style.display = '';

    const eval_ = result.evaluation || {};
    const score = eval_.percentage_score ?? 0;

    $('#resultScore').textContent = `${Math.round(score)}%`;
    $('#resultCorrect').textContent = `${eval_.correct_answers ?? '—'}/${eval_.total_questions ?? '—'}`;
    $('#resultAttention').textContent = eval_.attention_level || '—';

    const trophySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#f59e0b" viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`;
    const thumbsUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--emerald-dark)" viewBox="0 0 24 24"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>`;
    const studySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--blue-500)" viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>`;

    if (score >= 80) {
        $('#resultIcon').innerHTML = trophySvg;
        $('#resultSubtitle').textContent = '¡Excelente resultado! Has demostrado un gran dominio.';
    } else if (score >= 50) {
        $('#resultIcon').innerHTML = thumbsUpSvg;
        $('#resultSubtitle').textContent = 'Buen trabajo. Sigue mejorando tus habilidades.';
    } else {
        $('#resultIcon').innerHTML = studySvg;
        $('#resultSubtitle').textContent = 'Sigue estudiando. Puedes mejorar.';
    }

    if (result.message && result.message.includes('Ya habías')) {
        $('#resultSubtitle').textContent = result.message;
    }
}

// ── Navigation ────────────────────────────────────────────────────
function showTestsList() {
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    $('#testsListView').style.display = '';
    $('#testTakingView').style.display = 'none';
    $('#testResultsView').style.display = 'none';
    renderTestsList();
}

// ── Utility ───────────────────────────────────────────────────────
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const user = await ensureCandidateAccess();
    if (!user) return;

    state.user = user;
    $('#welcomeText').textContent = `Hola, ${user.email?.split('@')[0] || 'Candidato'}`;

    // Hide loader, show layout
    const pageLoader = document.getElementById('pageLoader');
    const mainLayout = document.getElementById('mainLayout');
    if (pageLoader) pageLoader.remove();
    if (mainLayout) mainLayout.style.display = '';

    renderTestsList();

    // Back button
    $('#backToListBtn')?.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres salir del test? Perderás tu progreso.')) {
            showTestsList();
        }
    });

    // Submit button
    $('#submitTestBtn')?.addEventListener('click', doSubmitTest);

    // Back to tests from results
    $('#backToTestsBtn')?.addEventListener('click', showTestsList);

    // Logout
    $('#logoutBtn')?.addEventListener('click', async () => {
        await authLogout();
        window.location.href = '/public/login.html';
    });

    // Edit profile redirect
    $('#editProfileBtn')?.addEventListener('click', () => {
        window.location.href = './dashboard.html';
    });
});
