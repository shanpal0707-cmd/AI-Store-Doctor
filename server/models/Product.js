'use strict';

/**
 * server/models/Product.js
 *
 * Mongoose schema for the products collection.
 * Every product belongs to one user — enforced by userId index.
 * Products from different users are NEVER mixed.
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true
    },

    productName: {
      type:      String,
      required:  [true, 'Product name is required.'],
      trim:      true,
      maxlength: [200, 'Product name must be 200 characters or fewer.']
    },

    category: {
      type:    String,
      trim:    true,
      default: ''
    },

    costPrice: {
      type:    Number,
      default: 0,
      min:     [0, 'Cost price cannot be negative.']
    },

    sellingPrice: {
      type:    Number,
      default: 0,
      min:     [0, 'Selling price cannot be negative.']
    },

    stockQuantity: {
      type:    Number,
      default: 0,
      min:     [0, 'Stock quantity cannot be negative.']
    },

    unitsSold: {
      type:    Number,
      default: 0,
      min:     [0, 'Units sold cannot be negative.']
    },

    salesPeriod: {
      type:    String,
      default: 'Last 30 Days'
    }
  },
  {
    timestamps: true
  }
);

productSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);
