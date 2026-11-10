-- ========================================================
-- PIRANTIKU - SETUP STORAGE BUCKET PAYMENT-PROOFS
-- File: supabase/migrations/04_setup_payment_proofs_bucket.sql
-- ========================================================

-- 1. Buat bucket payment-proofs sebagai public bucket (atau update jika sudah ada)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policy: Izinkan siapa pun (publik & admin) melihat gambar bukti pembayaran
DROP POLICY IF EXISTS "Public Read Payment Proofs Storage" ON storage.objects;
CREATE POLICY "Public Read Payment Proofs Storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- 3. Policy: Izinkan pengguna yang sudah login mengunggah bukti transfer
DROP POLICY IF EXISTS "Auth Upload Payment Proofs Storage" ON storage.objects;
CREATE POLICY "Auth Upload Payment Proofs Storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- 4. Policy: Izinkan pengguna mengelola / update bukti transfer miliknya
DROP POLICY IF EXISTS "Auth Manage Payment Proofs Storage" ON storage.objects;
CREATE POLICY "Auth Manage Payment Proofs Storage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'payment-proofs');
