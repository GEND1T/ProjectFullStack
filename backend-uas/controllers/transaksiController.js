const db = require('../config/database');


exports.getAllTransactions = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.ORDER_ID as id,
                o.RECEIPT_NUMBER as invoice,
                o.ORDER_DATE as date,
                o.TOTAL_AMOUNT as total,
                c.CUST_NAME as customer_name,
                k.USERNAME as cashier_name
            FROM orders o
            LEFT JOIN customers c ON o.CUST_ID = c.CUST_ID
            JOIN cashiers k ON o.USER_ID = k.USER_ID
            ORDER BY o.ORDER_DATE DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.createTransaction = async (req, res) => {
    const { user_id, cust_id, method_id, total_amount, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Keranjang belanja kosong!' });
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const invoiceNo = `INV/${Date.now()}`;
        const finalCustId = cust_id === "" ? null : cust_id;

        const [orderResult] = await connection.query(
            `INSERT INTO orders (RECEIPT_NUMBER, ORDER_DATE, TOTAL, CUST_ID, USER_ID, METHOD_ID, ORDER_STATUS) VALUES (?, NOW(), ?, ?, ?, ?, 'PENDING')`,
            [invoiceNo, total_amount, finalCustId, user_id, method_id]
        );
        
        const newOrderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                `INSERT INTO order_details (ORDER_ID, PRODUCT_ID, QTY, PRICE_AT_PURCHASE, SUBTOTAL) VALUES (?, ?, ?, ?, ?)`,
                [newOrderId, item.product_id, item.qty, item.price, item.subtotal]
            );

            await connection.query(
                `UPDATE products SET STOCK = STOCK - ? WHERE PRODUCT_ID = ?`,
                [item.qty, item.product_id]
            );
        }

        await connection.commit();
        res.status(201).json({ 
            message: 'Transaksi Berhasil', 
            order_id: newOrderId,
            invoice: invoiceNo 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Transaction Error:", error);
        res.status(500).json({ message: 'Transaksi Gagal', error });
    } finally {
        connection.release();
    }
};

