# Expense Tracker — Project Context

## Stack

| Layer    | Tech                          | Platform                     |
| -------- | ----------------------------- | ---------------------------- |
| Frontend | React Router v7 SPA mode      | Vercel (free)                |
| Backend  | NestJS + Better Auth + Prisma | Render (free)                |
| Database | PostgreSQL                    | Neon (free)                  |
| Auth     | Better Auth + Google OAuth    | @thallesp/nestjs-better-auth |

## Arsitektur

- Frontend dan backend **terpisah** (bukan monolith)
- Tidak pakai Redis — Neon PostgreSQL sudah cukup
- Cross-domain cookie — CORS `credentials: true` + `trustedOrigins` di Better Auth
- Google OAuth gratis — whitelist 2 email, private app

---

## PROBIS AUTH

### Whitelist + Role

| Email                           | Role    | Akses            |
| ------------------------------- | ------- | ---------------- |
| Email owner (env: ADMIN_EMAIL)  | Admin   | Full CRUD        |
| Email istri (env: VIEWER_EMAIL) | Viewer  | Read-only        |
| Email lain                      | Ditolak | Tidak bisa login |

### Permission

- GET endpoint → semua role boleh
- POST/PUT/DELETE → admin only

### Flow 1: Google OAuth Login

1. User klik Login → `authClient.signIn.social({ provider: "google" })`
2. NestJS/Better Auth generate OAuth URL + state + code-verifier (PKCE)
3. Browser redirect ke Google → user login
4. Google callback ke NestJS → verifikasi code + state
5. Cek email ada di whitelist → kalau tidak, reject
6. Better Auth upsert ke Neon: tabel user + account + session (otomatis)
7. Set httpOnly cookie (`better-auth.session-token`)
8. Redirect ke /dashboard

### Flow 2: Protected Route

1. `useSession()` hook cek cookie
2. Ada cookie → GET /api/auth/session → verifikasi di Neon → render halaman
3. Tidak ada cookie → redirect ke /login

### Flow 3: Logout & Session Expiry

- Logout manual: `signOut()` → DELETE session dari Neon → clear cookie
- Session expiry: 7 hari, auto-refresh kalau aktif (updateAge: 1d)
- Expired → 401 → redirect ke /login

### Konfigurasi Session

- `expiresIn: "7d"`
- `updateAge: "1d"`
- `cookieCache: enabled`

---

## PROBIS TRANSAKSI

### Tipe Transaksi (4 tipe)

| Tipe            | Masuk Laporan? | Contoh                                                |
| --------------- | -------------- | ----------------------------------------------------- |
| Pemasukan       | Ya             | Gaji, bonus, cashback                                 |
| Pengeluaran     | Ya             | Makan, transport, listrik, admin bank, transfer istri |
| Transfer Keluar | Tidak          | Pindah uang antar wallet (sisi keluar)                |
| Transfer Masuk  | Tidak          | Pindah uang antar wallet (sisi masuk)                 |

### Field Transaksi

| Field        | Wajib | Keterangan                                                   |
| ------------ | ----- | ------------------------------------------------------------ |
| Jumlah (IDR) | Ya    |                                                              |
| Tipe         | Ya    | Pemasukan / Pengeluaran / Transfer                           |
| Wallet       | Ya    | Sumber uang (+ tujuan kalau transfer)                        |
| Metode       | Ya    | **Hanya untuk pengeluaran** — Cash / QRIS / Transfer / Debit |
| Kategori     | Ya    | Tidak berlaku untuk tipe transfer                            |
| Tanggal      | Ya    | Default hari ini, bisa diubah                                |
| Catatan      | Tidak | Opsional                                                     |
| Biaya admin  | Tidak | Hanya di form transfer, default 0                            |

### Mekanisme Transfer

User input 1x, sistem pecah jadi 3 record:

| Record | Tipe            | Wallet  | Contoh (Mandiri → Jago 1jt, admin 6.500) |
| ------ | --------------- | ------- | ---------------------------------------- |
| 1      | Transfer Keluar | Mandiri | -1.000.000                               |
| 2      | Transfer Masuk  | Jago    | +1.000.000                               |
| 3      | Pengeluaran     | Mandiri | -6.500 (kategori: Biaya Admin)           |

- Record 1 & 2 = linked (transfer pair), edit salah satu → yang lain ikut berubah
- Record 3 = pengeluaran biasa, otomatis tercatat dari field biaya admin

---

## PROBIS WALLET

