const Warehouse = require('../models/Warehouse');
const mongoose = require('mongoose');

module.exports = {
  createWarehouse: async (req, res) => {
    try {
      const { name, address, category } = req.body;

      const existingWarehouse = await Warehouse.findOne({ name });
      if (existingWarehouse) {
        return res.status(400).json({ error: 'Склад с таким названием уже существует' });
      }

      const warehouse = new Warehouse({ name, address, category });
      await warehouse.save();

      res.status(201).json(warehouse);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getWarehouses: async (req, res) => {
    try {
      const warehouses = await Warehouse.find()
        .select('-__v -orderCollection -productCollection -logCollection')
        .lean();

      res.json(warehouses);
    } catch (err) {
      res.status(500).json({ 
        error: 'Ошибка при получении списка складов: ' + err.message 
      });
    }
  },
  getWarehouse: async (req, res) => {
    try {
      const warehouseId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
        return res.status(400).json({ error: 'Неверный формат ID склада' });
      }

      const warehouse = await Warehouse.findById(warehouseId);

      if (!warehouse) {
        return res.status(404).json({ error: 'Склад не найден' });
      }

      res.json({
        _id: warehouse._id,
        name: warehouse.name,
        address: warehouse.address,
        category: warehouse.category
      });

    } catch (err) {
      res.status(500).json({ error: err.message || 'Ошибка при получении данных склада' });
    }
  }
};