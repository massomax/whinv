const mongoose = require('mongoose');
const { Types } = mongoose;
const Warehouse = require('../models/Warehouse');
const productSchema = require('../models/Product');
const orderSchema = require('../models/Order');
const logSchema = require('../models/Logs');

const getCollectionName = (baseName, warehouseName) => {
  return `${baseName}_${warehouseName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30)}`;
};

const createDynamicModel = (modelName, schema) => {
  return mongoose.models[modelName] || mongoose.model(modelName, schema);
};

const getWarehouse = async (warehouseId) => {
  if (!Types.ObjectId.isValid(warehouseId)) {
    throw new Error(`Неверный формат ID склада: ${warehouseId}`);
  }

  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) throw new Error(`Склад с ID ${warehouseId} не найден`);

  return warehouse;
};

module.exports = {
  getProductModel: async (warehouseId) => {
    const warehouse = await getWarehouse(warehouseId);

    if (!warehouse.productCollection) {
      warehouse.productCollection = getCollectionName('products', warehouse.name);
      await warehouse.save();
    }

    return createDynamicModel(warehouse.productCollection, productSchema);
  },

  getOrderModel: async (warehouseId) => {
    const warehouse = await getWarehouse(warehouseId);

    if (!warehouse.orderCollection) {
      warehouse.orderCollection = getCollectionName('orders', warehouse.name);
      await warehouse.save();
    }

    return createDynamicModel(warehouse.orderCollection, orderSchema);
  },

  getLogModel: async (warehouseId) => {
    const warehouse = await getWarehouse(warehouseId);

    if (!warehouse.logCollection) {
      warehouse.logCollection = getCollectionName('logs', warehouse.name);
      await warehouse.save();
    }

    return createDynamicModel(warehouse.logCollection, logSchema);
  }
};
