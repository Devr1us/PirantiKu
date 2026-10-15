import { createClient } from "@/lib/supabase/server";
import { H1, Lead } from "@/components/ui/typography";
import { AdminCategoryManager, type CategoryWithCount } from "@/components/admin/categories/admin-category-manager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Kategori Alat | Admin PirantiKu",
  description: "Kelola klasifikasi kategori alat sewa, urutan tampilan di beranda, dan ikon.",
};

export default async function AdminCategoriesPage() {
  let categories: CategoryWithCount[] = [];

  try {
    const supabase = await createClient();

    // 1. Ambil seluruh kategori berurutan
    const { data: catData, error: catErr } = await supabase
      .from("categories")
      .select("*")
      .order("urutan", { ascending: true });

    // 2. Ambil seluruh equipment untuk menghitung jumlah alat per category_id
    const { data: eqData } = await supabase
      .from("equipment")
      .select("category_id");

    const countMap: Record<number, number> = {};
    if (eqData) {
      eqData.forEach((eq) => {
        if (eq.category_id) {
          countMap[eq.category_id] = (countMap[eq.category_id] || 0) + 1;
        }
      });
    }

    if (!catErr && catData) {
      categories = catData.map((c) => ({
        ...c,
        equipment_count: countMap[c.id] || 0,
      }));
    }
  } catch (err) {
    console.error("Gagal memuat kategori admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <H1 mode="word" className="section-title block">
          KELOLA KATEGORI ALAT
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Daftar klasifikasi kategori perlengkapan sewa yang ditampilkan di beranda dan navigasi website.
        </Lead>
      </div>

      {/* Komponen CRUD Interaktif Kategori */}
      <AdminCategoryManager initialCategories={categories} />
    </div>
  );
}
