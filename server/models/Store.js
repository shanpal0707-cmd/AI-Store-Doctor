'use strict';

/**
 * server/models/Store.js
 *
 * Mongoose schema for the stores collection.
 * Each store document belongs to exactly one user (userId).
 * A user can have at most one store — enforced by the unique index on userId.
 */

const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,   // one store per user
      index:    true
    },

    storeName: {
      type:      String,
      required:  [true, 'Store name is required.'],
      trim:      true,
      maxlength: [120, 'Store name must be 120 characters or fewer.']
    },

    businessType: {
      type:    String,
      trim:    true,
      default: ''
    },

    storeSize: {
      type:    String,
      trim:    true,
      default: ''
    },

    primaryGoal: {
      type:    String,
      trim:    true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

storeSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Store', storeSchema);
