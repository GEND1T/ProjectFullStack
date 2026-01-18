const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer');
const path = require('path');

// === KONFIGURASI UPLOAD GAMBAR (MULTER) ===
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Simpan di folder 'uploads'
    },
    filename: function (req, file, cb) {
        // Namai file: timestamp-acak.jpg (agar tidak bentrok)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filter hanya boleh gambar
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya boleh upload file gambar!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// === DEFINISI ROUTE ===

// GET (Ambil Data)
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories); // Penting: ditaruh sebelum /:id
router.get('/:id', productController.getProductById);

// POST (Tambah Data dengan Gambar)
// 'image' adalah nama field di form frontend nanti
router.post('/', upload.single('image'), productController.createProduct);

// PUT (Update Data dengan Gambar)
router.put('/:id', upload.single('image'), productController.updateProduct);

// DELETE (Hapus Data)
router.delete('/:id', productController.deleteProduct);

module.exports = router;
