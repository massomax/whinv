const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');


router.get('/', authMiddleware(['Менеджер']), orderController.getAllOrders);
router.patch('/:warehouseId/:orderId/status', authMiddleware(['Менеджер']), orderController.updateOrderStatus);
router.delete('/:warehouseId/:orderId', authMiddleware(['Менеджер']), orderController.deleteOrder);

module.exports = router;