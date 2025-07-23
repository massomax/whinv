const { getLogModel } = require('./dynamicModels');

module.exports = {
  getLogs: async (req, res) => {
    try {
      const { warehouseId } = req.params;
      const LogModel = await getLogModel(warehouseId);
      
      const query = { 
        $or: [
          { warehouse: warehouseId },
          { productId: { $exists: true } }
        ]
      };

      if (req.user.role === 'Сотрудник') {
        query.user = req.user.id;
      }

      const logs = await LogModel.find(query)
        .populate('user', 'username role')
        .sort({ timestamp: -1 });

      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};