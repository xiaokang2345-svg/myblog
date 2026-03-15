// api/auth.js
export default async function handler(req, res) {
  console.log('Auth function called with query:', req.query);
  
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  
  // 这里先简单返回，验证函数能正常运行
  return res.status(200).json({ 
    message: 'Auth function working',
    code: code,
    state: state,
    hasClientId: !!process.env.GITHUB_CLIENT_ID,
    hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET
  });
}