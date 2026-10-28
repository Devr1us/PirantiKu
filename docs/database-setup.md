# Panduan Konfigurasi Database & Storage Supabase (PirantiKu)

Dokumen ini menjelaskan struktur database, kebijakan keamanan (Row Level Security), storage bucket, fungsi RPC, dan cara menjalankan migrasi database Supabase untuk **PirantiKu**.

---

## 📁 File Migrasi Tersedia

Semua file migrasi berada di dalam direktori `supabase/migrations/`:

1. **[`01_schema_and_policies.sql`](file:///e:/PirantiKu/PirantiKu/supabase/migrations/01_schema_and_policies.sql)**
   - **Tabel Inti**: `settings`, `profiles`, `categories`, `equipment`, `equipment_images`, `bookings`, `booking_items`, `booking_status_history`, `payments`, `booking_returns`, `damage_reports`, `admin_logs`.
   - **Tipe Data Kustom (ENUM)**: `user_role`, `booking_status`, `payment_jenis`, `payment_status`, `damage_jenis`.
   - **Keamanan (RLS)**: Row-Level Security aktif di semua tabel dengan pembagian hak akses terperinci antara penyewa (`user`) dan pengelola (`admin`).
   - **Trigger Otomatis**:
     - `on_auth_user_created`: Otomatis membuat baris profil di `public.profiles` saat penyewa mendaftar akun di Supabase Auth.
   - **Storage Buckets**: Membuat bucket `equipment-images` dan `payment-proofs` dengan permission upload terverifikasi.
   - **Fungsi RPC Bisnis Rental**:
     - `create_booking(p_mulai, p_selesai, p_items, p_catatan)`: Validasi stok atomik, kalkulasi diskon sewa mingguan, dan pembuatan nomor booking unik (`PK-YYMMDD-XXXX`).
     - `sisa_stok(p_equipment_id, p_mulai, p_selesai)`: Menghitung sisa unit fisik yang tersedia untuk disewa pada rentang tanggal tertentu secara real-time.
     - `tanggal_penuh(p_equipment_id, p_dari, p_sampai)`: Mengembalikan daftar tanggal yang stok unitnya sudah habis (0).
     - `batalkan_booking(p_booking_id)`: Pembatalan pesanan aman sesuai hak akses.
     - `terima_pengembalian(p_booking_id, p_tanggal, p_catatan, p_kerusakan)`: Rekapitulasi serah terima alat, kalkulasi otomatis denda keterlambatan dan biaya ganti rugi kerusakan fisik unit.
     - `tandai_terlambat()`: Otomatisasi penandaan unit yang belum dikembalikan melewati jadwal selesai.
     - `is_admin()`: Helper keamanan pengecekan peran administrator.

2. **[`02_seed_equipment_images.sql`](file:///e:/PirantiKu/PirantiKu/supabase/migrations/02_seed_equipment_images.sql)**
   - Mengisi 57 record foto produk resolusi tinggi untuk seluruh katalog alat (Outdoor, Perkakas, Olahraga, Rumah Tangga, Acara/Pesta, Kamera, Otomotif, dan Kesehatan).

---

## 🚀 Cara Menjalankan Migrasi di Supabase Dashboard

1. Buka [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke proyek Anda (**`sihxbidxdclkjgrtwqft`**).
3. Klik menu **SQL Editor** pada navigasi sisi kiri.
4. Klik **New query**.
5. Salin seluruh isi file [`supabase/migrations/01_schema_and_policies.sql`](file:///e:/PirantiKu/PirantiKu/supabase/migrations/01_schema_and_policies.sql) lalu klik **Run** (Ctrl + Enter).
6. Buka kembali tab query baru, salin seluruh isi file [`supabase/migrations/02_seed_equipment_images.sql`](file:///e:/PirantiKu/PirantiKu/supabase/migrations/02_seed_equipment_images.sql) lalu klik **Run**.

---

## 👑 Cara Menjadikan Akun Sebagai Admin

Setelah mendaftar akun baru melalui halaman `/daftar` atau `/login` di website:
1. Buka menu **Table Editor** > **profiles** (atau via **SQL Editor**).
2. Jalankan query berikut dengan mengganti email/ID akun Anda:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE id = (
     SELECT id FROM auth.users WHERE email = 'email_admin_anda@gmail.com'
   );
   ```
3. Akun tersebut sekarang memiliki akses penuh ke seluruh menu di `/admin`.
