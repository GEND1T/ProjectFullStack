const db = require('../config/database');

// 1. Ambil Semua User
exports.getAllUsers = async (req, res) => {
    try {
        const query = `
            SELECT 
                USER_ID as id,
                USERNAME as name,
                EMAIL as email,
                CONTACT_NUMBER as phone,
                ADDRESS as address,
                GENDER_ID as gender
            FROM cashiers
            ORDER BY USERNAME ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 2. Ambil 1 User (Untuk Edit)
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                USER_ID as id,
                USERNAME as name,
                EMAIL as email,
                CONTACT_NUMBER as phone,
                ADDRESS as address,
                PLACE_OF_BIRTH as pob,
                DATE_OF_BIRTH as dob,
                GENDER_ID as gender
            FROM cashiers WHERE USER_ID = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

// 3. Tambah User Baru
exports.createUser = async (req, res) => {
    // Data dari frontend
    const { id, name, email, phone, address, pob, dob, gender, password } = req.body;

    // Validasi ID (Harus 8 Karakter)
    if (!id || id.length > 8) return res.status(400).json({ message: 'ID Wajib diisi (Maks 8 Karakter)!' });

    try {
        const query = `
            INSERT INTO cashiers 
            (USER_ID, USERNAME, EMAIL, CONTACT_NUMBER, ADDRESS, PLACE_OF_BIRTH, DATE_OF_BIRTH, GENDER_ID, PASSWORD, CREATED_AT) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        // Password sementara disimpan plain text dulu (nanti kita enkripsi saat bikin Login)
        await db.query(query, [id, name, email, phone, address, pob, dob, gender, password || '123456']);
        
        res.status(201).json({ message: 'User berhasil ditambahkan' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'ID atau Email sudah digunakan!' });
        console.error(error);
        res.status(500).json({ message: 'Gagal menambah user', error });
    }
};

// 4. Update User
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, address, pob, dob, gender } = req.body;

    try {
        const query = `
            UPDATE cashiers 
            SET USERNAME=?, EMAIL=?, CONTACT_NUMBER=?, ADDRESS=?, PLACE_OF_BIRTH=?, DATE_OF_BIRTH=?, GENDER_ID=?
            WHERE USER_ID=?
        `;
        const [result] = await db.query(query, [name, email, phone, address, pob, dob, gender, id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ message: 'User berhasil diupdate' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal update user', error });
    }
};

// 5. Hapus User
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM cashiers WHERE USER_ID = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User tidak ditemukan' });
        res.json({ message: 'User berhasil dihapus' });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'Gagal: User ini memiliki riwayat transaksi.' });
        }
        res.status(500).json({ message: 'Server Error', error });
    }
};