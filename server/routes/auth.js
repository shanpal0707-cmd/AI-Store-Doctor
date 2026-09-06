'use strict';

/**
 * server/routes/auth.js
 *
 * Authentication endpoints:
 *   POST /api/auth/signup  — create a new user account
 *   POST /api/auth/login   — verify credentials and issue JWT cookie
 *   POST /api/auth/logout  — clear the JWT cookie
 *   GET  /api/auth/me      — return the authenticated user's profile (requires cookie)
 *
 * SECURITY:
 *  - Passwords are hashed with bcryptjs (cost factor 12) before storage.
 *  - Plaintext passwords are NEVER stored or logged.
 *  - The JWT is stored in an HttpOnly, SameSite=Lax cookie — never in localStorage.
 *  - passwordHash is never included in any response.
 */

const express    = require('express');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const router     = express.Router();
const User       = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { getDBStatus } = require('../db/connection');

// ── Helpers ────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;
// Token valid for 7 days
const JWT_EXPIRY = '7d';
// Cookie max-age: 7 days in milliseconds
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Issue a signed JWT and attach it as an HttpOnly cookie.
 * The cookie is SameSite=Lax which works for same-origin requests
 * and protects against CSRF for cross-origin POSTs.
 */
function issueTokenCookie(res, user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured. Add JWT_SECRET to server/.env');
  }

  const token = jwt.sign(
    { id: user._id.toString(), fullName: user.fullName, email: user.email },
    secret,
    { expiresIn: JWT_EXPIRY }
  );

  res.cookie('asd_token', token, {
    httpOnly: true,          // not accessible via JS — prevents XSS token theft
    sameSite: 'lax',         // CSRF protection for cross-origin form submissions
    secure:   process.env.NODE_ENV === 'production', // HTTPS-only in production
    maxAge:   COOKIE_MAX_AGE_MS
  });
}

/** Guard: return 503 if MongoDB is not connected. */
function requireDB(req, res, next) {
  if (!getDBStatus().connected) {
    return res.status(503).json({
      error: 'Database is not available. Please ensure MONGODB_URI is set in server/.env and the server is restarted.'
    });
  }
  next();
}

// ── POST /api/auth/signup ──────────────────────────────────────────────────

router.post('/signup', requireDB, async (req, res) => {
  const { fullName, email, password } = req.body;

  // ── Field validation ────────────────────────────────────────
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // ── Duplicate email check ───────────────────────────────
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists. Please log in.'
      });
    }

    // ── Hash password ───────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // ── Create user ─────────────────────────────────────────
    const user = await User.create({
      fullName: fullName.trim(),
      email:    email.trim().toLowerCase(),
      passwordHash
    });

    // ── Issue session cookie ────────────────────────────────
    issueTokenCookie(res, user);

    console.log(`[auth] New user registered: ${user.email}`);

    return res.status(201).json({
      message:  'Account created successfully.',
      user: {
        id:        user._id.toString(),
        fullName:  user.fullName,
        email:     user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('[auth] signup error:', err.message);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────

router.post('/login', requireDB, async (req, res) => {
  const { email, password } = req.body;

  // ── Field validation ────────────────────────────────────────
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  try {
    // ── Find user — explicitly select passwordHash (excluded by default) ──
    const user = await User.findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash');

    // Use a constant-time message to prevent user enumeration
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
    }

    // ── Verify password ─────────────────────────────────────
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
    }

    // ── Issue session cookie ────────────────────────────────
    issueTokenCookie(res, user);

    console.log(`[auth] User logged in: ${user.email}`);

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id:       user._id.toString(),
        fullName: user.fullName,
        email:    user.email
      }
    });

  } catch (err) {
    console.error('[auth] login error:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────

router.post('/logout', (req, res) => {
  res.clearCookie('asd_token', { httpOnly: true, sameSite: 'lax' });
  return res.status(200).json({ message: 'Logged out successfully.' });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────

router.get('/me', requireAuth, requireDB, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.clearCookie('asd_token', { httpOnly: true, sameSite: 'lax' });
      return res.status(401).json({ error: 'User not found. Please log in again.' });
    }

    return res.status(200).json({
      user: {
        id:        user._id.toString(),
        fullName:  user.fullName,
        email:     user.email,
        createdAt: user.createdAt
      }
    });

  } catch (err) {
    console.error('[auth] /me error:', err.message);
    return res.status(500).json({ error: 'Could not retrieve user profile.' });
  }
});

module.exports = router;
