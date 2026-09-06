'use strict';

/**
 * server/routes/store.js
 *
 * Per-user store profile endpoints.
 *   GET  /api/store        — return the authenticated user's store (or null)
 *   PUT  /api/store        — create or fully replace the authenticated user's store
 *
 * All routes are protected by requireAuth — the userId is taken from
 * req.user.id (set by the JWT middleware) and NEVER from the request body.
 */

const express         = require('express');
const router          = express.Router();
const Store           = require('../models/Store');
const { requireAuth } = require('../middleware/auth');
const { getDBStatus } = require('../db/connection');

// ── DB guard middleware ───────────────────────────────────────────────────

function requireDB(req, res, next) {
  if (!getDBStatus().connected) {
    return res.status(503).json({
      error: 'Database is not available. Please ensure MONGODB_URI is set in server/.env.'
    });
  }
  next();
}

// ── GET /api/store ────────────────────────────────────────────────────────

router.get('/', requireAuth, requireDB, async (req, res) => {
  try {
    const store = await Store.findOne({ userId: req.user.id });
    // Return null payload when no store exists yet — not an error
    return res.status(200).json({ store: store || null });
  } catch (err) {
    console.error('[store] GET error:', err.message);
    return res.status(500).json({ error: 'Could not retrieve store data.' });
  }
});

// ── PUT /api/store ────────────────────────────────────────────────────────

router.put('/', requireAuth, requireDB, async (req, res) => {
  const { storeName, businessType, storeSize, primaryGoal } = req.body;

  if (!storeName || !storeName.trim()) {
    return res.status(400).json({ error: 'Store name is required.' });
  }

  try {
    // findOneAndUpdate with upsert:true acts as create-or-replace
    const store = await Store.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId:       req.user.id,
        storeName:    storeName.trim(),
        businessType: businessType  || '',
        storeSize:    storeSize     || '',
        primaryGoal:  primaryGoal   || ''
      },
      { new: true, upsert: true, runValidators: true }
    );

    console.log(`[store] Saved store for user ${req.user.id}: ${store.storeName}`);
    return res.status(200).json({ store });

  } catch (err) {
    console.error('[store] PUT error:', err.message);
    return res.status(500).json({ error: 'Could not save store data.' });
  }
});

module.exports = router;
