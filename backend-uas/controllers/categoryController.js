const db = require('../config/database');

// 1. AMBIL SEMUA KATEGORI
exports.getAllCategories = async (req, res) => {
    try {
        // Alias: CATEGORY_ID -> id, CATEGORY -> name
        const [rows] = await db.query('SELECT CATEGORY_ID as id, CATEGORY as name FROM product_categories ORDER BY CATEGORY ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 2. AMBIL 1 KATEGORI
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT CATEGORY_ID as id, CATEGORY as name FROM product_categories WHERE CATEGORY_ID = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 3. TAMBAH KATEGORI (Opsional)
exports.createCategory = async (req, res) => {
    const { id, name } = req.body;
    try {
        await db.query('INSERT INTO product_categories (CATEGORY_ID, CATEGORY) VALUES (?, ?)', [id, name]);
        res.status(201).json({ message: 'Kategori berhasil dibuat' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal buat kategori', error });
    }
};

// 4. UPDATE KATEGORI
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const [result] = await db.query('UPDATE product_categories SET CATEGORY = ? WHERE CATEGORY_ID = ?', [name, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        res.json({ message: 'Kategori berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update kategori', error });
    }
};

// 5. HAPUS KATEGORI
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM product_categories WHERE CATEGORY_ID = ?', [id]);
        res.json({ message: 'Kategori dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal hapus (Mungkin sedang dipakai produk)', error });
    }
};