const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const warehouseController = require('../controllers/warehouseController');

router.post('/', authMiddleware(['Менеджер']), warehouseController.createWarehouse);
router.get(
  '/',
  authMiddleware(['Менеджер', 'Сотрудник']),
  warehouseController.getWarehouses
);
router.get(
  '/:id',
  warehouseController.getWarehouse
);

module.exports = router;