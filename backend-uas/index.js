const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// IMPORT ROUTER
const productRoutes = require('./routers/productRouters'); // <--- TAMBAHKAN INI
const userRoutes = require('./routers/userRouters'); // <--- TAMBAHKAN INI
const customerRoutes = require('./routers/customerRouters');
const transaksiRoutes = require('./routers/transaksiRouters');
const categoryRoutes = require('./routers/categoryRouters.js');
const authRoutes = require('./routers/authRouters');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ message: "Server Backend UAS Berjalan!", database: "db_project_uas" });
});

// GUNAKAN ROUTER
app.use('/api/products', productRoutes); // <--- TAMBAHKAN INI
app.use('/api/users', userRoutes); // <--- TAMBAHKAN INI
app.use('/api/customers', customerRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes); // <--- Tambahkan ini



app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

