-- ========================================================
-- PIRANTIKU - Database Schema, RLS Policies, Storage & RPCs
-- File: supabase/migrations/01_schema_and_policies.sql
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM (
    'menunggu_dp',
    'dp_dibayar',
    'lunas',
    'diambil',
    'terlambat',
    'dikembalikan',
    'bermasalah',
    'selesai',
    'dibatalkan'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_jenis AS ENUM (
    'dp',
    'pelunasan',
    'deposit',
    'denda',
    'refund_deposit'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'menunggu_verifikasi',
    'terverifikasi',
    'ditolak'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.damage_jenis AS ENUM ('rusak_ringan', 'rusak_berat', 'hilang');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABLES DEFINITIONS

-- Table: settings
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  deskripsi TEXT
);

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  no_hp TEXT NOT NULL,
  alamat TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: categories
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  ikon TEXT NOT NULL,
  urutan INT NOT NULL DEFAULT 0
);

-- Table: equipment
CREATE TABLE IF NOT EXISTS public.equipment (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  nama TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  deskripsi TEXT,
  spesifikasi JSONB,
  harga_per_hari NUMERIC NOT NULL,
  harga_mingguan NUMERIC,
  deposit NUMERIC NOT NULL DEFAULT 0,
  stok INT NOT NULL DEFAULT 1,
  stok_rusak INT NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: equipment_images
CREATE TABLE IF NOT EXISTS public.equipment_images (
  id SERIAL PRIMARY KEY,
  equipment_id INT NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  urutan INT NOT NULL DEFAULT 1,
  is_utama BOOLEAN NOT NULL DEFAULT false
);

-- Table: bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kode_booking TEXT UNIQUE NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'menunggu_dp',
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  total_harga NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL DEFAULT 0,
  dp_jumlah NUMERIC NOT NULL,
  tanggal_diambil TIMESTAMPTZ,
  catatan_penyewa TEXT,
  pesan_admin TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: booking_items
CREATE TABLE IF NOT EXISTS public.booking_items (
  id SERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  equipment_id INT NOT NULL REFERENCES public.equipment(id) ON DELETE RESTRICT,
  qty INT NOT NULL,
  harga_per_hari NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL
);

-- Table: booking_status_history
CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id SERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status_lama public.booking_status,
  status_baru public.booking_status NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: payments
CREATE TABLE IF NOT EXISTS public.payments (
  id SERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  jenis public.payment_jenis NOT NULL DEFAULT 'dp',
  jumlah NUMERIC NOT NULL,
  metode TEXT NOT NULL,
  bukti_url TEXT,
  status public.payment_status NOT NULL DEFAULT 'menunggu_verifikasi',
  dibayar_pada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diverifikasi_oleh UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Table: booking_returns
CREATE TABLE IF NOT EXISTS public.booking_returns (
  id SERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  tanggal_dikembalikan TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hari_terlambat INT NOT NULL DEFAULT 0,
  denda_terlambat NUMERIC NOT NULL DEFAULT 0,
  total_ganti_rugi NUMERIC NOT NULL DEFAULT 0,
  deposit_dikembalikan NUMERIC NOT NULL DEFAULT 0,
  catatan TEXT
);

-- Table: damage_reports
CREATE TABLE IF NOT EXISTS public.damage_reports (
  id SERIAL PRIMARY KEY,
  booking_item_id INT NOT NULL REFERENCES public.booking_items(id) ON DELETE CASCADE,
  return_id INT NOT NULL REFERENCES public.booking_returns(id) ON DELETE CASCADE,
  jenis public.damage_jenis NOT NULL DEFAULT 'rusak_ringan',
  jumlah INT NOT NULL DEFAULT 1,
  deskripsi TEXT NOT NULL,
  biaya_ganti_rugi NUMERIC NOT NULL DEFAULT 0,
  foto_url TEXT
);

-- Table: admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aksi TEXT NOT NULL,
  nama_tabel TEXT NOT NULL,
  target_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) & POLICIES

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settings Policies: Semua orang bisa baca, hanya admin yang bisa ubah
DROP POLICY IF EXISTS "Public Read Settings" ON public.settings;
CREATE POLICY "Public Read Settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Settings" ON public.settings;
CREATE POLICY "Admin Manage Settings" ON public.settings FOR ALL USING (public.is_admin());

-- Profiles Policies: User bisa baca & update profil sendiri, Admin bisa kelola semua
DROP POLICY IF EXISTS "User View Own Profile" ON public.profiles;
CREATE POLICY "User View Own Profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "User Update Own Profile" ON public.profiles;
CREATE POLICY "User Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin Manage Profiles" ON public.profiles;
CREATE POLICY "Admin Manage Profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Categories & Equipment Policies: Publik bisa baca yang aktif, Admin kelola semua
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Categories" ON public.categories;
CREATE POLICY "Admin Manage Categories" ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public Read Equipment" ON public.equipment;
CREATE POLICY "Public Read Equipment" ON public.equipment FOR SELECT USING (aktif = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Equipment" ON public.equipment;
CREATE POLICY "Admin Manage Equipment" ON public.equipment FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Public Read Equipment Images" ON public.equipment_images;
CREATE POLICY "Public Read Equipment Images" ON public.equipment_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Manage Equipment Images" ON public.equipment_images;
CREATE POLICY "Admin Manage Equipment Images" ON public.equipment_images FOR ALL USING (public.is_admin());

-- Bookings & Items Policies: User kelola booking miliknya, Admin kelola semua
DROP POLICY IF EXISTS "User View Own Bookings" ON public.bookings;
CREATE POLICY "User View Own Bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "User Insert Own Bookings" ON public.bookings;
CREATE POLICY "User Insert Own Bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "User Update Own Bookings" ON public.bookings;
CREATE POLICY "User Update Own Bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Bookings" ON public.bookings;
CREATE POLICY "Admin Manage Bookings" ON public.bookings FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "User View Own Booking Items" ON public.booking_items;
CREATE POLICY "User View Own Booking Items" ON public.booking_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND (user_id = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS "Admin Manage Booking Items" ON public.booking_items;
CREATE POLICY "Admin Manage Booking Items" ON public.booking_items FOR ALL USING (public.is_admin());

-- Payments Policies
DROP POLICY IF EXISTS "User View Own Payments" ON public.payments;
CREATE POLICY "User View Own Payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND (user_id = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS "User Insert Payments" ON public.payments;
CREATE POLICY "User Insert Payments" ON public.payments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid()) OR public.is_admin()
);

DROP POLICY IF EXISTS "Admin Manage Payments" ON public.payments;
CREATE POLICY "Admin Manage Payments" ON public.payments FOR ALL USING (public.is_admin());

-- Status History, Returns, Damage Reports Policies
DROP POLICY IF EXISTS "View Booking Status History" ON public.booking_status_history;
CREATE POLICY "View Booking Status History" ON public.booking_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND (user_id = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS "Admin Manage Status History" ON public.booking_status_history;
CREATE POLICY "Admin Manage Status History" ON public.booking_status_history FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "View Booking Returns" ON public.booking_returns;
CREATE POLICY "View Booking Returns" ON public.booking_returns FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND (user_id = auth.uid() OR public.is_admin()))
);

