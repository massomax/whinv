const { getOrderModel } = require('./dynamicModels');
const Warehouse = require('../models/Warehouse');

module.exports = {
  getAllOrders: async (req, res) => {
    try {
      const { warehouseId, status } = req.query; 

      let query = {};
      if (warehouseId) {
        query.warehouse = warehouseId; 
      }
      if (status) {
        query.status = status; 
      }

      if (warehouseId) {
        const OrderModel = await getOrderModel(warehouseId);
        const orders = await OrderModel.find(query).populate('warehouse', 'name address');
        return res.json(orders);
      }

      const warehouses = await Warehouse.find();
      let allOrders = [];

      for (const warehouse of warehouses) {
        const OrderModel = await getOrderModel(warehouse._id);
        const orders = await OrderModel.find(query).populate('warehouse', 'name address');
        allOrders = allOrders.concat(orders);
      }

      res.json(allOrders);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  updateOrderStatus: async (req, res) => {
    try {
      const { warehouseId, orderId } = req.params;
      const { newStatus } = req.body;
      
      const OrderModel = await getOrderModel(warehouseId);
      const order = await OrderModel.findByIdAndUpdate(
        orderId,
        { 
          status: newStatus,
          statusChangedAt: Date.now()
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      res.json(order);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteOrder: async (req, res) => {
    try {
      const { warehouseId, orderId } = req.params;
      const OrderModel = await getOrderModel(warehouseId);
      const order = await OrderModel.findByIdAndDelete(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Заказ не найден' });
      }

      res.json({ message: 'Заказ удален' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};