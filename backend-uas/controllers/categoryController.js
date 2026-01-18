const db = require('../config/database');

// 1. Ambil Semua Kategori
exports.getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT CATEGORY_ID as id, CATEGORY_NAME as name FROM product_categories ORDER BY CATEGORY_NAME ASC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 2. Ambil 1 Kategori (Untuk Edit)
exports.getCategoryById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT CATEGORY_ID as id, CATEGORY_NAME as name FROM product_categories WHERE CATEGORY_ID = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 3. Tambah Kategori (Opsional, buat jaga-jaga)
exports.createCategory = async (req, res) => {
    const { id, name } = req.body; // ID harus manual misal 'SN' (Snack)
    try {
        await db.query('INSERT INTO product_categories (CATEGORY_ID, CATEGORY_NAME) VALUES (?, ?)', [id, name]);
        res.status(201).json({ message: 'Kategori berhasil dibuat' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal buat kategori', error });
    }
};

// 4. Update Kategori (INTI PERMINTAAN ANDA)
exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const query = 'UPDATE product_categories SET CATEGORY_NAME = ? WHERE CATEGORY_ID = ?';
        const [result] = await db.query(query, [name, id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
        res.json({ message: 'Kategori berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update kategori', error });
    }
};

// 5. Hapus Kategori
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM product_categories WHERE CATEGORY_ID = ?', [id]);
        res.json({ message: 'Kategori dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal hapus (Mungkin sedang dipakai produk)', error });
    }
};