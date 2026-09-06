'use strict';

/**
 * server/middleware/auth.js
 *
 * Express middleware that verifies the JWT stored in the
 * HttpOnly cookie named "asd_token".
 *
 * On success, attaches the decoded payload to req.user:
 *   req.user = { id, fullName, email }
 *
 * On failure, returns 401 Unauthorized — it does NOT redirect.
 */

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.asd_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[auth] JWT_SECRET is not set in environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const payload = jwt.verify(token, secret);
    // Attach safe user info to the request for downstream handlers
    req.user = {
      id:       payload.id,
      fullName: payload.fullName,
      email:    payload.email
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

module.exports = { requireAuth };