| Wallet            | Fungsi                                |
| ----------------- | ------------------------------------- |
| Bank Mandiri      | Penggajian, bayar listrik & wifi (VA) |
| Bank Jago         | Diversifikasi ke Bibit & BCA          |
| Bank Jago Syariah | Transfer istri bulanan                |
| Bank BCA          | Tabungan utama                        |
| ShopeePay         | Transaksi Shopee                      |
| OVO               | Transaksi Grab                        |
| Bibit             | Investasi                             |

- Saldo awal diinput saat bikin wallet, bisa diedit kapan saja
- Saldo = saldo awal + total pemasukan + total transfer masuk - total pengeluaran - total transfer keluar
- Investasi = transfer ke wallet Bibit (bukan pengeluaran)

---

## PROBIS KATEGORI

- Disimpan di database, seeding saat user pertama register
- User bisa CRUD custom kategori
- Ikon per kategori, tanpa warna, tanpa sub-kategori (1 level)

### Default Kategori Pengeluaran

| Kategori           | Ikon |
| ------------------ | ---- |
| Makanan & Minuman  | 🍔   |
| Transportasi       | 🚗   |
| Belanja            | 🛒   |
| Tagihan & Utilitas | 💡   |
| Hiburan            | 🎮   |
| Kesehatan          | 💊   |
| Pendidikan         | 📚   |
| Keluarga           | 👨‍👩‍👧   |
| Biaya Admin        | 🏦   |
| Lainnya            | 📌   |

### Default Kategori Pemasukan

| Kategori | Ikon |
| -------- | ---- |
| Gaji     | 💰   |
| Bonus    | 🎁   |
| Cashback | 💸   |
| Lainnya  | 📌   |

---

## PROBIS RECURRING (Reminder Mode)

- Semua recurring = reminder, bukan auto-post
- Flow: Notif → form pre-filled → user cek/ubah nominal → confirm → tercatat
- Frekuensi: bulanan (bisa set tanggal)

| Item           | Tipe        | Dari Wallet  | Keterangan                   |
| -------------- | ----------- | ------------ | ---------------------------- |
| Bibit          | Transfer    | Jago → Bibit | Investasi bulanan            |
| Transfer istri | Pengeluaran | Jago Syariah | Kategori: Keluarga           |
| Listrik        | Pengeluaran | Mandiri (VA) | Kategori: Tagihan & Utilitas |
| WiFi           | Pengeluaran | Mandiri (VA) | Kategori: Tagihan & Utilitas |
| Admin Mandiri  | Pengeluaran | Mandiri      | Kategori: Biaya Admin        |
| Admin BCA      | Pengeluaran | BCA          | Kategori: Biaya Admin        |

---

## PROBIS LAPORAN

### Periode

| Periode  | Keterangan              |
| -------- | ----------------------- |
| Mingguan | Senin - Minggu          |
| Bulanan  | Tanggal 1 - akhir bulan |
| Tahunan  | Januari - Desember      |

### Isi Laporan (semua periode)

- Total pemasukan vs total pengeluaran
- Selisih (surplus/defisit)
- Breakdown per kategori
- Breakdown per wallet

### Khusus Bulanan

- Perbandingan bulan ini vs bulan lalu (naik/turun %)

### Grafik/Chart

- **Line chart**: tren 12 bulan — pemasukan vs pengeluaran per bulan
- **Pie chart**: proporsi pengeluaran per kategori

### Saldo Keseluruhan

- Total saldo semua wallet digabung
- Detail saldo per wallet

### Tabel Transaksi

- Kolom: Tanggal, Tipe, Kategori, Wallet, Metode, Jumlah, Catatan
- Filter & sorting: mengikuti schema database

---

## PROBIS BUDGET

### Setup

- User pilih kategori yang masuk budget (misal: Makanan + Transportasi)
- Limit: 1.000.000/bulan
- Periode: bulanan, reset otomatis tiap tanggal 1
- Cukup 1 budget untuk sekarang

### Cara Hitung

- Budget terpakai = SUM pengeluaran di kategori terpilih dalam bulan berjalan
- Sisa = Limit - Budget terpakai
- Persentase = (Budget terpakai / Limit) x 100

### Alert

| Status      | Kondisi | Tampilan |
| ----------- | ------- | -------- |
| Normal      | < 80%   | Hijau    |
| Warning     | >= 80%  | Kuning   |
| Over budget | > 100%  | Merah    |

---

## Langkah Selanjutnya

- [ ] Database schema (Prisma)
- [ ] API endpoints per modul
- [ ] Struktur folder project
- [ ] Implementasi
