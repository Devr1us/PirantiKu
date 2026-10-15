import { createClient } from "@/lib/supabase/server";
import { H1, Lead } from "@/components/ui/typography";
import { AdminBookingManager, type AdminBookingWithDetails } from "@/components/admin/booking/admin-booking-manager";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  let bookings: AdminBookingWithDetails[] = [];
  let dendaPerHari = 50000;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        items:booking_items(*, equipment:equipment(*)),
        payments(*),
        profile:profiles(*),
        returns:booking_returns(*, damage_reports(*))
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      bookings = data as AdminBookingWithDetails[];
    }

    const { data: dendaSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "denda_per_hari")
      .maybeSingle();

    if (dendaSetting?.value) {
      const val = Number(dendaSetting.value);
      if (!isNaN(val) && val > 0) dendaPerHari = val;
    }
  } catch (err) {
    console.error("Gagal memuat data booking admin:", err);
  }

  return (
    <div className="space-y-8">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="border-b border-[#E8E8E1] pb-5 space-y-1.5">
        <H1 mode="word" className="section-title block">
          KELOLA BOOKING & VERIFIKASI PEMBAYARAN
        </H1>
        <Lead className="text-sm text-[#5F7A84] font-medium">
          Tinjau bukti transfer uang muka (DP), verifikasi pembayaran, dan perbarui status operasional peminjaman alat.
        </Lead>
      </div>

      {/* Komponen Pengelola Booking Interaktif */}
      <AdminBookingManager initialBookings={bookings} dendaPerHari={dendaPerHari} />
    </div>
  );
}

