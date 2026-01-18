const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET_KEY = 'rahasia_negara_api'; // Ganti dengan yang lebih rumit nanti

// 1. REGISTER CUSTOMER
exports.registerCustomer = async (req, res) => {
    const { name, email, phone, password, address, gender } = req.body;

    // Generate ID Customer Otomatis (CUST + Timestamp)
    const id = 'CUST' + Math.floor(Math.random() * 10000); 

    try {
        // Cek email dulu
        const [exist] = await db.query('SELECT * FROM customers WHERE EMAIL = ?', [email]);
        if (exist.length > 0) return res.status(400).json({ message: 'Email sudah terdaftar!' });

        // Enkripsi Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO customers (CUST_ID, CUST_NAME, EMAIL, CONTACT_NUMBER, ADDRESS, GENDER_ID, PASSWORD, CREATED_AT) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        
        await db.query(query, [id, name, email, phone, address, gender, hashedPassword]);
        
        res.status(201).json({ message: 'Registrasi berhasil! Silakan login.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal register', error });
    }
};

// 2. LOGIN (Bisa untuk Kasir atau Customer)
exports.login = async (req, res) => {
    const { identifier, password, role } = req.body; 
    // identifier = email (customer) atau user_id (kasir)
    // role = 'admin' atau 'customer'

    try {
        let user = null;
        let table = '';
        let idCol = '';

        if (role === 'admin') {
            table = 'cashiers';
            idCol = 'USER_ID';
            // Login Kasir pakai USER_ID (misal ADM001)
            const [rows] = await db.query(`SELECT * FROM ${table} WHERE USER_ID = ?`, [identifier]);
            user = rows[0];
        } else {
            table = 'customers';
            idCol = 'CUST_ID';
            // Login Customer pakai EMAIL
            const [rows] = await db.query(`SELECT * FROM ${table} WHERE EMAIL = ?`, [identifier]);
            user = rows[0];
        }

        
        if (!user) {
            console.log("User tidak ditemukan di database:", identifier); // <--- DEBUG 1
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        // Cek Password
        const isMatch = await bcrypt.compare(password, user.PASSWORD);
        
        // === DEBUGGER & GENERATOR (TAMBAHKAN INI) ===
        console.log("=== DEBUG MATCH ===");
        console.log("Input:", password);
        console.log("Database Hash:", user.PASSWORD);
        console.log("Match Status:", isMatch);
        
        if (!isMatch) {
            // Kita minta backend buatkan hash yang valid untuk "123456"
            const newHash = await bcrypt.hash(password, 10);
            console.log("\n>>> SOLUSI: Coba copy hash baru ini ke Database:");
            console.log(newHash); 
            console.log("<<<\n");
            
            return res.status(400).json({ message: 'Password salah!' });
        }


        // Buat Token (Tiket Masuk)
        const token = jwt.sign({ 
            id: user[idCol], 
            role: role,
            name: role === 'admin' ? user.USERNAME : user.CUST_NAME
        }, SECRET_KEY, { expiresIn: '1d' }); // Expired 1 hari

        res.json({
            message: 'Login Berhasil',
            token: token,
            user: {
                id: user[idCol],
                name: role === 'admin' ? user.USERNAME : user.CUST_NAME,
                role: role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error });
    }
};