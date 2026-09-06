/**
 * server/db/connection.js
 *
 * MongoDB Atlas connection service using Mongoose.
 *
 * Usage:
 *   const { connectDB, getDBStatus } = require('./db/connection');
 *   await connectDB();              // call once at server startup
 *   const status = getDBStatus();   // call anywhere to check current state
 *
 * The MONGODB_URI is read ONLY from the environment variable.
 * It is NEVER hard-coded and NEVER exposed to Angular/frontend code.
 */

'use strict';

const mongoose = require('mongoose');

// ============================================================
// CONNECTION STATE
// ============================================================

/**
 * Human-readable connection states that mirror mongoose.connection.readyState:
 *   0 = disconnected
 *   1 = connected
 *   2 = connecting
 *   3 = disconnecting
 */
const STATE_LABELS = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

// ============================================================
// CONNECT
// ============================================================

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn(
      '[db] MONGODB_URI is not set. ' +
      'Add MONGODB_URI to server/.env to enable database connectivity. ' +
      'The backend will still run without a database (AI features remain available).'
    );
    return;
  }

  // Avoid opening duplicate connections during hot-reloads
  if (mongoose.connection.readyState === 1) {
    console.log('[db] MongoDB already connected.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      // Recommended options for MongoDB Atlas
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
      socketTimeoutMS:          45000
    });

    console.log('[db] ✓ Connected to MongoDB Atlas');
    console.log('[db]   Database:', mongoose.connection.db.databaseName);

  } catch (err) {
    console.error('[db] ✗ MongoDB connection failed:', err.message);
    // Do NOT crash the process — AI features work without the DB
    // Subsequent phases will return 503 for DB-dependent routes when disconnected
  }
}

// ============================================================
// STATUS HELPER
// ============================================================

/**
 * Returns a plain object describing the current connection state.
 * Used by the /api/db-health endpoint and future middleware.
 */
function getDBStatus() {
  const state = mongoose.connection.readyState;
  return {
    state:     STATE_LABELS[state] ?? 'unknown',
    connected: state === 1,
    database:  state === 1 ? (mongoose.connection.db?.databaseName ?? null) : null
  };
}

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

/**
 * Close the Mongoose connection when the Node process exits cleanly.
 * This prevents lingering Atlas connections during development restarts.
 */
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('[db] MongoDB connection closed (process exit).');
    }
    process.exit(0);
  });
});

module.exports = { connectDB, getDBStatus };
