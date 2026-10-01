import { createClient } from "@/lib/supabase/server";
import { AnimatedText } from "@/components/ui/motion";
import { getCategoryIcon, getCategoryDescription } from "@/lib/constants";
import type { Category } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  let categories: Category[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("urutan", { ascending: true });

    if (data) {
      categories = data as Category[];
    }
  } catch (err) {
    console.error("Gagal memuat kategori admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <AnimatedText
          text="KELOLA KATEGORI ALAT"
          mode="word"
          as="h1"
          className="section-title block"
        />
        <p className="text-sm text-[#5F7A84] font-medium">
          Daftar klasifikasi kategori perlengkapan sewa yang ditampilkan di beranda dan navigasi website.
        </p>
      </div>

      {/* Tabel dalam Kartu Putih */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
            Kategori Terdaftar ({categories.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Urutan</th>
                <th className="py-3 px-4">Ikon</th>
                <th className="py-3 px-4">Nama Kategori</th>
                <th className="py-3 px-4">Slug URL</th>
                <th className="py-3 px-4">Deskripsi Singkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {categories.length > 0 ? (
                categories.map((cat) => {
                  const IconComp = getCategoryIcon(cat.ikon);
                  const desc = getCategoryDescription(cat.slug);
                  return (
                    <tr key={cat.id} className="hover:bg-[#F3F3EF]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#5F7A84]">
                        {cat.urutan}
                      </td>
                      <td className="py-3.5 px-4 text-[#234E5C]">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3F3EF]">
                          <IconComp className="h-4 w-4" />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#2E5E4E]">
                        {cat.nama}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#5F7A84]">
                        /kategori/{cat.slug}
                      </td>
                      <td className="py-3.5 px-4 text-[#5F7A84] max-w-sm">
                        {desc}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5F7A84]">
                    Belum ada kategori tersimpan di database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
