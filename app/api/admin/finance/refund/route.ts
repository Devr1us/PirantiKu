import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth, logAdminAction, syncBookingPaymentStatus } from "@/lib/finance-server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, jumlah, metode = "Transfer Bank", buktiUrl, catatan } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID wajib diisi." }, { status: 400 });
    }

    const parsedJumlah = Math.round(Number(jumlah));
    if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
      return NextResponse.json({ error: "Jumlah refund harus berupa bilangan bulat positif (Rupiah > 0)." }, { status: 400 });
    }

    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id, kode_booking, status, deposit")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { data: newRefund, error: insertErr } = await supabase
      .from("payments")
      .insert({
        booking_id: bookingId,
        jenis: "refund_deposit",
        arah: "keluar",
        jumlah: parsedJumlah,
        metode: metode.trim(),
        bukti_url: buktiUrl || null,
        status: "terverifikasi",
        catatan: catatan ? catatan.trim() : "Pengembalian sisa deposit jaminan",
        dicatat_oleh: auth.userId,
        diverifikasi_oleh: auth.userId,
        tanggal_transaksi: now,
        dibayar_pada: now,
      })
      .select()
      .single();

    if (insertErr || !newRefund) {
      return NextResponse.json({ error: insertErr?.message || "Gagal mencatat refund deposit." }, { status: 500 });
    }

    const financials = await syncBookingPaymentStatus(supabase, bookingId);

    await logAdminAction(supabase, {
      adminId: auth.userId!,
      aksi: `Catat Pengembalian Deposit (Refund) Rp ${parsedJumlah.toLocaleString("id-ID")} untuk Booking #${booking.kode_booking}`,
      namaTabel: "payments",
      targetId: String(newRefund.id),
    });

    return NextResponse.json({
      success: true,
      data: newRefund,
      financials,
      message: "Refund deposit berhasil dicatat dan diverifikasi.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
