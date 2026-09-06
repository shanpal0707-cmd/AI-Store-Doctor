'use strict';

/**
 * server/routes/products.js
 *
 * Per-user product CRUD endpoints.
 *   GET    /api/products        — list all products for the authenticated user
 *   POST   /api/products        — add a new product for the authenticated user
 *   DELETE /api/products/:id    — delete one product (must belong to user)
 *
 * The userId is taken from req.user.id (JWT middleware) — NEVER from
 * the request body. Users can only ever see and modify their own products.
 */

const express         = require('express');
const router          = express.Router();
const Product         = require('../models/Product');
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

// ── GET /api/products ─────────────────────────────────────────────────────

router.get('/', requireAuth, requireDB, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.id }).sort({ createdAt: 1 });
    return res.status(200).json({ products });
  } catch (err) {
    console.error('[products] GET error:', err.message);
    return res.status(500).json({ error: 'Could not retrieve products.' });
  }
});

// ── POST /api/products ────────────────────────────────────────────────────

router.post('/', requireAuth, requireDB, async (req, res) => {
  const {
    productName, category,
    costPrice, sellingPrice,
    stockQuantity, unitsSold, salesPeriod
  } = req.body;

  // ── Field validation ─────────────────────────────────────
  if (!productName || !productName.trim()) {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  if (costPrice    === undefined || costPrice    === null) {
    return res.status(400).json({ error: 'Cost price is required.' });
  }
  if (sellingPrice === undefined || sellingPrice === null) {
    return res.status(400).json({ error: 'Selling price is required.' });
  }
  if (stockQuantity === undefined || stockQuantity === null) {
    return res.status(400).json({ error: 'Stock quantity is required.' });
  }
  if (unitsSold === undefined || unitsSold === null) {
    return res.status(400).json({ error: 'Units sold is required.' });
  }

  try {
    const product = await Product.create({
      userId:        req.user.id,
      productName:   productName.trim(),
      category:      category      || '',
      costPrice:     Number(costPrice),
      sellingPrice:  Number(sellingPrice),
      stockQuantity: Number(stockQuantity),
      unitsSold:     Number(unitsSold),
      salesPeriod:   salesPeriod   || 'Last 30 Days'
    });

    console.log(`[products] Added product "${product.productName}" for user ${req.user.id}`);
    return res.status(201).json({ product });

  } catch (err) {
    console.error('[products] POST error:', err.message);
    return res.status(500).json({ error: 'Could not save product.' });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────

router.delete('/:id', requireAuth, requireDB, async (req, res) => {
  try {
    // Find by _id AND userId — prevents any user deleting another user's product
    const deleted = await Product.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    console.log(`[products] Deleted product "${deleted.productName}" for user ${req.user.id}`);
    return res.status(200).json({ message: 'Product deleted successfully.' });

  } catch (err) {
    console.error('[products] DELETE error:', err.message);
    return res.status(500).json({ error: 'Could not delete product.' });
  }
});

module.exports = router;
