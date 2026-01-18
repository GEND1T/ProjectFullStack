const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',      // Default XAMPP/Laragon
    password: '',      // Default kosong
    database: 'db_project_uas', // <--- Sesuai nama database baru Anda
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cek koneksi saat pertama kali jalan
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Gagal Terkoneksi:', err.message);
    } else {
        console.log('✅ Berhasil Terkoneksi ke Database: db_project_uas');
        connection.release();
    }
});

module.exports = db.promise(); // Gunakan mode Promise (modern async/await)