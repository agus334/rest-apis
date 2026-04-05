const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

// ─── AUTO-DETECT ENDPOINT SYSTEM ─────────────────────────────────────
// Scan folder, daftarkan route, kumpulkan metadata
// Untuk tambah endpoint baru: buat file baru di folder, tambahkan module.exports.meta
// Tidak perlu edit index.js atau HTML sama sekali!

const ENDPOINT_DIRS = ['ai', 'berita', 'dl', 'search', 'tools']; // tambah folder baru di sini jika ada
const registeredMeta = [];

ENDPOINT_DIRS.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        try {
            const mod = require(filePath);
            if (typeof mod === 'function') mod(app);
            if (mod.meta) registeredMeta.push(mod.meta);
        } catch (err) {
            console.warn(`⚠️  Gagal load ${dir}/${file}:`, err.message);
        }
    });
});

// ─── /api/endpoints — digunakan frontend untuk render UI otomatis ─────
app.get('/api/endpoints', (req, res) => {
    const categoryMap = {};
    registeredMeta.forEach(meta => {
        const key = meta.category;
        if (!categoryMap[key]) {
            categoryMap[key] = { category: meta.category, tag: meta.tag, endpoints: [] };
        }
        categoryMap[key].endpoints.push(...meta.endpoints);
    });

    res.json({
        status: 200,
        totalEndpoints: registeredMeta.reduce((sum, m) => sum + m.endpoints.length, 0),
        categories: Object.values(categoryMap)
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: "Endpoint tidak ditemukan" }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
});

app.listen(PORT, () => {
    const total = registeredMeta.reduce((s, m) => s + m.endpoints.length, 0);
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 Auto-detected ${total} endpoints dari ${registeredMeta.length} modul`);
});

module.exports = app;
