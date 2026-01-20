const db = require('../config/database');
const fs = require('fs');
const path = require('path');

exports.getAllProducts = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.PRODUCT_ID as id,
                p.PRODUCT_NAME as name,
                p.CATEGORY_ID as category_id,
                c.CATEGORY as category_name,
                p.PRICE as price,
                p.STOCK as stock,
                p.IMAGE as image
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

exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                PRODUCT_ID as id, PRODUCT_NAME as name, CATEGORY_ID as category_id, 
                PRICE as price, STOCK as stock, IMAGE as image 
            FROM products WHERE PRODUCT_ID = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

exports.createProduct = async (req, res) => {
    const { name, category_id, price, stock } = req.body;
    // Multer menyimpan file di req.file
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        const query = `INSERT INTO products (PRODUCT_NAME, CATEGORY_ID, PRICE, STOCK, IMAGE) VALUES (?, ?, ?, ?, ?)`;
        await db.query(query, [name, category_id, price, stock, image]);
        
        res.status(201).json({ message: 'Produk berhasil ditambahkan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal tambah produk', error });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category_id, price, stock } = req.body;
    const newImage = req.file ? `/uploads/${req.file.filename}` : null;

    try {
        let query = '';
        let params = [];

        if (newImage) {
            query = `UPDATE products SET PRODUCT_NAME=?, CATEGORY_ID=?, PRICE=?, STOCK=?, IMAGE=? WHERE PRODUCT_ID=?`;
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

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM products WHERE PRODUCT_ID = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Produk tidak ditemukan' });
        
        res.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal hapus produk', error });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const query = 'SELECT CATEGORY_ID as id, CATEGORY as name FROM product_categories';
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};