// api/auth.js - 完整版
export default async function handler(req, res) {
  const { code, state, scope, site_id, provider } = req.query;

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  // 第一步：没有 code 时，重定向到 GitHub 授权页
  if (!code) {
    if (!clientId) {
      return res.status(500).json({ error: 'Missing GITHUB_CLIENT_ID environment variable' });
    }

    const redirectBase =
      process.env.DEPLOY_URL ||
      process.env.SITE_URL ||
      'https://kaimaoxing.com';

    const redirectUri = `${redirectBase.replace(/\/$/, '')}/api/auth`;

    const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
    authorizeUrl.searchParams.set('client_id', clientId);
    authorizeUrl.searchParams.set('redirect_uri', redirectUri);
    authorizeUrl.searchParams.set('scope', scope || 'repo');
    authorizeUrl.searchParams.set('state', state || site_id || provider || 'decap-cms');

    return res.redirect(authorizeUrl.toString());
  }

  // 第二步：GitHub 带着 code 回调到 /api/auth，交换 access token
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Decap-CMS',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      }),
    });

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      details: error.message,
    });
  }
}