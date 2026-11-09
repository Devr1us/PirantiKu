-- ========================================================
-- PIRANTIKU - Perbaikan Sisa Stok Real-time & Hapus Overload Bentrok
-- File: supabase/migrations/03_fix_stock_and_overloads.sql
-- ========================================================

-- 1. Hapus fungsi overload sisa_stok & tanggal_penuh yang bentrok (PGRST203)
DROP FUNCTION IF EXISTS public.sisa_stok(bigint, date, date);
DROP FUNCTION IF EXISTS public.sisa_stok(integer, date, date);
DROP FUNCTION IF EXISTS public.tanggal_penuh(bigint, date, date);
DROP FUNCTION IF EXISTS public.tanggal_penuh(integer, date, date);

-- 2. Buat ulang fungsi sisa_stok standar (SECURITY DEFINER agar bisa diakses publik secara aman)
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
  -- (status diambil / sedang digunakan, terlambat, dp_dibayar, lunas)
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

-- 3. Buat ulang fungsi tanggal_penuh
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

-- 4. Fungsi cepat untuk mengambil rekap sisa stok seluruh katalog dalam 1 query
CREATE OR REPLACE FUNCTION public.get_all_equipment_stock(
  p_tanggal DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  equipment_id INT,
  stok_total INT,
  stok_rusak INT,
  stok_disewa INT,
  sisa_stok INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS equipment_id,
    COALESCE(e.stok, 0) AS stok_total,
    COALESCE(e.stok_rusak, 0) AS stok_rusak,
    COALESCE(SUM(
      CASE 
        WHEN b.status IN ('diambil', 'terlambat') OR 
             (b.status IN ('dp_dibayar', 'lunas') AND p_tanggal BETWEEN b.tanggal_mulai AND b.tanggal_selesai)
        THEN bi.qty 
        ELSE 0 
      END
    ), 0)::INT AS stok_disewa,
    GREATEST(0, (COALESCE(e.stok, 0) - COALESCE(e.stok_rusak, 0) - COALESCE(SUM(
      CASE 
        WHEN b.status IN ('diambil', 'terlambat') OR 
             (b.status IN ('dp_dibayar', 'lunas') AND p_tanggal BETWEEN b.tanggal_mulai AND b.tanggal_selesai)
        THEN bi.qty 
        ELSE 0 
      END
    ), 0)))::INT AS sisa_stok
  FROM public.equipment e
  LEFT JOIN public.booking_items bi ON bi.equipment_id = e.id
  LEFT JOIN public.bookings b ON b.id = bi.booking_id AND b.status IN ('dp_dibayar', 'lunas', 'diambil', 'terlambat')
  WHERE e.aktif = true
  GROUP BY e.id, e.stok, e.stok_rusak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Berikan izin SELECT publik pada booking_items agar agregasi sisa stok katalog selalu akurat
DROP POLICY IF EXISTS "Public Read Booking Items Count" ON public.booking_items;
CREATE POLICY "Public Read Booking Items Count" ON public.booking_items
FOR SELECT USING (true);

