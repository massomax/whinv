const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  productName: { 
    type: String, 
    required: true 
  },
  warehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse',
    required: true 
  },
  status: { 
    type: String, 
    default: 'Ожидает Заказа',
    enum: ['Ожидает Заказа', 'Заказано']
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  statusChangedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = orderSchema;