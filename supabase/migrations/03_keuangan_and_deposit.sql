-- ========================================================
-- PIRANTIKU - Migrasi Fitur Keuangan & Deposit
-- File: supabase/migrations/03_keuangan_and_deposit.sql
-- ========================================================

-- 1. ENUM & TYPE EXTENSIONS

-- Arah Transaksi: Masuk (pemasukan toko) / Keluar (pengembalian/refund/biaya)
DO $$ BEGIN
  CREATE TYPE public.payment_arah AS ENUM ('masuk', 'keluar');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Status Pembayaran Booking
DO $$ BEGIN
  CREATE TYPE public.booking_status_pembayaran AS ENUM (
    'belum_bayar',
    'dp_dibayar',
    'lunas',
    'menunggu_refund',
    'selesai'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tambahkan nilai enum baru ke payment_jenis secara aman jika belum ada
DO $$ BEGIN
  ALTER TYPE public.payment_jenis ADD VALUE IF NOT EXISTS 'denda_keterlambatan';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.payment_jenis ADD VALUE IF NOT EXISTS 'ganti_rugi';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.payment_jenis ADD VALUE IF NOT EXISTS 'penyesuaian';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;


-- 2. PERBARUI TABEL PAYMENTS (Buku Besar Transaksi Keuangan)

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS arah public.payment_arah NOT NULL DEFAULT 'masuk',
  ADD COLUMN IF NOT EXISTS catatan TEXT,
  ADD COLUMN IF NOT EXISTS dicatat_oleh UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tanggal_transaksi TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Validasi constraint: jumlah harus > 0
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_jumlah_positive;
ALTER TABLE public.payments ADD CONSTRAINT payments_jumlah_positive CHECK (jumlah > 0);

-- Sinkronisasi arah transaksi untuk data refund_deposit yang sudah ada
UPDATE public.payments
SET arah = 'keluar'
WHERE jenis = 'refund_deposit' AND arah <> 'keluar';

-- Sinkronisasi tanggal transaksi dari dibayar_pada jika tanggal_transaksi masih default/null
UPDATE public.payments
SET tanggal_transaksi = dibayar_pada
WHERE tanggal_transaksi IS NULL AND dibayar_pada IS NOT NULL;


-- 3. PERBARUI TABEL BOOKINGS (Status Pembayaran & Total Sewa)

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS total_sewa NUMERIC,
  ADD COLUMN IF NOT EXISTS status_pembayaran public.booking_status_pembayaran DEFAULT 'belum_bayar';


-- 4. PENGATURAN TOKO (SETTINGS DEFAULTS)

INSERT INTO public.settings (key, value, deskripsi)
VALUES
  ('persentase_dp', '30', 'Persentase uang muka (DP) dari total biaya sewa dalam persen (%)'),
  ('batas_pelunasan', 'sebelum_diambil', 'Batas pelunasan sisa tagihan sewa & deposit (sebelum_diambil / saat_diambil)'),
  ('info_rekening', 'BCA 1234567890 a/n PirantiKu', 'Informasi nomor rekening resmi untuk pembayaran transfer'),
  ('denda_per_hari', '50000', 'Tarif denda keterlambatan pengembalian unit per hari (Rupiah)')
ON CONFLICT (key) DO UPDATE
SET deskripsi = EXCLUDED.deskripsi
WHERE settings.deskripsi IS NULL;


-- 5. TRIGGER KEAMANAN: IMMUTABILITY TRANSAKSI TERVERIFIKASI
-- Transaksi yang sudah terverifikasi tidak boleh dihapus atau diubah jumlah/arah/jenisnya.
-- Koreksi wajib dilakukan melalui transaksi penyesuaian (adjustment).

CREATE OR REPLACE FUNCTION public.check_payment_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'terverifikasi' THEN
      RAISE EXCEPTION 'Transaksi dengan status terverifikasi tidak boleh dihapus. Buat transaksi penyesuaian untuk koreksi.';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'terverifikasi' AND (
      OLD.jumlah <> NEW.jumlah OR
      OLD.arah <> NEW.arah OR
      OLD.jenis <> NEW.jenis OR
      OLD.booking_id <> NEW.booking_id
    ) THEN
      RAISE EXCEPTION 'Transaksi terverifikasi bersifat kekal (immutable). Perubahan jumlah/arah/jenis dilarang.';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_immutability ON public.payments;
CREATE TRIGGER trg_payment_immutability
BEFORE UPDATE OR DELETE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.check_payment_immutability();


-- 6. SCRIPT BACKFILL OTOMATIS (IDEMPOTENT UNTUK DATA LAMA)

-- A. Hitung total_sewa untuk setiap booking dari booking_items, fallback ke (total_harga - deposit)
UPDATE public.bookings b
SET total_sewa = COALESCE(
  (
    SELECT SUM(bi.subtotal)
    FROM public.booking_items bi
    WHERE bi.booking_id = b.id
  ),
  GREATEST(0, b.total_harga - COALESCE(b.deposit, 0))
)
WHERE b.total_sewa IS NULL;

-- B. Update status_pembayaran untuk booking lama yang masih 'belum_bayar'
UPDATE public.bookings b
SET status_pembayaran = CASE
  WHEN b.status = 'selesai' THEN 'selesai'::public.booking_status_pembayaran
  WHEN b.status = 'dibatalkan' THEN 'belum_bayar'::public.booking_status_pembayaran
  WHEN b.status IN ('lunas', 'diambil', 'dikembalikan') THEN 'lunas'::public.booking_status_pembayaran
  WHEN b.status IN ('dp_dibayar', 'terlambat', 'bermasalah') THEN 'dp_dibayar'::public.booking_status_pembayaran
  WHEN EXISTS (
    SELECT 1 FROM public.payments p
    WHERE p.booking_id = b.id AND p.status = 'terverifikasi'
  ) THEN 'dp_dibayar'::public.booking_status_pembayaran
  ELSE 'belum_bayar'::public.booking_status_pembayaran
END
WHERE b.status_pembayaran IS NULL OR b.status_pembayaran = 'belum_bayar';

-- C. Tandai catatan backfill pada pembayaran lama yang belum memiliki catatan
UPDATE public.payments
SET catatan = '[Backfill Otomatis] Data transaksi tercatat sebelum integrasi sistem pembukuan'
WHERE catatan IS NULL;
