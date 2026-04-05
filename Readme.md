☘️ Terimakasih kepada
Allah Swt

Kedua Orangtua Saya

Penyedia Scraper

Pengguna Bot Yang Selalu Support

📝 Credit : Lenwy
🥇 Pengembang : (Nama Kalian)

---

# 📡 ARR Official — REST API

Kumpulan endpoint gratis untuk bot, aplikasi, dan eksperimen developer Indonesia.

---

## 🚀 Cara Menjalankan

```bash
npm install
node index.js
```

Server akan berjalan di `http://localhost:3000`

---

## ✨ Fitur Auto-Detect Endpoint

Sistem ini dilengkapi **auto-detect endpoint** — artinya setiap kali kamu menambahkan file endpoint baru, tampilan HTML akan **otomatis terupdate** tanpa perlu mengedit `index.html` sama sekali.

Caranya cukup dua langkah:

### Langkah 1 — Buat file endpoint baru

Buat file `.js` di salah satu folder kategori:

| Folder | Kategori |
|--------|----------|
| `ai/` | Artificial Intelligence |
| `berita/` | Berita |
| `dl/` | Downloader |
| `search/` | Search & Islami |

> Ingin kategori baru? Buat folder baru, lalu daftarkan nama foldernya di array `ENDPOINT_DIRS` dalam `index.js`.

---

### Langkah 2 — Tambahkan `module.exports.meta`

Di bawah kode endpoint kamu, tambahkan blok meta seperti ini:

```js
// Contoh: search/googleSearch.js

module.exports = function(app) {
  app.get('/googlesearch', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Parameter "q" tidak ditemukan' });

    // ... logika scraping / fetch kamu di sini ...

    res.json({ status: 200, creator: "ARR Official", data: result });
  });
};

// Blok ini yang dibaca otomatis oleh sistem!
module.exports.meta = {
  category: "Search & Islami",   // nama kategori (tampil sebagai judul accordion)
  tag: "SRCH",                   // label tag kecil di kanan accordion
  endpoints: [
    {
      method: "GET",             // method HTTP: GET, POST, dll
      path: "/googlesearch",     // path endpoint
      desc: "Cari di Google",    // deskripsi singkat (tampil di card)
      tryUrl: "/googlesearch?q=hello", // URL untuk tombol "Try It"
      params: [
        { name: "q", required: true,  desc: "Query pencarian" },
        { name: "safe", required: false, desc: "Filter konten (opsional)" }
      ]
    }
  ]
};
```

Simpan file → restart server → endpoint langsung muncul di halaman utama. Selesai!

---

## 📁 Struktur Project

```
rest-api/
├── index.js              ← Entry point + auto-detect system
├── public/
│   ├── index.html        ← Halaman utama (tidak perlu diedit)
│   ├── script.js         ← Fetch /api/endpoints & render otomatis
│   └── style.css         ← Styling
├── ai/
│   ├── Blackbox.js
│   ├── LuminAI.js
│   └── Thinkai.js
├── berita/
│   └── liputan6.js
├── dl/
│   └── ytmp3.js
├── search/
│   ├── goodread.js
│   ├── jadwalsholat.js
│   ├── rumaysho.js
│   ├── surah.js
│   └── ypia.js
└── package.json
```

---

## 🌐 Endpoint Sistem

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/` | Halaman utama HTML |
| GET | `/api/endpoints` | Data semua endpoint dalam format JSON (digunakan frontend) |

---

## 📦 Format Respons

Semua endpoint mengembalikan JSON dengan format:

```json
{
  "status": 200,
  "creator": "ARR Official",
  "data": {
    "response": "Hasil respons permintaan kamu"
  }
}
```

---

## 📣 Salam Hangat

Halo Semua, Sebelumnya Terimakasih Bagi Kalian Yang Sudah Menggunakan Atau Bahkan Mengembangkan Script REST API Ini. Mohon Untuk Tidak Menghapus Credit Yang Tertera Disini. Terimakasihh.

📑 Informasi Lebih Lengkap :
- Whatsapp : wa.me/6283829814737
- Telegram : t.me/ilenwy
- Gmail : Ilenwyy@gmail.com
- Instagram : ilenwy_
- Youtube : Lenwy

📦 Komunitas :
- Grup Whatsapp : https://chat.whatsapp.com/LJViMFtwsTqLRSIY8aklKP
- Saluran Whatsapp : https://whatsapp.com/channel/0029VaGdzBSGZNCmoTgN2K0u

❤️ Terimakasihh.
"# rest-apis" 
