// api/auth.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 只处理GET请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Missing GitHub OAuth credentials' });
    }

    // 向GitHub请求access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        state,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    // 返回给前端Decap CMS
    return res.status(200).json(tokenData);
    
  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}