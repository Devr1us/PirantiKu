import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth, logAdminAction, syncBookingPaymentStatus, safeInsertPayment } from "@/lib/finance-server";
import type { PaymentArah, PaymentJenis } from "@/types/database";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { bookingId, jenis, arah = "masuk", jumlah, metode, buktiUrl, catatan } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID wajib diisi." }, { status: 400 });
    }

    const parsedJumlah = Math.round(Number(jumlah));
    if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
      return NextResponse.json({ error: "Jumlah pembayaran harus berupa bilangan bulat positif (Rupiah > 0)." }, { status: 400 });
    }

    const validJenis = [
      "dp",
      "pelunasan",
      "deposit",
      "denda",
      "denda_keterlambatan",
      "ganti_rugi",
      "penyesuaian",
    ];
    if (!validJenis.includes(jenis)) {
      return NextResponse.json({ error: `Jenis transaksi '${jenis}' tidak valid.` }, { status: 400 });
    }

    if (!["masuk", "keluar"].includes(arah)) {
      return NextResponse.json({ error: "Arah transaksi harus 'masuk' atau 'keluar'." }, { status: 400 });
    }

    if (!metode || !metode.trim()) {
      return NextResponse.json({ error: "Metode pembayaran wajib diisi (misal: Tunai di Tempat, Transfer BCA)." }, { status: 400 });
    }

    // Periksa apakah booking ada
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id, kode_booking, status")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { data: newPayment, error: insertErr } = await safeInsertPayment(supabase, {
      booking_id: bookingId,
      jenis: jenis as PaymentJenis,
      arah: arah as PaymentArah,
      jumlah: parsedJumlah,
      metode: metode.trim(),
      bukti_url: buktiUrl || null,
      status: "terverifikasi",
      catatan: catatan ? catatan.trim() : null,
      dicatat_oleh: auth.userId,
      diverifikasi_oleh: auth.userId,
      tanggal_transaksi: now,
      dibayar_pada: now,
    });

    if (insertErr || !newPayment) {
      return NextResponse.json({ error: insertErr?.message || "Gagal mencatat transaksi." }, { status: 500 });
    }

    // Sinkronisasi status_pembayaran booking
    const financials = await syncBookingPaymentStatus(supabase, bookingId);

    // Catat log admin
    await logAdminAction(supabase, {
      adminId: auth.userId!,
      aksi: `Catat Pembayaran Manual ${jenis.toUpperCase()} (${arah}) Rp ${parsedJumlah.toLocaleString("id-ID")} untuk Booking #${booking.kode_booking}`,
      namaTabel: "payments",
      targetId: String(newPayment.id),
    });

    return NextResponse.json({
      success: true,
      data: newPayment,
      financials,
      message: "Transaksi pembayaran berhasil dicatat dan diverifikasi.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
