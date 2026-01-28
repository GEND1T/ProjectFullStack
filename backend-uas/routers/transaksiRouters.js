const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');

router.post('/checkout', transaksiController.createTransaction);


router.get('/pending', transaksiController.getPendingOrders); 
router.get('/history', transaksiController.getHistoryTransactions); 
router.put('/:id/status', transaksiController.updateOrderStatus); 
// router.get('/stats/advanced', transaksiController.getAdvancedStats);
router.get('/stats/dashboard', transaksiController.getDashboardStats);
router.get('/:id', transaksiController.getTransactionDetail);
router.get('/customers/:id/history', transaksiController.getCustomerHistoryById);
module.exports = router;