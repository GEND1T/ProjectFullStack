const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// 1. Ambil Semua Produk (Join dengan Kategori)
exports.getAllProducts = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.PRODUCT_ID as id,
                p.PRODUCT_NAME as name,
                p.CATEGORY_ID as category_id,
                c.CATEGORY_NAME as category_name,
                p.PRICE as price,
                p.STOCK as stock,
                p.IMAGE_URL as image
            FROM products p
            LEFT JOIN product_categories c ON p.CATEGORY_ID = c.CATEGORY_ID
            ORDER BY p.PRODUCT_ID DESC
        `;
        const [rows] = await db.query(query);
        res.json({ data: rows });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 2. Ambil Kategori (Untuk Dropdown di Frontend)
exports.getCategories = async (req, res) => {
    try {
        const query = 'SELECT CATEGORY_ID as id, CATEGORY_NAME as name FROM product_categories';
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 3. Ambil 1 Produk (Detail/Edit)
exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                PRODUCT_ID as id,
                PRODUCT_NAME as name,
                CATEGORY_ID as category_id,
                PRICE as price,
                STOCK as stock,
                IMAGE_URL as image
            FROM products WHERE PRODUCT_ID = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 4. Tambah Produk Baru (Create)
exports.createProduct = async (req, res) => {
    const { name, category_id, price, stock } = req.body;
    
    // Proses File Gambar
    let imagePath = null;
    if (req.file) {
        // Simpan path relatif agar bisa diakses browser
        imagePath = '/uploads/' + req.file.filename;
    }

    try {
        const query = `
            INSERT INTO products 
            (PRODUCT_NAME, CATEGORY_ID, PRICE, STOCK, IMAGE_URL, CREATED_AT) 
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        await db.query(query, [name, category_id, price, stock, imagePath]);
        res.status(201).json({ message: 'Produk berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menambah produk', error });
    }
};

// 5. Update Produk
exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category_id, price, stock } = req.body;
    
    // Cek apakah ada gambar baru yang diupload
    const newImage = req.file ? '/uploads/' + req.file.filename : null;

    try {
        // Jika ada gambar baru, hapus gambar lama (Opsional, fitur advanced)
        // Kita langsung update database saja
        let query, params;

        if (newImage) {
            query = `UPDATE products SET PRODUCT_NAME=?, CATEGORY_ID=?, PRICE=?, STOCK=?, IMAGE_URL=? WHERE PRODUCT_ID=?`;
            params = [name, category_id, price, stock, newImage, id];
        } else {
            query = `UPDATE products SET PRODUCT_NAME=?, CATEGORY_ID=?, PRICE=?, STOCK=? WHERE PRODUCT_ID=?`;
            params = [name, category_id, price, stock, id];
        }

        const [result] = await db.query(query, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
        
        res.json({ message: 'Produk berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update produk', error });
    }
};

// 6. Hapus Produk
exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        // (Opsional) Ambil path gambar dulu untuk dihapus dari folder
        // const [rows] = await db.query('SELECT IMAGE_URL FROM products WHERE PRODUCT_ID = ?', [id]);
        
        const [result] = await db.query('DELETE FROM products WHERE PRODUCT_ID = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
        
        res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Gagal: Produk ini ada di riwayat transaksi.' });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};