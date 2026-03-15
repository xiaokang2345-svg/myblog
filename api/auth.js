// api/auth.js - 测试用极简版本
exports.handler = async (event) => {
  console.log('API Auth function called'); // 这行日志会在Vercel控制台看到
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'OK' }),
  };
};