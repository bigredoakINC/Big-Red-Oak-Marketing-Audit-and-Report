export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { name, company, email, website, marketing_challenge } = req.body || {};
    if (!name || !company || !email) {
      return res.status(400).json({ ok: false, error: 'Name, company and email are required.' });
    }

    const payload = {
      name: String(name).trim(),
      company: String(company).trim(),
      email: String(email).trim(),
      website: website ? String(website).trim() : '',
      marketing_challenge: marketing_challenge ? String(marketing_challenge).trim() : ''
    };

    const mondayResponse = await fetch(
      'https://monday-webhooks.monday.com/monday-webhooks/app/incoming-webhooks-triggers/eaaa686c-2e40-4abe-abb9-06e99e5c81e8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!mondayResponse.ok) {
      const body = await mondayResponse.text();
      return res.status(502).json({ ok: false, error: 'Submission service error', detail: body });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: 'Unexpected server error' });
  }
}
