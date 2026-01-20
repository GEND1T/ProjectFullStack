const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',      
    password: '',      
    database: 'genexmart', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database Gagal Terkoneksi:', err.message);
    } else {
        console.log('✅ Berhasil Terkoneksi ke Database: db_project_uas');
        connection.release();
    }
});

module.exports = db.promise(); // Gunakan mode Promise (modern async/await)