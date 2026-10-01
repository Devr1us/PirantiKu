import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AnimatedText, CountUp } from "@/components/ui/motion";
import type { Booking } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  let totalEquipment = 0;
  let totalAvailableUnits = 0;
  let totalBookings = 0;
  let totalCategories = 0;
  let recentBookings: Booking[] = [];

  try {
    const supabase = await createClient();

    // 1. Hitung total alat & unit
    const { data: eqData } = await supabase
      .from("equipment")
      .select("stok, stok_rusak")
      .eq("aktif", true);

    if (eqData) {
      totalEquipment = eqData.length;
      totalAvailableUnits = eqData.reduce(
        (sum, item) => sum + Math.max(0, (item.stok || 0) - (item.stok_rusak || 0)),
        0
      );
    }

    // 2. Hitung total kategori
    const { count: catCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    if (catCount !== null) {
      totalCategories = catCount;
    }

    // 3. Ambil booking terbaru & jumlah booking
    const { data: bData, count: bCount } = await supabase
      .from("bookings")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(6);

    if (bCount !== null) {
      totalBookings = bCount;
    }
    if (bData) {
      recentBookings = bData as Booking[];
    }
  } catch (err) {
    console.error("Gagal memuat ringkasan admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <AnimatedText
          text="DASHBOARD PENGELOLA"
          mode="word"
          as="h1"
          className="section-title block"
        />
        <p className="text-sm text-[#5F7A84] font-medium">
          Ringkasan inventaris peralatan, ketersediaan unit, dan transaksi booking pelanggan PirantiKu.
        </p>
      </div>

      {/* Kartu Statistik Sederhana Tanpa Gradasi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
            Jenis Alat Aktif
          </span>
          <div className="text-3xl font-extrabold text-[#234E5C]">
            <CountUp value={totalEquipment} />
          </div>
          <p className="text-[11px] text-[#5F7A84]">Katalog terpublikasi</p>
        </div>

        <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
            Unit Siap Sewa
          </span>
          <div className="text-3xl font-extrabold text-[#234E5C]">
            <CountUp value={totalAvailableUnits} />
          </div>
          <p className="text-[11px] text-[#5F7A84]">Total stok fisik bersih</p>
        </div>

        <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
            Total Transaksi
          </span>
          <div className="text-3xl font-extrabold text-[#A0630F]">
            <CountUp value={totalBookings} />
          </div>
          <p className="text-[11px] text-[#5F7A84]">Pesanan sewa masuk</p>
        </div>

        <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
            Kategori Alat
          </span>
          <div className="text-3xl font-extrabold text-[#2E5E4E]">
            <CountUp value={totalCategories} />
          </div>
          <p className="text-[11px] text-[#5F7A84]">Klasifikasi inventaris</p>
        </div>
      </div>

      {/* Tabel dalam Kartu Putih: Transaksi Booking Terbaru */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#234E5C]">
              Transaksi Booking Terbaru
            </h2>
            <p className="text-xs text-[#5F7A84] mt-0.5">
              Daftar pesanan sewa pelanggan yang masuk ke dalam sistem
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Kode Booking</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Jadwal Sewa</th>
                <th className="py-3 px-4">Total Biaya</th>
                <th className="py-3 px-4">Uang Muka (DP)</th>
                <th className="py-3 px-4">Tanggal Pesan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {recentBookings.length > 0 ? (
                recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F3F3EF]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#234E5C]">
                      {b.kode_booking}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#5F7A84]">
                      {formatDateIndo(b.tanggal_mulai, "d MMM")} &rarr; {formatDateIndo(b.tanggal_selesai, "d MMM yyyy")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#234E5C]">
                      {formatRupiah(b.total_harga)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#A0630F]">
                      {formatRupiah(b.dp_jumlah)}
                    </td>
                    <td className="py-3.5 px-4 text-[#5F7A84]">
                      {formatDateIndo(b.created_at, "d MMM yyyy")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5F7A84]">
                    Belum ada data transaksi booking tercatat.
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
