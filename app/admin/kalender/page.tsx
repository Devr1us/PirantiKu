import { createClient } from "@/lib/supabase/server";
import { formatDateIndo } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { H1, Lead } from "@/components/ui/typography";
import { Calendar, Package } from "lucide-react";
import type { Booking, BookingItem, EquipmentItem } from "@/types/database";

type BookingWithItems = Booking & {
  items: (BookingItem & { equipment?: EquipmentItem | null })[];
};

export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  let activeBookings: BookingWithItems[] = [];

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        items:booking_items(*, equipment:equipment(*))
      `)
      .gte("tanggal_selesai", today)
      .neq("status", "dibatalkan")
      .order("tanggal_mulai", { ascending: true })
      .limit(15);

    if (data) {
      activeBookings = data as BookingWithItems[];
    }
  } catch (err) {
    console.error("Gagal memuat jadwal kalender:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <H1 mode="word" className="section-title block">
          KALENDER RENTAL
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Pantau jadwal masa sewa yang sedang aktif dan agenda pengembalian peralatan mendatang.
        </Lead>
      </div>

      {/* Tabel Jadwal Sewa Aktif dalam Kartu Putih */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E8E1] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5F7A84] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#234E5C]" />
            Jadwal Sewa Aktif & Mendatang ({activeBookings.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4">Kode Booking</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Mulai</th>
                <th className="py-3 px-4">Batas Kembali</th>
                <th className="py-3 px-4">Alat yang Sedang Disewa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {activeBookings.length > 0 ? (
                activeBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F3F3EF]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#234E5C]">
                      {b.kode_booking}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#234E5C]">
                      {formatDateIndo(b.tanggal_mulai, "d MMMM yyyy")}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#A0630F]">
                      {formatDateIndo(b.tanggal_selesai, "d MMMM yyyy")}
                    </td>
                    <td className="py-3.5 px-4 text-[#5F7A84]">
                      <div className="flex flex-wrap gap-1.5">
                        {b.items?.map((item) => (
                          <span
                            key={item.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F3F3EF] border border-[#E8E8E1] text-[11px] font-semibold text-[#234E5C]"
                          >
                            <Package className="h-3 w-3" />
                            {item.equipment?.nama || "Alat"} ({item.qty}x)
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#5F7A84]">
                    Tidak ada jadwal sewa aktif yang tercatat saat ini.
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
