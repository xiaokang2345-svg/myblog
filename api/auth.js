// ========================================
// GitHub OAuth 代理（避免暴露 CLIENT_SECRET）
// 路径：api/auth.js
// ========================================
export default async (req, res) => {
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, URL } = process.env;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Missing code' });
    }

    // 向 GitHub 交换 access_token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: Ov23liwy95JBV2tp5tVY,
        client_secret: f8e7a2185107236606de56d79b0d499022dd0102,
        code
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('GitHub OAuth error:', data);
      return res.status(400).json({ error: data.error_description || 'Authentication failed' });
    }

    // 返回 token 给 Decap CMS
    res.status(200).json({
      access_token: data.access_token,
      token_type: data.token_type,
      scope: data.scope
    });
  } catch (error) {
    console.error('Auth proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
