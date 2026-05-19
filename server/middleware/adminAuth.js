function adminAuth(req, res, next) {
  const configured = process.env.ADMIN_TOKEN;

  if (!configured) {
    return res.status(503).json({
      code: 503,
      message: '管理后台未配置 ADMIN_TOKEN',
      data: null
    });
  }

  const headerToken = req.headers['x-admin-token'];
  const bearer = req.headers.authorization;
  const token = headerToken || (bearer && bearer.startsWith('Bearer ') ? bearer.slice(7) : null);

  if (!token || token !== configured) {
    return res.status(401).json({
      code: 401,
      message: '管理密钥无效',
      data: null
    });
  }

  next();
}

module.exports = { adminAuth };
