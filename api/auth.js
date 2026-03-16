// api/auth.js - 完整版
export default async function handler(req, res) {
  const { code, state, scope, site_id, provider } = req.query;

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const oauthProvider = 'github';

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
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET environment variable' });
    }

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

    // Decap/Netlify CMS 外部 OAuth Provider 协议：回调页用 postMessage 把 token 发回 opener
    const accessToken = data?.access_token;
    if (!accessToken) {
      return res.status(500).json({
        error: 'Authentication failed',
        details: data?.error_description || data?.error || 'Missing access_token from GitHub',
      });
    }

    const allowedOriginsRaw = (process.env.OAUTH_ORIGINS || 'https://kaimaoxing.com').split(',');
    const allowedOrigins = allowedOriginsRaw.map((s) => s.trim()).filter(Boolean);
    const originPattern = allowedOrigins
      .map((o) => o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    const message = 'success';
    const content = JSON.stringify({ token: accessToken, provider: oauthProvider });

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Logging you in…</title>
  </head>
  <body>
    <p>Logging you in… You can close this window if it doesn’t close automatically.</p>
    <script>
      (function () {
        if (!window.opener) return;

        function receiveMessage(e) {
          var origin = e.origin === 'null' ? '' : e.origin;
          var re = new RegExp('^(' + ${JSON.stringify(originPattern || 'https://kaimaoxing\\\\.com')} + ')$');
          if (!origin || !re.test(origin)) return;

          window.removeEventListener('message', receiveMessage, false);

          var message = 'authorization:${oauthProvider}:${message}:' + ${JSON.stringify(content)};
          window.opener.postMessage(message, origin);
          window.close();
        }

        window.addEventListener('message', receiveMessage, false);
        window.opener.postMessage('authorizing:${oauthProvider}', '*');
      })();
    </script>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).json({
      error: 'Authentication failed',
      details: error.message,
    });
  }
}