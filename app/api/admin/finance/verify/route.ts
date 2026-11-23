import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth, logAdminAction, syncBookingPaymentStatus, logBookingStatusHistory } from "@/lib/finance-server";
import type { Payment, BookingStatus } from "@/types/database";

interface JoinedPaymentVerify {
  id: number;
  booking_id: string;
  jenis: string;
  status: string;
  catatan: string | null;
  booking?: {
    id: string;
    kode_booking: string;
    status: BookingStatus;
  } | null;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, status, alasan } = body;

    if (!paymentId || !["terverifikasi", "ditolak"].includes(status)) {
      return NextResponse.json(
        { error: "Parameter paymentId dan status ('terverifikasi' | 'ditolak') wajib diisi." },
        { status: 400 }
      );
    }

    if (status === "ditolak" && (!alasan || !alasan.trim())) {
      return NextResponse.json(
        { error: "Alasan penolakan pembayaran wajib diisi." },
        { status: 400 }
      );
    }

    // Ambil data payment saat ini
    const { data, error: fetchErr } = await supabase
      .from("payments")
      .select(`
        *,
        booking:bookings(id, kode_booking, status)
      `)
      .eq("id", paymentId)
      .single();

    if (fetchErr || !data) {
      return NextResponse.json({ error: "Data pembayaran tidak ditemukan." }, { status: 404 });
    }

    const payment = data as unknown as JoinedPaymentVerify;

    // Transaksi yang sudah terverifikasi tidak boleh diubah
    if (payment.status === "terverifikasi") {
      return NextResponse.json(
        { error: "Transaksi ini sudah berstatus terverifikasi dan bersifat kekal (immutable). Gunakan penyesuaian jika perlu koreksi." },
        { status: 400 }
      );
    }

    // Update status payment
    const updatePayload: Partial<Payment> = {
      status,
      diverifikasi_oleh: auth.userId,
    };
    if (alasan && status === "ditolak") {
      updatePayload.catatan = payment.catatan
        ? `${payment.catatan} | [Ditolak]: ${alasan.trim()}`
        : `[Ditolak]: ${alasan.trim()}`;
    }

    const { error: updateErr } = await supabase
      .from("payments")
      .update(updatePayload)
      .eq("id", paymentId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Jika payment DP disetujui dan booking masih menunggu_dp, ubah booking ke dp_dibayar
    const booking = payment.booking;
    if (status === "terverifikasi" && payment.jenis === "dp" && booking?.status === "menunggu_dp") {
      await supabase
        .from("bookings")
        .update({
          status: "dp_dibayar",
          pesan_admin: "Pembayaran DP telah diverifikasi admin. Pesanan siap dijadwalkan.",
        })
        .eq("id", booking.id);

      await logBookingStatusHistory(supabase, {
        bookingId: booking.id,
        statusLama: "menunggu_dp",
        statusBaru: "dp_dibayar",
      });
    } else if (status === "ditolak") {
      await supabase
        .from("bookings")
        .update({
          pesan_admin: `Bukti transfer ditolak: ${alasan.trim()}`,
        })
        .eq("id", payment.booking_id);
    }

    // Sinkronisasi status_pembayaran booking
    await syncBookingPaymentStatus(supabase, payment.booking_id);

    // Catat log admin
    await logAdminAction(supabase, {
      adminId: auth.userId!,
      aksi: `Verifikasi Pembayaran ID #${payment.id} (${payment.jenis}) -> ${status}${alasan ? `: ${alasan}` : ""}`,
      namaTabel: "payments",
      targetId: String(payment.id),
    });

    return NextResponse.json({
      success: true,
      message: `Pembayaran berhasil ${status === "terverifikasi" ? "disetujui" : "ditolak"}.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
