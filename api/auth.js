// api/auth.js
export default async (req, res) => {
  // ✅ 支持 GET 和 POST
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 🔑 提取 code 参数
  let code;
  if (req.method === 'POST') {
    try {
      const body = JSON.parse(req.body);
      code = body.code;
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  } else {
    // GET: 从 URL query 提取
    const { query } = req;
    code = query.code;
  }

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  // 🔐 获取环境变量
  const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    console.error('❌ 环境变量未配置！');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    // 📤 向 GitHub 换取 access_token
    const githubRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      })
    });

    const tokenData = await githubRes.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth 错误:', tokenData);
      return res.status(400).json({ 
        error: tokenData.error_description || 'GitHub authentication failed' 
      });
    }

    // ✅ 返回标准格式（Decap CMS 期望）
    return res.status(200).json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      scope: tokenData.scope
    });

  } catch (err) {
    console.error('❌ 服务器错误:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};