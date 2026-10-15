import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { H1, Lead } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { AdminEquipmentManager } from "@/components/admin/equipment/admin-equipment-manager";
import type { EquipmentWithDetails, Category } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Alat & Inventaris | Admin PirantiKu",
  description: "Kelola data perlengkapan sewa, harga, stok unit, dan foto produk.",
};

export default async function AdminEquipmentPage() {
  let equipment: EquipmentWithDetails[] = [];
  let categories: Category[] = [];

  try {
    const supabase = await createClient();

    // 1. Ambil data perlengkapan lengkap dengan kategori dan gambar
    const { data: eqData, error: eqErr } = await supabase
      .from("equipment")
      .select(`
        *,
        category:categories(*),
        images:equipment_images(*)
      `)
      .order("created_at", { ascending: false });

    if (!eqErr && eqData) {
      equipment = eqData as EquipmentWithDetails[];
    }

    // 2. Ambil daftar kategori untuk dropdown form
    const { data: catData, error: catErr } = await supabase
      .from("categories")
      .select("*")
      .order("urutan", { ascending: true });

    if (!catErr && catData) {
      categories = catData as Category[];
    }
  } catch (err) {
    console.error("Gagal memuat data alat admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <H1 mode="word" className="section-title block">
            KELOLA ALAT & STOK INVENTARIS
          </H1>
          <Lead className="text-sm text-[#5F7A84] font-medium">
            Tambah perlengkapan baru, ubah harga dan stok unit, pantau unit rusak, dan kelola foto produk.
          </Lead>
        </div>

        <Link href="/alat" target="_blank">
          <Button variant="outline" size="sm" className="text-xs font-bold border-[#E8E8E1] text-[#234E5C]">
            Buka Katalog Publik
          </Button>
        </Link>
      </div>

      {/* Komponen CRUD Interaktif */}
      <AdminEquipmentManager
        initialEquipment={equipment}
        categories={categories}
      />
    </div>
  );
}