DROP POLICY IF EXISTS "Admin Manage Returns" ON public.booking_returns;
CREATE POLICY "Admin Manage Returns" ON public.booking_returns FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "View Damage Reports" ON public.damage_reports;
CREATE POLICY "View Damage Reports" ON public.damage_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.booking_returns br
    JOIN public.bookings b ON b.id = br.booking_id
    WHERE br.id = return_id AND (b.user_id = auth.uid() OR public.is_admin())
  )
);

DROP POLICY IF EXISTS "Admin Manage Damage Reports" ON public.damage_reports;
CREATE POLICY "Admin Manage Damage Reports" ON public.damage_reports FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Logs" ON public.admin_logs;
CREATE POLICY "Admin Manage Logs" ON public.admin_logs FOR ALL USING (public.is_admin());

-- 5. TRIGGER: Otomatis sinkronisasi Auth Users ke public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, no_hp, alamat, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'no_hp', ''),
    COALESCE(NEW.raw_user_meta_data->>'alamat', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nama = EXCLUDED.nama,
    no_hp = CASE WHEN EXCLUDED.no_hp <> '' THEN EXCLUDED.no_hp ELSE profiles.no_hp END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RPC FUNCTIONS

-- Function: Hitung Sisa Stok Real-time per Rentang Tanggal
CREATE OR REPLACE FUNCTION public.sisa_stok(
  p_equipment_id INT,
  p_mulai DATE,
  p_selesai DATE
)
RETURNS INT AS $$
DECLARE
  v_total_stok INT := 0;
  v_stok_rusak INT := 0;
  v_stok_bersih INT := 0;
  v_terpakai INT := 0;
BEGIN
  SELECT COALESCE(stok, 0), COALESCE(stok_rusak, 0)
  INTO v_total_stok, v_stok_rusak
  FROM public.equipment
  WHERE id = p_equipment_id AND aktif = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  v_stok_bersih := GREATEST(0, v_total_stok - v_stok_rusak);

  -- Hitung unit yang sedang dikunci pada rentang tanggal
  SELECT COALESCE(SUM(bi.qty), 0)
  INTO v_terpakai
  FROM public.booking_items bi
  JOIN public.bookings b ON b.id = bi.booking_id
  WHERE bi.equipment_id = p_equipment_id
    AND b.status IN ('dp_dibayar', 'lunas', 'diambil', 'terlambat')
    AND NOT (b.tanggal_selesai < p_mulai OR b.tanggal_mulai > p_selesai);

  RETURN GREATEST(0, v_stok_bersih - v_terpakai);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Daftar Tanggal Habis/Penuh dalam Rentang Waktu
CREATE OR REPLACE FUNCTION public.tanggal_penuh(
  p_equipment_id INT,
  p_dari DATE,
  p_sampai DATE
)
RETURNS TEXT[] AS $$
DECLARE
  v_curr DATE := p_dari;
  v_penuh TEXT[] := ARRAY[]::TEXT[];
BEGIN
  WHILE v_curr <= p_sampai LOOP
    IF public.sisa_stok(p_equipment_id, v_curr, v_curr) <= 0 THEN
      v_penuh := array_append(v_penuh, v_curr::TEXT);
    END IF;
    v_curr := v_curr + 1;
  END LOOP;
  RETURN v_penuh;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Buat Booking Baru dengan Validasi Stok Atomic
CREATE OR REPLACE FUNCTION public.create_booking(
  p_mulai DATE,
  p_selesai DATE,
  p_items JSONB,
  p_catatan TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_booking_id UUID;
  v_kode_booking TEXT;
  v_total_harga NUMERIC := 0;
  v_total_deposit NUMERIC := 0;
  v_dp_jumlah NUMERIC := 0;
  v_dp_persen NUMERIC := 30;
  v_days INT;
  v_item JSONB;
  v_eq_id INT;
  v_qty INT;
  v_harga_per_hari NUMERIC;
  v_harga_mingguan NUMERIC;
  v_deposit NUMERIC;
  v_stok_tersedia INT;
  v_unit_price NUMERIC;
  v_subtotal NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Pengguna harus terotentikasi untuk membuat pesanan booking.';
  END IF;

  IF p_selesai < p_mulai THEN
    RAISE EXCEPTION 'Tanggal selesai sewa tidak boleh lebih awal dari tanggal mulai.';
  END IF;

  v_days := (p_selesai - p_mulai) + 1;
  IF v_days < 1 THEN
    v_days := 1;
  END IF;

  -- Format kode booking: PK-YYMMDD-XXXX
  v_kode_booking := 'PK-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));

  -- Ambil persentase DP dari settings (default 30%)
  SELECT COALESCE(NULLIF(value, '')::NUMERIC, 30) INTO v_dp_persen
  FROM public.settings WHERE key = 'dp_persen';

  -- Loop pertama: Validasi ketersediaan stok seluruh item secara serentak
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_eq_id := (v_item->>'equipment_id')::INT;
    v_qty := (v_item->>'qty')::INT;

    SELECT harga_per_hari, harga_mingguan, deposit
    INTO v_harga_per_hari, v_harga_mingguan, v_deposit
    FROM public.equipment WHERE id = v_eq_id AND aktif = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Alat ID % tidak ditemukan atau sedang nonaktif.', v_eq_id;
    END IF;

    v_stok_tersedia := public.sisa_stok(v_eq_id, p_mulai, p_selesai);
    IF v_stok_tersedia < v_qty THEN
      RAISE EXCEPTION 'Stok alat ID % tidak mencukupi untuk rentang tanggal tersebut (sisa: %, diminta: %).', v_eq_id, v_stok_tersedia, v_qty;
    END IF;

    -- Hitung diskon mingguan jika >= 7 hari
    IF v_days >= 7 AND v_harga_mingguan IS NOT NULL AND v_harga_mingguan > 0 THEN
      v_unit_price := (FLOOR(v_days / 7) * v_harga_mingguan) + ((v_days % 7) * v_harga_per_hari);
    ELSE
      v_unit_price := v_days * v_harga_per_hari;
    END IF;

    v_subtotal := v_unit_price * v_qty;
    v_total_harga := v_total_harga + v_subtotal;
    v_total_deposit := v_total_deposit + (COALESCE(v_deposit, 0) * v_qty);
  END LOOP;

  v_dp_jumlah := ROUND((v_dp_persen / 100.0) * v_total_harga);

  -- Insert Booking
  INSERT INTO public.bookings (
    user_id,
    kode_booking,
    status,
    tanggal_mulai,
    tanggal_selesai,
    total_harga,
    deposit,
    dp_jumlah,
    catatan_penyewa
  ) VALUES (
    v_user_id,
    v_kode_booking,
    'menunggu_dp',
    p_mulai,
    p_selesai,
    v_total_harga,
    v_total_deposit,
    v_dp_jumlah,
    p_catatan
  ) RETURNING id INTO v_booking_id;

  -- Insert Booking Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_eq_id := (v_item->>'equipment_id')::INT;
    v_qty := (v_item->>'qty')::INT;

    SELECT harga_per_hari, harga_mingguan INTO v_harga_per_hari, v_harga_mingguan
    FROM public.equipment WHERE id = v_eq_id;

    IF v_days >= 7 AND v_harga_mingguan IS NOT NULL AND v_harga_mingguan > 0 THEN
      v_unit_price := (FLOOR(v_days / 7) * v_harga_mingguan) + ((v_days % 7) * v_harga_per_hari);
    ELSE
      v_unit_price := v_days * v_harga_per_hari;
    END IF;

    v_subtotal := v_unit_price * v_qty;

    INSERT INTO public.booking_items (
      booking_id,
      equipment_id,
      qty,
      harga_per_hari,
      subtotal
    ) VALUES (
      v_booking_id,
      v_eq_id,
      v_qty,
      v_harga_per_hari,
      v_subtotal
    );
  END LOOP;

  -- Catat Riwayat Status Pertama
  INSERT INTO public.booking_status_history (booking_id, status_lama, status_baru)
  VALUES (v_booking_id, NULL, 'menunggu_dp');

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Batalkan Booking
CREATE OR REPLACE FUNCTION public.batalkan_booking(
  p_booking_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_role TEXT;
  v_old_status public.booking_status;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;
  SELECT status INTO v_old_status FROM public.bookings WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data booking tidak ditemukan.';
  END IF;

  -- Penyewa hanya bisa membatalkan booking yang belum dibayar (menunggu_dp)
  IF v_role <> 'admin' THEN
    IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE id = p_booking_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'Akses ditolak: Anda bukan pemilik pesanan ini.';
    END IF;
    IF v_old_status NOT IN ('menunggu_dp') THEN
      RAISE EXCEPTION 'Booking yang telah diproses hanya dapat dibatalkan oleh pihak pengelola.';
    END IF;
  END IF;

  UPDATE public.bookings SET status = 'dibatalkan' WHERE id = p_booking_id;

  INSERT INTO public.booking_status_history (booking_id, status_lama, status_baru)
  VALUES (p_booking_id, v_old_status, 'dibatalkan');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Terima Pengembalian Unit (Admin)
CREATE OR REPLACE FUNCTION public.terima_pengembalian(
  p_booking_id UUID,
  p_tanggal TIMESTAMPTZ,
  p_catatan TEXT DEFAULT NULL,
  p_kerusakan JSONB DEFAULT '[]'::JSONB
)
RETURNS INT AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_role TEXT;
  v_return_id INT;
  v_booking public.bookings%ROWTYPE;
  v_denda_per_hari NUMERIC := 50000;
  v_hari_terlambat INT := 0;
  v_denda_terlambat NUMERIC := 0;
  v_total_ganti_rugi NUMERIC := 0;
  v_deposit_dikembalikan NUMERIC := 0;
  v_k JSONB;
  v_biaya NUMERIC;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_admin_id;
  IF v_role <> 'admin' THEN
    RAISE EXCEPTION 'Hanya admin yang berwenang memproses pengembalian alat.';
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Data booking tidak ditemukan.';
  END IF;

  SELECT COALESCE(NULLIF(value, '')::NUMERIC, 50000) INTO v_denda_per_hari
  FROM public.settings WHERE key = 'denda_per_hari';

  IF p_tanggal::DATE > v_booking.tanggal_selesai THEN
    v_hari_terlambat := (p_tanggal::DATE - v_booking.tanggal_selesai);
    v_denda_terlambat := v_hari_terlambat * v_denda_per_hari;
  END IF;

  FOR v_k IN SELECT * FROM jsonb_array_elements(p_kerusakan) LOOP
    v_biaya := (v_k->>'biaya_ganti_rugi')::NUMERIC;
    v_total_ganti_rugi := v_total_ganti_rugi + COALESCE(v_biaya, 0);
  END LOOP;

  v_deposit_dikembalikan := GREATEST(0, v_booking.deposit - (v_denda_terlambat + v_total_ganti_rugi));

  INSERT INTO public.booking_returns (
    booking_id,
    tanggal_dikembalikan,
    hari_terlambat,
    denda_terlambat,
    total_ganti_rugi,
    deposit_dikembalikan,
    catatan
  ) VALUES (
    p_booking_id,
    p_tanggal,
    v_hari_terlambat,
    v_denda_terlambat,
    v_total_ganti_rugi,
    v_deposit_dikembalikan,
    p_catatan
  ) RETURNING id INTO v_return_id;

  -- Simpan laporan kerusakan jika ada
  FOR v_k IN SELECT * FROM jsonb_array_elements(p_kerusakan) LOOP
    INSERT INTO public.damage_reports (
      booking_item_id,
      return_id,
      jenis,
      jumlah,
      deskripsi,
      biaya_ganti_rugi,
      foto_url
    ) VALUES (
      (v_k->>'booking_item_id')::INT,
      v_return_id,
      (v_k->>'jenis')::public.damage_jenis,
      (v_k->>'jumlah')::INT,
      (v_k->>'deskripsi')::TEXT,
      (v_k->>'biaya_ganti_rugi')::NUMERIC,
      (v_k->>'foto_url')::TEXT
    );
  END LOOP;

  IF v_total_ganti_rugi > 0 OR v_denda_terlambat > 0 THEN
    UPDATE public.bookings SET status = 'bermasalah' WHERE id = p_booking_id;
    INSERT INTO public.booking_status_history (booking_id, status_lama, status_baru)
    VALUES (p_booking_id, v_booking.status, 'bermasalah');
  ELSE
    UPDATE public.bookings SET status = 'selesai' WHERE id = p_booking_id;
    INSERT INTO public.booking_status_history (booking_id, status_lama, status_baru)
    VALUES (p_booking_id, v_booking.status, 'selesai');
  END IF;

  RETURN v_return_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Tandai Otomatis Booking Terlambat
CREATE OR REPLACE FUNCTION public.tandai_terlambat()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
BEGIN
  WITH updated AS (
    UPDATE public.bookings
    SET status = 'terlambat'
    WHERE status = 'diambil'
      AND tanggal_selesai < CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM updated;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. STORAGE BUCKETS & POLICIES SETUP
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('equipment-images', 'equipment-images', true),
  ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies: equipment-images
DROP POLICY IF EXISTS "Public Read Equipment Images Storage" ON storage.objects;
CREATE POLICY "Public Read Equipment Images Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'equipment-images');

DROP POLICY IF EXISTS "Auth Manage Equipment Images Storage" ON storage.objects;
CREATE POLICY "Auth Manage Equipment Images Storage"
ON storage.objects FOR ALL
USING (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');

-- Storage Policies: payment-proofs
DROP POLICY IF EXISTS "Public Read Payment Proofs Storage" ON storage.objects;
CREATE POLICY "Public Read Payment Proofs Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Auth Upload Payment Proofs Storage" ON storage.objects;
CREATE POLICY "Auth Upload Payment Proofs Storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Manage Payment Proofs Storage" ON storage.objects;
CREATE POLICY "Auth Manage Payment Proofs Storage"
ON storage.objects FOR ALL
USING (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');
