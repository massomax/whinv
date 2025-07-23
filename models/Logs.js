const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  warehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse',
    required: true 
  },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  action: { 
    type: String, 
    required: true,
    enum: ['set', 'add', 'sub'] 
  },
  oldQuantity: { 
    type: Number, 
    required: true 
  },
  newQuantity: { 
    type: Number, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

logSchema.index({ productId: 1, timestamp: -1 });

module.exports = logSchema;
