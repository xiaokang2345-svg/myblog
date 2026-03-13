export default async (req, res) => {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;
  
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Missing code' });

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code })
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error_description || 'Auth failed' });
    
    res.status(200).json({ access_token: data.access_token, token_type: data.token_type, scope: data.scope });
  } catch (e) {
    console.error('Auth error:', e);
    res.status(500).json({ error: 'Server error' });
  }
};