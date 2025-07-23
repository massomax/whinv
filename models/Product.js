const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  photo: { 
    url: { type: String, default: '' },
    deleteHash: { type: String, default: '' }
  },
  criticalValue: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  category: { // Новое поле
    type: String,
    required: true,
    default: 'Общая'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = productSchema;