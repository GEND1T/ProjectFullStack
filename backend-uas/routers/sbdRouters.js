const express = require('express');
const router = express.Router();
const sbdController = require('../controllers/sbdController');


router.get("/orders/best-product/last-year",sbdController.getBestSellingProductLastYear);
router.get("/orders/top-customers/last-year",sbdController.getTopCustomersLastYear);
router.get("/orders/top-order-value/last-year",sbdController.getTopOrderValueLastYear);
router.get("/orders/top-item-buyers/last-year",sbdController.getTopItemBuyersLastYear);
router.get("/orders/top-10-products/last-year",sbdController.getTop10BestSellingProductsLastYear);
router.get("/profit-bulanan-produk",sbdController.getMonthlyProfitByProduct);
router.get("/penjualan-bulanan-produk",sbdController.getMonthlySalesByProduct);
router.get("/order-bulanan-customer",sbdController.getMonthlyOrdersByCustomer);
router.get("/nominal-order-customer",sbdController.getNominalOrderCustomerLastYear);
router.get("/layanan-bulanan-kasir",sbdController.getMonthlyServiceLstYear);

module.exports = router;
