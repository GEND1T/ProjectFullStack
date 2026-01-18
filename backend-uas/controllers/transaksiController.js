const db = require('../config/database');

// 1. BUAT TRANSAKSI BARU (CHECKOUT)
exports.createTransaction = async (req, res) => {
    // Data yang dikirim dari Frontend:
    // { 
    //   user_id: 'CSR001', 
    //   cust_id: 'CUST001', 
    //   method_id: 1, 
    //   total_amount: 50000, 
    //   items: [ { product_id: 1, price: 10000, qty: 2, subtotal: 20000 }, ... ] 
    // }
    const { user_id, cust_id, method_id, total_amount, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Keranjang belanja kosong!' });
    }

    // Mulai Koneksi Khusus untuk Transaction
    const connection = await db.getConnection();
    
    try {
        // A. MULAI TRANSAKSI DATABASE
        await connection.beginTransaction();

        // B. Buat Nomor Invoice (Opsional: INV-Timestamp)
        const invoiceNo = `INV/${Date.now()}`;

        // C. Simpan Header Order
        // Jika cust_id kosong string "", ubah jadi null
        const finalCustId = cust_id === "" ? null : cust_id;

        const [orderResult] = await connection.query(
            `INSERT INTO orders (INVOICE_NO, ORDER_DATE, TOTAL_AMOUNT, CUST_ID, USER_ID, METHOD_ID) VALUES (?, NOW(), ?, ?, ?, ?)`,
            [invoiceNo, total_amount, finalCustId, user_id, method_id]
        );
        
        const newOrderId = orderResult.insertId;

        // D. Simpan Detail Item & Kurangi Stok
        for (const item of items) {
            // 1. Masukkan ke order_details
            await connection.query(
                `INSERT INTO order_details (ORDER_ID, PRODUCT_ID, PRICE_AT_PURCHASE, QTY, SUBTOTAL) VALUES (?, ?, ?, ?, ?)`,
                [newOrderId, item.product_id, item.price, item.qty, item.subtotal]
            );

            // 2. Kurangi Stok di tabel products
            await connection.query(
                `UPDATE products SET STOCK = STOCK - ? WHERE PRODUCT_ID = ?`,
                [item.qty, item.product_id]
            );
        }

        // E. COMMIT (Simpan Permanen)
        await connection.commit();
        
        res.status(201).json({ 
            message: 'Transaksi Berhasil!', 
            order_id: newOrderId,
            invoice: invoiceNo 
        });

    } catch (error) {
        // F. ROLLBACK (Batalkan semua jika ada 1 error)
        await connection.rollback();
        console.error("Transaksi Gagal:", error);
        res.status(500).json({ message: 'Transaksi Gagal', error: error.message });
    } finally {
        connection.release(); // Tutup koneksi
    }
};

// A. AMBIL PESANAN BARU (PENDING) - UNTUK MENU ORDERS
exports.getPendingOrders = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.ORDER_ID as id, o.INVOICE_NO as invoice, o.ORDER_DATE as date, 
                o.TOTAL_AMOUNT as total, o.ORDER_STATUS as status,
                c.CUST_NAME as customer_name,
                pm.METHOD_NAME as method
            FROM orders o
            LEFT JOIN customers c ON o.CUST_ID = c.CUST_ID
            JOIN payment_methods pm ON o.METHOD_ID = pm.METHOD_ID
            WHERE o.ORDER_STATUS = 'PENDING'
            ORDER BY o.ORDER_DATE ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// B. AMBIL RIWAYAT TRANSAKSI (COMPLETED) - UNTUK MENU PENJUALAN
exports.getHistoryTransactions = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.ORDER_ID as id, o.INVOICE_NO as invoice, o.ORDER_DATE as date, 
                o.TOTAL_AMOUNT as total, o.ORDER_STATUS as status,
                c.CUST_NAME as customer_name,
                pm.METHOD_NAME as method
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

// C. PROSES ORDER (SELESAI / BATAL)
exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, user_id } = req.body; // Tambah user_id

    if (!['COMPLETED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ message: "Status tidak valid" });
    }

    try {
        const connection = await db.getConnection(); // Pakai transaction biar aman
        await connection.beginTransaction();

        try {
            // 1. Jika Cancelled, kembalikan stok
            if (status === 'CANCELLED') {
                const [items] = await connection.query('SELECT PRODUCT_ID, QTY FROM order_details WHERE ORDER_ID = ?', [id]);
                for (const item of items) {
                    await connection.query('UPDATE products SET STOCK = STOCK + ? WHERE PRODUCT_ID = ?', [item.QTY, item.PRODUCT_ID]);
                }
            }

            // 2. Update Status DAN Update Siapa Kasir yang memproses
            // Jika user_id dikirim, kita update kolom USER_ID. Jika tidak, biarkan yang lama.
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

// 2. AMBIL SEMUA TRANSAKSI (History)
exports.getAllTransactions = async (req, res) => {
    try {
        const query = `
            SELECT 
                o.ORDER_ID as id,
                o.INVOICE_NO as invoice,
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

// 3. DETAIL TRANSAKSI (Invoice)
exports.getTransactionDetail = async (req, res) => {
    const { id } = req.params;
    try {
        // Ambil Header
        const [header] = await db.query(`
            SELECT 
                o.ORDER_ID, o.INVOICE_NO, o.ORDER_DATE, o.TOTAL_AMOUNT,
                c.CUST_NAME, c.ADDRESS as CUST_ADDRESS,
                k.USERNAME as CASHIER_NAME,
                pm.METHOD_NAME
            FROM orders o
            LEFT JOIN customers c ON o.CUST_ID = c.CUST_ID
            JOIN cashiers k ON o.USER_ID = k.USER_ID
            JOIN payment_methods pm ON o.METHOD_ID = pm.METHOD_ID
            WHERE o.ORDER_ID = ?
        `, [id]);

        if (header.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        // Ambil Items
        const [items] = await db.query(`
            SELECT 
                od.QTY, od.PRICE_AT_PURCHASE, od.SUBTOTAL,
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

// 4. STATISTIK DASHBOARD (Untuk Home)
exports.getDashboardStats = async (req, res) => {
    try {
        // Hitung Pendapatan, Jumlah Transaksi, dll
        const [rev] = await db.query('SELECT SUM(TOTAL_AMOUNT) as val FROM orders');
        const [trx] = await db.query('SELECT COUNT(*) as val FROM orders');
        const [prod] = await db.query('SELECT COUNT(*) as val FROM products');
        const [cust] = await db.query('SELECT COUNT(*) as val FROM customers');

        res.json({
            revenue: rev[0].val || 0,
            total_trx: trx[0].val || 0,
            total_products: prod[0].val || 0,
            total_customers: cust[0].val || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Error Stats' });
    }
};