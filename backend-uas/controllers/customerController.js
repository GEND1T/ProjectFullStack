const db = require('../config/database');

// 1. Ambil Semua Customer
exports.getAllCustomers = async (req, res) => {
    try {
        const query = `
            SELECT 
                CUST_ID as id,
                CUST_NAME as name,
                EMAIL as email,
                CONTACT_NUMBER as phone,
                ADDRESS as address,
                GENDER_ID as gender
            FROM customers
            ORDER BY CUST_NAME ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 2. Ambil 1 Customer
exports.getCustomerById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT * FROM customers WHERE CUST_ID = ?`;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Customer tidak ditemukan' });
        
        // Mapping agar sesuai format frontend
        const data = rows[0];
        res.json({
            id: data.CUST_ID,
            name: data.CUST_NAME,
            email: data.EMAIL,
            phone: data.CONTACT_NUMBER,
            address: data.ADDRESS,
            gender: data.GENDER_ID
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 3. Tambah Customer
exports.createCustomer = async (req, res) => {
    const { id, name, email, phone, address, gender } = req.body;

    if (!id || id.length > 8) return res.status(400).json({ message: 'ID Maks 8 Karakter!' });

    try {
        const query = `
            INSERT INTO customers (CUST_ID, CUST_NAME, EMAIL, CONTACT_NUMBER, ADDRESS, GENDER_ID, CREATED_AT) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        await db.query(query, [id, name, email, phone, address, gender]);
        res.status(201).json({ message: 'Customer berhasil ditambahkan' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'ID Customer sudah dipakai' });
        res.status(500).json({ message: 'Gagal tambah customer', error });
    }
};

// 4. Update Customer
exports.updateCustomer = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, gender } = req.body;

    try {
        const query = `
            UPDATE customers 
            SET CUST_NAME=?, EMAIL=?, CONTACT_NUMBER=?, ADDRESS=?, GENDER_ID=?
            WHERE CUST_ID=?
        `;
        const [result] = await db.query(query, [name, email, phone, address, gender, id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer tidak ditemukan' });
        res.json({ message: 'Customer berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update customer', error });
    }
};

// 5. Hapus Customer
exports.deleteCustomer = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM customers WHERE CUST_ID = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Customer tidak ditemukan' });
        res.json({ message: 'Customer berhasil dihapus' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Gagal: Customer punya riwayat transaksi.' });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};