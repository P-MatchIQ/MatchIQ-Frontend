// ── n8n Webhook Integration ─────────────────────────────────────
// Sends webhook notifications to n8n for automated email workflows.

// TODO: Replace with your actual n8n webhook URLs
const N8N_WEBHOOKS = {
    testSent: 'https://your-n8n-instance.com/webhook/test-sent',
    passedFilter: 'https://your-n8n-instance.com/webhook/passed-filter',
};

/**
 * Notify n8n that a test was sent to a candidate.
 * n8n should trigger an email to the candidate.
 */
export async function notifyTestSent({ candidateEmail, candidateName, offerTitle, companyName }) {
    try {
        await fetch(N8N_WEBHOOKS.testSent, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'test_sent',
                candidate_email: candidateEmail,
                candidate_name: candidateName,
                offer_title: offerTitle,
                company_name: companyName,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (err) {
        console.warn('n8n webhook (test_sent) failed:', err.message);
    }
}

/**
 * Notify n8n that a candidate passed the filter.
 * n8n should trigger a congratulations email.
 */
export async function notifyPassedFilter({ candidateEmail, candidateName, offerTitle, companyName, score }) {
    try {
        await fetch(N8N_WEBHOOKS.passedFilter, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: 'passed_filter',
                candidate_email: candidateEmail,
                candidate_name: candidateName,
                offer_title: offerTitle,
                company_name: companyName,
                score,
                timestamp: new Date().toISOString(),
            }),
        });
    } catch (err) {
        console.warn('n8n webhook (passed_filter) failed:', err.message);
    }
}
