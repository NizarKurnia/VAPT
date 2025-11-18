# VAPT1 - Kebab Ordering Web App

Aplikasi web pemesanan kebab dengan backend Node.js/Express dan frontend HTML/CSS/JS.

## Fitur
- Registrasi dan login pengguna
- Menu kebab dengan pencarian
- Keranjang belanja
- Pemesanan dan riwayat pesanan
- Promo code
- Upload foto profil
- Penyimpanan data menggunakan file JSON

## Setup Lokal

1. **Install Node.js** (versi 14+): Download dari [nodejs.org](https://nodejs.org/)

2. **Clone atau copy proyek** ke folder lokal.

3. **Install dependencies**:
   ```
   npm install
   ```

4. **Jalankan server**:
   ```
   npm start
   ```
   Server akan berjalan di `http://localhost:3000`

5. **Akses frontend**: Buka `index.html` di browser atau gunakan live server (misal VS Code Live Server) di port 5500.

## Deploy Internal (Jaringan Lokal)

Untuk deploy di server internal agar bisa diakses oleh orang lain di jaringan lokal saja:

### Persiapan Server
1. **Install Node.js** di server internal (Windows/Linux).

2. **Copy seluruh folder proyek** ke server internal.

3. **Install dependencies** di server:
   ```
   npm install
   ```

### Jalankan Server
1. **Edit server.js** untuk bind ke IP internal:
   - Ubah `app.listen(PORT, () => { ... })` menjadi:
     ```
     app.listen(PORT, '0.0.0.0', () => {
       console.log(`Mock API running on http://0.0.0.0:${PORT}`);
     });
     ```
   - Ini memungkinkan akses dari semua IP di jaringan lokal.

2. **Jalankan server**:
   ```
   npm start
   ```
   Server akan berjalan di `http://<IP_SERVER>:3000`

### Menggunakan PM2 (Production)
Untuk production, gunakan PM2 agar server tetap berjalan:
1. Install PM2 global:
   ```
   npm install -g pm2
   ```

2. Jalankan dengan PM2:
   ```
   pm2 start js/server.js --name kebab-app
   ```

3. Simpan konfigurasi PM2:
   ```
   pm2 save
   pm2 startup
   ```

4. Restart server jika perlu:
   ```
   pm2 restart kebab-app
   ```

### Akses dari Jaringan Lokal
- Cari IP server internal (misal `192.168.1.100`).
- Akses di browser: `http://192.168.1.100:3000`
- Pastikan firewall server mengizinkan port 3000 dari jaringan lokal.

### Menggunakan Docker (Opsional)
1. Buat Dockerfile:
   ```
   FROM node:14
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Build dan run:
   ```
   docker build -t kebab-app .
   docker run -p 3000:3000 kebab-app
   ```

## API Endpoints
- `GET /api/products` - Daftar produk
- `POST /api/auth/register` - Registrasi
- `POST /api/auth/login` - Login
- `POST /api/orders` - Buat pesanan
- Lihat `js/server.js` untuk endpoint lengkap.

## Catatan Keamanan
- Aplikasi ini untuk internal saja, jangan expose ke internet publik.
- Data disimpan di file JSON, cocok untuk demo/testing.
- Untuk production, gunakan database seperti MongoDB atau PostgreSQL.
