import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { H1, Lead } from "@/components/ui/typography";
import { CountUp, Reveal } from "@/components/ui/motion";
import { Button } from "@/components/ui/button";
import { fetchRentedUnitsSummary } from "@/lib/inventory";
import type { Booking, Profile, Payment } from "@/types/database";

export const dynamic = "force-dynamic";

type DashboardBookingWithDetails = Booking & {
  profile?: Profile | null;
  payments?: Payment[];
};

export default async function AdminDashboardPage() {
  let totalEquipment = 0;
  let totalAvailableUnits = 0;
  let totalRentedUnits = 0;
  let totalBookings = 0;
  let totalCategories = 0;
  let recentBookings: DashboardBookingWithDetails[] = [];

  try {
    const supabase = await createClient();

    // 1. Ambil rekap unit yang sedang disewa
    const rentedMap = await fetchRentedUnitsSummary(supabase);
    totalRentedUnits = Object.values(rentedMap).reduce((a, b) => a + b, 0);

    // 2. Hitung total jenis alat & unit fisik bersih
    const { data: eqData } = await supabase
      .from("equipment")
      .select("stok, stok_rusak")
      .eq("aktif", true);

    if (eqData) {
      totalEquipment = eqData.length;
      const physicalCleanTotal = eqData.reduce(
        (sum, item) => sum + Math.max(0, (item.stok || 0) - (item.stok_rusak || 0)),
        0
      );
      totalAvailableUnits = Math.max(0, physicalCleanTotal - totalRentedUnits);
    }

    // 3. Hitung total kategori
    const { count: catCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });

    if (catCount !== null) {
      totalCategories = catCount;
    }

    // 4. Ambil seluruh booking dengan profil penyewa dan pembayaran (sinkron 100% dengan Kelola Booking)
    const { data: bData, count: bCount } = await supabase
      .from("bookings")
      .select(`
        *,
        profile:profiles(*),
        payments(*)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (bCount !== null) {
      totalBookings = bCount;
    }
    if (bData) {
      recentBookings = bData as DashboardBookingWithDetails[];
    }
  } catch (err) {
    console.error("Gagal memuat ringkasan admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <H1 mode="word" className="section-title block">
            DASHBOARD PENGELOLA
          </H1>
          <Lead className="text-sm text-[#5F7A84] font-medium">
            Ringkasan inventaris peralatan, ketersediaan unit, dan transaksi booking pelanggan PirantiKu.
          </Lead>
        </div>

        <Link href="/admin/booking">
          <Button variant="warm" size="sm" className="text-xs font-bold gap-1.5 shadow-sm">
            <span>Buka Kelola Booking</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Kartu Statistik Sederhana */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Reveal delay={0.05}>
          <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Jenis Alat Aktif
            </span>
            <div className="text-3xl font-extrabold text-[#234E5C]">
              <CountUp value={totalEquipment} />
            </div>
            <p className="text-[11px] text-[#5F7A84]">Katalog terpublikasi</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Unit Siap Sewa
            </span>
            <div className="text-3xl font-extrabold text-[#234E5C]">
              <CountUp value={totalAvailableUnits} />
            </div>
            <p className="text-[11px] text-[#5F7A84]">
              {totalRentedUnits > 0
                ? `${totalRentedUnits} unit sedang disewa`
                : "Semua unit siap di gudang"}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Total Transaksi
            </span>
            <div className="text-3xl font-extrabold text-[#A0630F]">
              <CountUp value={totalBookings} />
            </div>
            <p className="text-[11px] text-[#5F7A84]">Pesanan sewa masuk</p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="rounded-xl border border-[#E8E8E1] bg-white p-5 space-y-1 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
              Kategori Alat
            </span>
            <div className="text-3xl font-extrabold text-[#2E5E4E]">
              <CountUp value={totalCategories} />
            </div>
            <p className="text-[11px] text-[#5F7A84]">Klasifikasi inventaris</p>
          </div>
        </Reveal>
      </div>

      {/* Tabel dalam Kartu Putih: Daftar Booking Pelanggan (Sinkron 100% dengan Kelola Booking) */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E8E1] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#234E5C]">
                Transaksi Booking Pelanggan
              </h2>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EBF8FF] text-[#2B6CB0]">
                {recentBookings.length} Pesanan
              </span>
            </div>
            <p className="text-xs text-[#5F7A84] mt-0.5">
              Daftar seluruh pesanan sewa pelanggan yang sinkron dengan data di Kelola Booking
            </p>
          </div>

          <Link href="/admin/booking">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-bold gap-1.5 border-[#E8E8E1] text-[#234E5C] hover:bg-[#F3F3EF]"
            >
              <span>Verifikasi & Kelola di Menu Booking</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#A0630F]" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Kode</th>
                <th className="py-3 px-4">Penyewa</th>
                <th className="py-3 px-4">Status Booking</th>
                <th className="py-3 px-4">Status Pembayaran</th>
                <th className="py-3 px-4">Jadwal Sewa</th>
                <th className="py-3 px-4">Total Biaya & DP</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {recentBookings.length > 0 ? (
                recentBookings.map((b) => {
                  const dpPayment = b.payments?.find((p) => p.jenis === "dp");
                  return (
                    <tr key={b.id} className="hover:bg-[#F3F3EF]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#234E5C]">
                        {b.kode_booking}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#234E5C] block">
                          {b.profile?.nama || "Penyewa"}
                        </span>
                        <span className="text-[11px] text-[#5F7A84]">
                          {b.profile?.no_hp || "-"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {dpPayment ? (
                          dpPayment.status === "menunggu_verifikasi" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#78350F] border border-[#FDE68A]">
                              <Clock className="h-3 w-3 text-[#A0630F]" />
                              Perlu Cek Bukti
                            </span>
                          ) : dpPayment.status === "terverifikasi" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
                              <CheckCircle2 className="h-3 w-3" />
                              DP Terverifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]">
                              <XCircle className="h-3 w-3" />
                              Ditolak
                            </span>
                          )
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F3EF] text-[#5F7A84]">
                            Belum Ada Bukti
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#5F7A84]">
                        {formatDateIndo(b.tanggal_mulai, "d MMM")} &rarr;{" "}
                        {formatDateIndo(b.tanggal_selesai, "d MMM yyyy")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#234E5C] block">
                          {formatRupiah(b.total_harga)}
                        </span>
                        <span className="text-[11px] font-semibold text-[#A0630F]">
                          DP: {formatRupiah(b.dp_jumlah)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/booking?q=${b.kode_booking}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold gap-1 h-8 px-3 border-[#E8E8E1] text-[#234E5C]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Detail</span>
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5F7A84]">
                    Belum ada pesanan booking sewa yang tercatat.
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
