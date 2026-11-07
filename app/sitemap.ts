import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// Daftar kategori fallback jika database offline saat proses build
const FALLBACK_CATEGORIES = [
  "outdoor-pendakian",
  "konstruksi-perkakas",
  "olahraga-fitness",
  "rumah-tangga",
  "pesta-acara",
  "kamera-elektronik",
  "otomotif-bengkel",
  "kesehatan-mobilitas",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pirantiku.id";
  const now = new Date();

  // 1. Rute Statis Utama
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/alat`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Inisialisasi Supabase Client publik (tanpa cookies agar aman di sitemap)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let equipmentRoutes: MetadataRoute.Sitemap = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // 2. Fetch Kategori
      const { data: categories } = await supabase
        .from("categories")
        .select("slug, updated_at");

      if (categories && categories.length > 0) {
        categoryRoutes = categories.map((cat) => ({
          url: `${baseUrl}/kategori/${cat.slug}`,
          lastModified: cat.updated_at ? new Date(cat.updated_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
      }

      // 3. Fetch Alat Aktif
      const { data: equipmentList } = await supabase
        .from("equipment")
        .select("slug, updated_at")
        .eq("is_aktif", true);

      if (equipmentList && equipmentList.length > 0) {
        equipmentRoutes = equipmentList.map((eq) => ({
          url: `${baseUrl}/alat/${eq.slug}`,
          lastModified: eq.updated_at ? new Date(eq.updated_at) : now,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }));
      }
    } catch {
      // Fallback jika database tidak dapat dijangkau
    }
  }

  // Gunakan fallback jika kategori dari DB kosong
  if (categoryRoutes.length === 0) {
    categoryRoutes = FALLBACK_CATEGORIES.map((slug) => ({
      url: `${baseUrl}/kategori/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...categoryRoutes, ...equipmentRoutes];
}

