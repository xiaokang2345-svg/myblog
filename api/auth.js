// api/auth.js - 官方推荐的完整实现
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // 只处理GET请求
  if (event.httpMethod !== 'GET') {
    return { 
      statusCode: 405, 
      body: 'Method Not Allowed' 
    };
  }

  try {
    const { code, state } = event.queryStringParameters;
    
    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing authorization code' }),
      };
    }

    // 验证state参数，防止CSRF攻击
    if (!state || state !== decodeURIComponent(event.queryStringParameters.state)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid state parameter' }),
      };
    }

    // 环境变量检查
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' }),
      };
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

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('GitHub token request failed:', errorText);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Failed to exchange code for token',
          details: errorText 
        }),
      };
    }

    const tokenData = await tokenResponse.json();

    // 返回结果给前端
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(tokenData),
    };

  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};