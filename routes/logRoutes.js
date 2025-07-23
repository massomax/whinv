const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const logController = require('../controllers/logController');

router.get('/:warehouseId', 
  authMiddleware(['Менеджер', 'Сотрудник']), 
  logController.getLogs
);

module.exports = router;