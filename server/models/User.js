'use strict';

/**
 * server/models/User.js
 *
 * Mongoose schema for the users collection.
 *
 * SECURITY:
 *  - passwordHash is NEVER returned in API responses (select: false).
 *  - email is stored in lowercase and must be unique.
 *  - Plaintext passwords are NEVER stored here — hashing is done in routes/auth.js.
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type:     String,
      required: [true, 'Full name is required.'],
      trim:     true,
      maxlength: [100, 'Full name must be 100 characters or fewer.']
    },

    email: {
      type:      String,
      required:  [true, 'Email address is required.'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address.'
      ]
    },

    // NEVER stored as plaintext — only the bcrypt hash is persisted.
    // select:false means passwordHash is excluded from all queries by default.
    passwordHash: {
      type:     String,
      required: true,
      select:   false
    }
  },
  {
    // Automatically add createdAt and updatedAt timestamps.
    timestamps: true
  }
);

// Remove passwordHash from any JSON serialisation (extra safety net).
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
