import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth, logAdminAction, logBookingStatusHistory } from "@/lib/finance-server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, alasan } = body;

    if (!bookingId || !alasan || !alasan.trim()) {
      return NextResponse.json(
        { error: "Booking ID dan alasan tertulis override penyerahan alat wajib diisi." },
        { status: 400 }
      );
    }

    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, kode_booking, status")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const reasonText = alasan.trim();

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: "diambil",
        tanggal_diambil: now,
        pesan_admin: `Alat diserahkan (Override Admin): ${reasonText}`,
      })
      .eq("id", bookingId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await logBookingStatusHistory(supabase, {
      bookingId,
      statusLama: booking.status,
      statusBaru: "diambil",
    });

    await logAdminAction(supabase, {
      adminId: auth.userId!,
      aksi: `Override Penyerahan Alat Sebelum Lunas Booking #${booking.kode_booking}. Alasan: ${reasonText}`,
      namaTabel: "bookings",
      targetId: bookingId,
    });

    return NextResponse.json({
      success: true,
      message: `Penyerahan alat berhasil di-override dan dicatat di log audit.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
