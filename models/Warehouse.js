const mongoose = require('mongoose');
const slugify = require('slugify');

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  productCollection: {
    type: String,
    default: function() {
      return `products_${slugify(this.name, { lower: true, strict: true })}`;
    }
  },
  orderCollection: {
    type: String,
    default: function() {
      return `orders_${slugify(this.name, { lower: true, strict: true })}`;
    }
  },
  logCollection: {
    type: String,
    default: function() {
      return `logs_${slugify(this.name, { lower: true, strict: true })}`;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

warehouseSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    const slug = slugify(this.name, { lower: true, strict: true });
    this.productCollection = `products_${slug}`;
    this.orderCollection = `orders_${slug}`;
    this.logCollection = `logs_${slug}`;
  }
  next();
});

module.exports = mongoose.model('Warehouse', warehouseSchema);