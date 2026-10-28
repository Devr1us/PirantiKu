-- ========================================================
-- PIRANTIKU - Seed Images for Equipment Catalog (57 Items)
-- File: supabase/migrations/02_seed_equipment_images.sql
-- ========================================================

-- Bersihkan data gambar sebelumnya jika ingin re-seed
-- TRUNCATE TABLE public.equipment_images;

INSERT INTO public.equipment_images (equipment_id, url, urutan, is_utama) VALUES
-- 1. Outdoor & Pendakian
(1, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80', 1, true), -- Tenda Dome 4 Orang
(2, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80', 1, true), -- Carrier 60 Liter
(3, 'https://images.unsplash.com/photo-1520038410233-7141be7e6f97?auto=format&fit=crop&w=800&q=80', 1, true), -- Sleeping Bag
(4, 'https://images.unsplash.com/photo-1470246973918-29a93221c455?auto=format&fit=crop&w=800&q=80', 1, true), -- Kompor Portable + Nesting
(23, 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80', 1, true), -- Trekking Pole
(24, 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80', 1, true), -- Headlamp LED
(25, 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80', 1, true), -- Hammock Camping
(26, 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=800&q=80', 1, true), -- Kursi Camping Lipat

-- 2. Konstruksi & Perkakas
(5, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80', 1, true), -- Gerinda Tangan
(6, 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=800&q=80', 1, true), -- Bor Listrik
(7, 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=800&q=80', 1, true), -- Cangkul
(8, 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80', 1, true), -- Sekop
(9, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80', 1, true), -- Tangga Lipat 4 Meter
(27, 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80', 1, true), -- Mesin Las Inverter
(28, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 1, true), -- Bor Beton Rotary Hammer
(29, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80', 1, true), -- Gergaji Circular
(30, 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80', 1, true), -- Gerobak Dorong

-- 3. Olahraga & Fitness
(10, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80', 1, true), -- Sepeda Gunung
(11, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80', 1, true), -- Matras Yoga
(12, 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80', 1, true), -- Set Dumbbell Adjustable
(13, 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=800&q=80', 1, true), -- Net Voli + Tiang
(31, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80', 1, true), -- Sepeda Lipat
(32, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80', 1, true), -- Set Badminton Portable
(33, 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80', 1, true), -- Resistance Band Set
(34, 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80', 1, true), -- Bola Basket

-- 4. Rumah Tangga & Kebersihan
(14, 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80', 1, true), -- Vacuum Cleaner
(15, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80', 1, true), -- Steam Cleaner
(16, 'https://images.unsplash.com/photo-1592417817098-8f3d69104a47?auto=format&fit=crop&w=800&q=80', 1, true), -- Mesin Potong Rumput
(17, 'https://images.unsplash.com/photo-1585842378054-ee2e52f94ba2?auto=format&fit=crop&w=800&q=80', 1, true), -- Pompa Air
(35, 'https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=800&q=80', 1, true), -- Kipas Angin Standing
(36, 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=800&q=80', 1, true), -- Mesin Cuci Portable
(37, 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=800&q=80', 1, true), -- Steamer Garmen
(38, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=800&q=80', 1, true), -- Dispenser Air Galon

-- 5. Pesta & Acara
(18, 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80', 1, true), -- Tenda Event 3x3
(19, 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=800&q=80', 1, true), -- Kursi Lipat
(20, 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80', 1, true), -- Meja Lipat
(21, 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80', 1, true), -- Sound System Portable
(22, 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80', 1, true), -- Proyektor
(39, 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80', 1, true), -- Genset Portable 1000W
(40, 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80', 1, true), -- Lampu Sorot LED
(41, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80', 1, true), -- Backdrop Stand
(42, 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80', 1, true), -- Chafing Dish

-- 6. Kamera & Elektronik
(43, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', 1, true), -- Kamera Mirrorless
(44, 'https://images.unsplash.com/photo-1508898578281-774ac4893c0c?auto=format&fit=crop&w=800&q=80', 1, true), -- Tripod Profesional
(45, 'https://images.unsplash.com/photo-1586882829491-b81178aa622e?auto=format&fit=crop&w=800&q=80', 1, true), -- Ring Light + Stand
(46, 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?auto=format&fit=crop&w=800&q=80', 1, true), -- Gimbal Smartphone
(47, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80', 1, true), -- Action Cam 4K

-- 7. Otomotif & Bengkel
(48, 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80', 1, true), -- Dongkrak Buaya 2 Ton
(49, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 1, true), -- Kompresor Udara 24L
(50, 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=800&q=80', 1, true), -- Toolbox Kunci 108 Pcs
(51, 'https://images.unsplash.com/photo-1558441719-7589d81d4a02?auto=format&fit=crop&w=800&q=80', 1, true), -- Kabel Jumper Aki
(52, 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80', 1, true), -- Jet Cleaner Cuci Kendaraan

-- 8. Kesehatan & Mobilitas
(53, 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=800&q=80', 1, true), -- Kursi Roda Lipat
(54, 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 1, true), -- Walker Lansia
(55, 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=800&q=80', 1, true), -- Kruk Ketiak
(56, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80', 1, true), -- Tensimeter Digital
(57, 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=800&q=80', 1, true)  -- Kasur Anti Dekubitus
ON CONFLICT DO NOTHING;
