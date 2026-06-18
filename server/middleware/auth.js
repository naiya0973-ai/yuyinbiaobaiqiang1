const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required');
  process.exit(1);
}

function sendError(res, status, message) {
  return res.status(status).json({
    code: status,
    message
  });
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function getProfileById(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, phone, nickname, avatar_url, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return sendError(res, 401, '请先登录');
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const user = await getProfileById(userId);

    if (!user) {
      return sendError(res, 401, '用户不存在');
    }

    req.userId = user.id;
    req.user = user;

    return next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 401, '无效的登录凭证');
    }

    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, '登录已过期，请重新登录');
    }

    console.error('Auth middleware error:', err);
    return sendError(res, 500, '服务器内部错误');
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    const userId = decoded.userId;
    const user = await getProfileById(userId);

    if (user) {
      req.userId = user.id;
      req.user = user;
    }

    return next();
  } catch {
    return next();
  }
}

module.exports = {
  JWT_SECRET,
  generateToken,
  getBearerToken,
  verifyToken,
  getProfileById,
  authenticate,
  optionalAuth,
  sendError
};
