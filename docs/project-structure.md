# Struktur Proyek

- `app/`: route dan halaman Next.js App Router.
- `components/`: komponen UI yang dapat digunakan ulang.
- `lib/`: helper, koneksi layanan, dan validasi.
- `types/`: tipe domain aplikasi.
- `supabase/migrations/`: perubahan skema database.
- `public/`: aset statis.

Route publik utama:

- `/alat` untuk daftar alat.
- `/kategori/[slug]` untuk alat berdasarkan kategori.
- `/booking-saya` untuk riwayat booking.
- `/keranjang` dan `/checkout` untuk proses penyewaan.

Route admin berada di bawah `/admin`.