exports.getPendingOrders = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.ORDER_ID as id, 
                o.RECEIPT_NUMBER as invoice,  -- PERBAIKAN: Gunakan RECEIPT_NUMBER
                o.ORDER_DATE as date, 
                o.TOTAL as total, 
                o.ORDER_STATUS as status,
                c.CUST_NAME as customer_name,
                pm.METHOD as method
            FROM orders o
            LEFT JOIN customers c ON o.CUST_ID = c.CUST_ID
            JOIN payment_methods pm ON o.METHOD_ID = pm.METHOD_ID
            WHERE o.ORDER_STATUS = 'PENDING'
            ORDER BY o.ORDER_DATE ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.getHistoryTransactions = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.ORDER_ID as id, 
                o.RECEIPT_NUMBER as invoice,
                o.ORDER_DATE as date, 
                o.TOTAL as total, 
                o.ORDER_STATUS as status,
                c.CUST_NAME as customer_name,
                pm.METHOD as method
            FROM orders o
            LEFT JOIN customers c ON o.CUST_ID = c.CUST_ID
            JOIN payment_methods pm ON o.METHOD_ID = pm.METHOD_ID
            WHERE o.ORDER_STATUS IN ('COMPLETED', 'CANCELLED')
            ORDER BY o.ORDER_DATE DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.getTransactionDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [header] = await db.query(`
            SELECT 
                o.ORDER_ID, 
                o.RECEIPT_NUMBER as INVOICE_NO,
                o.ORDER_DATE, 
                o.TOTAL as TOTAL_AMOUNT, 
                o.ORDER_STATUS, 
                o.USER_ID,
                c.CUST_NAME, 
                c.ADDRESS as CUST_ADDRESS,
                pm.METHOD,
                u.USERNAME as CASHIER_NAME
            FROM orders o
            LEFT JOIN customers c ON o.CUST_ID = c.CUST_ID
            LEFT JOIN cashiers u ON o.USER_ID = u.USER_ID
            JOIN payment_methods pm ON o.METHOD_ID = pm.METHOD_ID
            WHERE o.ORDER_ID = ?
        `, [id]);

        if (header.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        const [items] = await db.query(`
            SELECT 
                od.QTY, 
                od.PRICE_AT_PURCHASE, 
                od.SUBTOTAL,
                p.PRODUCT_NAME
            FROM order_details od
            JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
            WHERE od.ORDER_ID = ?
        `, [id]);

        res.json({
            header: header[0],
            items: items
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, user_id } = req.body;

    if (!['COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ message: "Status tidak valid" });
    }

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            if (status === 'CANCELLED') {
                const [items] = await connection.query('SELECT PRODUCT_ID, QTY FROM order_details WHERE ORDER_ID = ?', [id]);
                for (const item of items) {
                    await connection.query('UPDATE products SET STOCK = STOCK + ? WHERE PRODUCT_ID = ?', [item.QTY, item.PRODUCT_ID]);
                }
            }

            if (user_id) {
                await connection.query('UPDATE orders SET ORDER_STATUS = ?, USER_ID = ? WHERE ORDER_ID = ?', [status, user_id, id]);
            } else {
                await connection.query('UPDATE orders SET ORDER_STATUS = ? WHERE ORDER_ID = ?', [status, id]);
            }

            await connection.commit();
            res.json({ message: `Order berhasil diubah menjadi ${status}` });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal update status', error });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const connection = await db.getConnection();
        const yearFilter = "1=1"; 

       
        const [generalStats] = await connection.query(`
            SELECT 
                (SELECT SUM(TOTAL) FROM orders WHERE ORDER_STATUS = 'COMPLETED') as revenue,
                (SELECT COUNT(*) FROM orders) as transactions,
                (SELECT COUNT(*) FROM products) as products,
                (SELECT COUNT(*) FROM customers) as customers
        `);

        const [champions] = await connection.query(`
            SELECT 
                (SELECT p.PRODUCT_NAME FROM order_details od JOIN orders o ON od.ORDER_ID=o.ORDER_ID JOIN products p ON od.PRODUCT_ID=p.PRODUCT_ID WHERE ${yearFilter} GROUP BY p.PRODUCT_ID ORDER BY SUM(od.QTY) DESC LIMIT 1) AS top_product_name,
                (SELECT SUM(od.QTY) FROM order_details od JOIN orders o ON od.ORDER_ID=o.ORDER_ID WHERE ${yearFilter} GROUP BY od.PRODUCT_ID ORDER BY SUM(od.QTY) DESC LIMIT 1) AS top_product_val,
                
                (SELECT c.CUST_NAME FROM orders o JOIN customers c ON o.CUST_ID=c.CUST_ID WHERE ${yearFilter} GROUP BY c.CUST_ID ORDER BY COUNT(o.ORDER_ID) DESC LIMIT 1) AS top_cust_freq_name,
                (SELECT COUNT(o.ORDER_ID) FROM orders o JOIN customers c ON o.CUST_ID=c.CUST_ID WHERE ${yearFilter} GROUP BY c.CUST_ID ORDER BY COUNT(o.ORDER_ID) DESC LIMIT 1) AS top_cust_freq_val,

                (SELECT c.CUST_NAME FROM orders o JOIN customers c ON o.CUST_ID=c.CUST_ID WHERE ${yearFilter} GROUP BY c.CUST_ID ORDER BY SUM(o.TOTAL) DESC LIMIT 1) AS top_cust_rev_name,
                (SELECT SUM(o.TOTAL) FROM orders o JOIN customers c ON o.CUST_ID=c.CUST_ID WHERE ${yearFilter} GROUP BY c.CUST_ID ORDER BY SUM(o.TOTAL) DESC LIMIT 1) AS top_cust_rev_val
        `);

        const [topProducts] = await connection.query(`
            SELECT p.PRODUCT_NAME as name, SUM(od.QTY) as sold
            FROM order_details od JOIN orders o ON od.ORDER_ID = o.ORDER_ID JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
            WHERE ${yearFilter} GROUP BY p.PRODUCT_ID ORDER BY sold DESC LIMIT 5
        `);

        const [monthlyProductSales] = await connection.query(`SELECT MONTH(o.ORDER_DATE) as month, SUM(od.SUBTOTAL) as revenue FROM order_details od JOIN orders o ON od.ORDER_ID = o.ORDER_ID WHERE ${yearFilter} GROUP BY month ORDER BY month`);
        const [monthlyCustomerStats] = await connection.query(`SELECT MONTH(o.ORDER_DATE) as month, COUNT(o.ORDER_ID) as count FROM orders o WHERE ${yearFilter} GROUP BY month ORDER BY month`);

        const [paymentMethods] = await connection.query(`
            SELECT pm.METHOD as method, COUNT(o.ORDER_ID) as count
            FROM orders o JOIN payment_methods pm ON o.METHOD_ID = pm.METHOD_ID
            GROUP BY pm.METHOD_ID
        `);

        const [lowStock] = await connection.query(`
            SELECT PRODUCT_NAME as name, STOCK as stock, IMAGE as image
            FROM products WHERE STOCK <= 10 ORDER BY STOCK ASC LIMIT 5
        `);

        const [recentOrders] = await connection.query(`
            SELECT o.RECEIPT_NUMBER as invoice, c.CUST_NAME as customer, o.TOTAL as total, o.ORDER_STATUS as status, o.ORDER_DATE as date
            FROM orders o LEFT JOIN customers c ON o.CUST_ID = c.CUST_ID
            ORDER BY o.ORDER_DATE DESC LIMIT 5
        `);

        connection.release();

        res.json({
            summary: generalStats[0],
            champions: champions[0] || {},
            topProducts: topProducts,
            lowStock: lowStock,          
            recentOrders: recentOrders,  
            paymentStats: paymentMethods,
            charts: {
                productSales: monthlyProductSales,
                customerStats: monthlyCustomerStats
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error });
    }
};


// exports.getAdvancedStats = async (req, res) => {
//     try {
//         const connection = await db.getConnection();
        
//         // Filter Tahun Sebelumnya (Contoh: Jika sekarang 2026, ambil 2025)
//         // Jika ingin test data tahun ini, ubah "- 1" menjadi "- 0"
//         const prevYearCondition = "YEAR(o.ORDER_DATE) = YEAR(CURDATE()) - 1";

//         const [champions] = await connection.query(`
//             SELECT 
//                 -- 1. Produk Paling Banyak Dibeli (Qty)
//                 (SELECT CONCAT(p.PRODUCT_NAME, ' (', SUM(od.QTY), ' item)')
//                  FROM order_details od 
//                  JOIN orders o ON od.ORDER_ID = o.ORDER_ID
//                  JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
//                  WHERE ${prevYearCondition}
//                  GROUP BY p.PRODUCT_ID 
//                  ORDER BY SUM(od.QTY) DESC LIMIT 1) AS top_product_qty,

//                 -- 2. Customer Paling Sering Order (Frekuensi)
//                 (SELECT CONCAT(c.CUST_NAME, ' (', COUNT(o.ORDER_ID), ' order)')
//                  FROM orders o
//                  JOIN customers c ON o.CUST_ID = c.CUST_ID
//                  WHERE ${prevYearCondition}
//                  GROUP BY c.CUST_ID
//                  ORDER BY COUNT(o.ORDER_ID) DESC LIMIT 1) AS top_cust_freq,

//                 -- 3. Customer Nilai Order Terbesar (Nominal)
//                 (SELECT CONCAT(c.CUST_NAME, ' (Rp ', FORMAT(SUM(o.TOTAL), 0), ')')
//                  FROM orders o
//                  JOIN customers c ON o.CUST_ID = c.CUST_ID
//                  WHERE ${prevYearCondition}
//                  GROUP BY c.CUST_ID
//                  ORDER BY SUM(o.TOTAL) DESC LIMIT 1) AS top_cust_val,

//                 -- 4. Customer Item Terbanyak (Jumlah Produk)
//                 (SELECT CONCAT(c.CUST_NAME, ' (', SUM(od.QTY), ' item)')
//                  FROM order_details od
//                  JOIN orders o ON od.ORDER_ID = o.ORDER_ID
//                  JOIN customers c ON o.CUST_ID = c.CUST_ID
//                  WHERE ${prevYearCondition}
//                  GROUP BY c.CUST_ID
//                  ORDER BY SUM(od.QTY) DESC LIMIT 1) AS top_cust_items
//         `);

//         const [top10Products] = await connection.query(`
//             SELECT p.PRODUCT_NAME, SUM(od.QTY) as total_qty
//             FROM order_details od 
//             JOIN orders o ON od.ORDER_ID = o.ORDER_ID
//             JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
//             WHERE ${prevYearCondition}
//             GROUP BY p.PRODUCT_ID 
//             ORDER BY total_qty DESC LIMIT 10
//         `);

//         const [monthlyProductProfit] = await connection.query(`
//             SELECT p.PRODUCT_NAME, MONTH(o.ORDER_DATE) as bulan, SUM(od.SUBTOTAL) as total_profit
//             FROM order_details od 
//             JOIN orders o ON od.ORDER_ID = o.ORDER_ID
//             JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
//             WHERE ${prevYearCondition}
//             GROUP BY p.PRODUCT_ID, bulan
//             ORDER BY bulan ASC, total_profit DESC 
//         `);

//         const [monthlyProductQty] = await connection.query(`
//             SELECT p.PRODUCT_NAME, MONTH(o.ORDER_DATE) as bulan, SUM(od.QTY) as total_qty
//             FROM order_details od 
//             JOIN orders o ON od.ORDER_ID = o.ORDER_ID
//             JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
//             WHERE ${prevYearCondition}
//             GROUP BY p.PRODUCT_ID, bulan
//             ORDER BY bulan ASC, total_qty DESC 
//         `);

//         const [monthlyCustOrder] = await connection.query(`
//             SELECT c.CUST_NAME, MONTH(o.ORDER_DATE) as bulan, COUNT(o.ORDER_ID) as total_trx
//             FROM orders o 
//             JOIN customers c ON o.CUST_ID = c.CUST_ID
//             WHERE ${prevYearCondition}
//             GROUP BY c.CUST_ID, bulan
//             ORDER BY bulan ASC, total_trx DESC 
//         `);

//         const [monthlyCustValue] = await connection.query(`
//             SELECT c.CUST_NAME, MONTH(o.ORDER_DATE) as bulan, SUM(o.TOTAL) as total_nominal
//             FROM orders o 
//             JOIN customers c ON o.CUST_ID = c.CUST_ID
//             WHERE ${prevYearCondition}
//             GROUP BY c.CUST_ID, bulan
//             ORDER BY bulan ASC, total_nominal DESC 
//         `);

//         const [monthlyCashierService] = await connection.query(`
//             SELECT k.USERNAME, MONTH(o.ORDER_DATE) as bulan, COUNT(o.ORDER_ID) as total_service
//             FROM orders o 
//             JOIN cashiers k ON o.USER_ID = k.USER_ID
//             WHERE ${prevYearCondition}
//             GROUP BY k.USER_ID, bulan
//             ORDER BY bulan ASC, total_service DESC 
//         `);

//         connection.release();

//         res.json({
//             year: new Date().getFullYear() - 1, 
//             champions: champions[0],
//             lists: {
//                 top10Products,
//                 monthlyProductProfit,
//                 monthlyProductQty,
//                 monthlyCustOrder,
//                 monthlyCustValue,
//                 monthlyCashierService
//             }
//         });

//     } catch (error) {
//         console.error("Advanced Stats Error:", error);
//         res.status(500).json({ message: 'Server Error', error });
//     }
// };

// AMBIL HISTORY SPESIFIK BY CUSTOMER ID
exports.getCustomerHistoryById = async (req, res) => {
    const { id } = req.params; // Ambil ID dari URL
    try {
        const connection = await db.getConnection();
        
        const [rows] = await connection.query(`
            SELECT 
                c.CUST_NAME,
                c.EMAIL,
                MONTH(o.ORDER_DATE) as month,
                YEAR(o.ORDER_DATE) as year,
                GROUP_CONCAT(CONCAT(p.PRODUCT_NAME, ' (', od.QTY, ')') SEPARATOR ', ') as product_list,
                SUM(o.TOTAL) as total_spent,
                COUNT(o.ORDER_ID) as trx_count
            FROM orders o
            JOIN customers c ON o.CUST_ID = c.CUST_ID
            JOIN order_details od ON o.ORDER_ID = od.ORDER_ID
            JOIN products p ON od.PRODUCT_ID = p.PRODUCT_ID
            WHERE o.ORDER_STATUS = 'COMPLETED' AND c.CUST_ID = ?
            GROUP BY year, month
            ORDER BY year DESC, month DESC
        `, [id]);

        connection.release();

        // Jika data kosong, kita cek nama customernya saja agar header halaman tidak "undefined"
        let customerInfo = {};
        if (rows.length === 0) {
            const [cust] = await db.query("SELECT CUST_NAME, EMAIL FROM customers WHERE CUST_ID = ?", [id]);
            if (cust.length > 0) customerInfo = cust[0];
        } else {
            customerInfo = { CUST_NAME: rows[0].CUST_NAME, EMAIL: rows[0].EMAIL };
        }

        res.json({
            customer: customerInfo,
            history: rows
        });

    } catch (error) {
        console.error("Error Detail History:", error);
        res.status(500).json({ message: 'Server Error', error });
    }
};