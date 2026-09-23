export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const token = process.env.MONDAY_API_TOKEN;
    if (!token) {
      return res.status(500).json({ ok: false, error: 'MONDAY_API_TOKEN is not configured.' });
    }

    const { name, company, email, website, marketing_challenge } = req.body || {};
    if (!name || !company || !email) {
      return res.status(400).json({ ok: false, error: 'Name, company and email are required.' });
    }

    const cleanName = String(name).trim();
    const cleanCompany = String(company).trim();
    const cleanEmail = String(email).trim();
    const rawWebsite = website ? String(website).trim() : '';
    const cleanWebsite = rawWebsite
      ? (/^https?:\/\//i.test(rawWebsite) ? rawWebsite : 'https://' + rawWebsite)
      : '';
    const cleanChallenge = marketing_challenge ? String(marketing_challenge).trim() : '';

    const columnValues = {
      short_textdpp6zmrm: cleanCompany,
      emailyspsd6hy: { email: cleanEmail, text: cleanEmail },
      long_textvmb0jsbb: cleanChallenge
    };

    if (cleanWebsite) {
      columnValues.link10fr61mi = {
        url: cleanWebsite,
        text: rawWebsite.replace(/^https?:\/\//i, '')
      };
    }

    const query = `
      mutation CreateMarketingAuditEntry($name: String!, $columns: JSON!) {
        create_item(
          board_id: 18432433298,
          group_id: "topics",
          item_name: $name,
          column_values: $columns
        ) {
          id
          name
        }
      }
    `;

    const mondayResponse = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'API-Version': '2025-04'
      },
      body: JSON.stringify({
        query,
        variables: {
          name: cleanName,
          columns: JSON.stringify(columnValues)
        }
      })
    });

    const mondayResult = await mondayResponse.json();

    if (!mondayResponse.ok || mondayResult.errors?.length) {
      return res.status(502).json({
        ok: false,
        error: 'Could not save submission to monday.com.',
        detail: mondayResult.errors || mondayResult
      });
    }

    return res.status(200).json({
      ok: true,
      item_id: mondayResult.data?.create_item?.id || null
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Unexpected server error',
      detail: error?.message || String(error)
    });
  }
}
