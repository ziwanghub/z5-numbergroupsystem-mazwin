// path: z5-numbergroupsystem-mazwin-v1/z5-nbg-zw-v1.0/backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('FATAL: JWT_SECRET missing');
    process.exit(1);
  }

  try {
    const payload = jwt.verify(token, secret);

    req.user = {
      id: payload.id,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_UNAUTHORIZED',
      message: 'Invalid or expired token',
    });
  }
};