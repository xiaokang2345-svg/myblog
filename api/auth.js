const https = require('https');

exports.handler = async (event) => {
  const { queryStringParameters } = event;
  const { code, state } = queryStringParameters;

  // 这里会与GitHub交换code获取token
  // 详细代码建议参考官方示例或模板，因为它涉及安全处理。
  // 一个常见的简单版本如下：
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      state,
    }),
  }).then(r => r.json());

  // 将token返回给前端CMS
  return {
    statusCode: 200,
    body: JSON.stringify(tokenResponse),
  };
};