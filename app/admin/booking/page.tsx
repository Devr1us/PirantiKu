import { createClient } from "@/lib/supabase/server";
import { formatRupiah, formatDateIndo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { AnimatedText } from "@/components/ui/motion";
import type { Booking } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  let bookings: Booking[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      bookings = data as Booking[];
    }
  } catch (err) {
    console.error("Gagal memuat data booking admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <AnimatedText
          text="KELOLA BOOKING PELANGGAN"
          mode="word"
          as="h1"
          className="section-title block"
        />
        <p className="text-sm text-[#5F7A84] font-medium">
          Daftar seluruh pesanan rental, verifikasi pembayaran uang muka (DP), dan pencatatan status peminjaman.
        </p>
      </div>

      {/* Tabel dalam Kartu Putih */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84]">
            Seluruh Transaksi Booking ({bookings.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Kode Booking</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Sewa</th>
                <th className="py-3 px-4">Total Biaya</th>
                <th className="py-3 px-4">DP 30%</th>
                <th className="py-3 px-4">Catatan Penyewa</th>
                <th className="py-3 px-4">Dibuat Pada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {bookings.length > 0 ? (
                bookings.map((b) => (
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
                    <td className="py-3.5 px-4 text-[#5F7A84] max-w-xs truncate">
                      {b.catatan_penyewa || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-[#5F7A84]">
                      {formatDateIndo(b.created_at, "d MMM yyyy")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5F7A84]">
                    Belum ada data booking tercatat di sistem.
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
