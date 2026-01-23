const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// IMPORT ROUTER
const productRoutes = require('./routers/productRouters'); 
const userRoutes = require('./routers/userRouters'); 
const customerRoutes = require('./routers/customerRouters');
const transaksiRoutes = require('./routers/transaksiRouters');
const categoryRoutes = require('./routers/categoryRouters.js');
const authRoutes = require('./routers/authRouters');
const sbdRouters = require('./routers/sbdRouters.js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.json({ message: "Server Backend UAS Berjalan!", database: "genexmart" });
});

// GUNAKAN ROUTER
app.use('/api/products', productRoutes); 
app.use('/api/users', userRoutes); 
app.use('/api/customers', customerRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/auth', authRoutes); 
app.use("/api/sbd", sbdRouters);




app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

