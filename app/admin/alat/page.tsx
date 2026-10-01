import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/format";
import { AnimatedText } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import type { EquipmentWithDetails } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminEquipmentPage() {
  let equipment: EquipmentWithDetails[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("equipment")
      .select(`
        *,
        category:categories(*)
      `)
      .order("created_at", { ascending: false });

    if (data) {
      equipment = data as EquipmentWithDetails[];
    }
  } catch (err) {
    console.error("Gagal memuat data alat admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <AnimatedText
            text="KELOLA ALAT & STOK"
            mode="word"
            as="h1"
            className="section-title block"
          />
          <p className="text-sm text-[#5F7A84] font-medium">
            Daftar seluruh perlengkapan, pemantauan unit tersedia, dan status aktif inventaris.
          </p>
        </div>

        <Link href="/alat">
          <Button variant="warm" size="sm" className="text-xs font-bold">
            Lihat di Katalog
          </Button>
        </Link>
      </div>

      {/* Tabel dalam Kartu Putih */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
            Inventaris Peralatan ({equipment.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Nama Alat</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga / Hari</th>
                <th className="py-3 px-4">Deposit</th>
                <th className="py-3 px-4">Stok Bersih</th>
                <th className="py-3 px-4">Stok Rusak</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {equipment.length > 0 ? (
                equipment.map((item) => {
                  const bersih = Math.max(0, (item.stok || 0) - (item.stok_rusak || 0));
                  return (
                    <tr key={item.id} className="hover:bg-[#F3F3EF]/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[#234E5C]">
                        <Link href={`/alat/${item.slug}`} className="hover:underline hover:text-[#A0630F]">
                          {item.nama}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#5F7A84]">
                        {item.category?.nama || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#A0630F]">
                        {formatRupiah(item.harga_per_hari)}
                      </td>
                      <td className="py-3.5 px-4 text-[#5F7A84]">
                        {formatRupiah(item.deposit)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#2E5E4E]">
                        {bersih} unit
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#991B1B]">
                        {item.stok_rusak || 0} unit
                      </td>
                      <td className="py-3.5 px-4">
                        {item.aktif ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
                            Non-aktif
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5F7A84]">
                    Belum ada data peralatan di database.
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
