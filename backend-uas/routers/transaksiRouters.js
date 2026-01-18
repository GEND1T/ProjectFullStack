const express = require('express');
const router = express.Router();
const transaksiController = require('../controllers/transaksiController');

router.post('/checkout', transaksiController.createTransaction);

// Route Baru
router.get('/pending', transaksiController.getPendingOrders); // Ambil yang belum diproses
router.get('/history', transaksiController.getHistoryTransactions); // Ambil yang sudah selesai
router.put('/:id/status', transaksiController.updateOrderStatus); // Update Status

router.get('/stats/dashboard', transaksiController.getDashboardStats);
router.get('/:id', transaksiController.getTransactionDetail);

module.exports = router;