/**
 * JWT认证中间件
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tmj_mes_secret_2026_key';

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, msg: '未登录或token已过期' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, msg: 'token无效' });
  }
};

module.exports = { authMiddleware, JWT_SECRET };
