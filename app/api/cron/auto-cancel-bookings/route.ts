import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth, logBookingStatusHistory, safeInsertPayment } from "@/lib/finance-server";
import { extractBankDetailsFromPayment } from "@/lib/finance";
import type { BookingStatus } from "@/types/database";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface CandidatePayment {
  id: number;
  jenis: string;
  jumlah: number;
  status: string;
  metode: string;
  bukti_url: string | null;
  dibayar_pada: string;
  created_at?: string;
  rekening_pengirim?: Record<string, unknown> | null;
  bank_pengirim?: string | null;
  no_rekening_pengirim?: string | null;
  atas_nama_pengirim?: string | null;
}

interface CandidateBooking {
  id: string;
  kode_booking: string;
  status: BookingStatus;
  created_at: string;
  user_id: string;
  deposit: number;
  payments: CandidatePayment[];
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    // 1. Verifikasi Otorisasi: Vercel Cron Secret atau Sesi Admin
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    let isAuthorized = false;

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
    } else {
      const auth = await verifyAdminAuth(supabase);
      if (auth.isAdmin) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Akses tidak diizinkan. Dibutuhkan token CRON_SECRET atau sesi Admin." },
        { status: 401 }
      );
    }

    // 2. Ambil konfigurasi batas waktu verifikasi dari settings (default 24 jam)
    const { data: settingData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "batas_verifikasi_jam")
      .maybeSingle();

    const batasVerifikasiJam = Number(settingData?.value) || 24;
    const thresholdMs = batasVerifikasiJam * 60 * 60 * 1000;
    const now = new Date();

    // 3. Ambil booking yang berstatus menunggu_dp atau menunggu_verifikasi
    const { data: bookingsData, error: bErr } = await supabase
      .from("bookings")
      .select(`
        id,
        kode_booking,
        status,
        created_at,
        user_id,
        deposit,
        payments(
          id,
          jenis,
          jumlah,
          status,
          metode,
          bukti_url,
          dibayar_pada
        )
      `)
      .in("status", ["menunggu_dp", "menunggu_verifikasi"]);

    if (bErr) {
      return NextResponse.json({ error: bErr.message }, { status: 500 });
    }

    const candidateBookings = (bookingsData as unknown as CandidateBooking[]) || [];
    const cancelledList: Array<{
      bookingId: string;
      kodeBooking: string;
      statusAwal: string;
      elapsedJam: number;
      refundAmount: number;
    }> = [];

    for (const booking of candidateBookings) {
      // Tentukan waktu acuan:
      // Jika user sudah unggah bukti bayar (ada payment DP), gunakan dibayar_pada
      // Jika belum unggah bukti sama sekali, gunakan booking.created_at
      const dpPayments = (booking.payments || []).filter(
        (p) => p.jenis === "dp" && p.status !== "ditolak"
      );

      let referenceTime = new Date(booking.created_at).getTime();
      if (dpPayments.length > 0) {
        // Ambil pembayaran DP paling baru
        const latestDp = dpPayments.sort(
          (a, b) =>
            new Date(b.dibayar_pada || "").getTime() -
            new Date(a.dibayar_pada || "").getTime()
        )[0];
        referenceTime = new Date(latestDp.dibayar_pada || booking.created_at).getTime();
      }

      const elapsedMs = now.getTime() - referenceTime;
      const elapsedJam = Math.round((elapsedMs / (1000 * 60 * 60)) * 10) / 10;

      // Cek apakah sudah melebihi batas waktu
      if (elapsedMs > thresholdMs) {
        // 4. Update status secara kondisional/atomik (mencegah balapan dengan persetujuan admin)
        const { data: updatedBooking, error: updateErr } = await supabase
          .from("bookings")
          .update({
            status: "dibatalkan",
            catatan_admin: `Dibatalkan otomatis oleh sistem (melebihi batas verifikasi ${batasVerifikasiJam} jam)`,
          })
          .eq("id", booking.id)
          .in("status", ["menunggu_dp", "menunggu_verifikasi"])
          .select()
          .maybeSingle();

        if (updateErr || !updatedBooking) {
          // Status mungkin sudah diubah oleh aksi admin bersamaan, skip safely
          continue;
        }

        // Catat riwayat status
        await logBookingStatusHistory(supabase, {
          bookingId: booking.id,
          statusLama: booking.status,
          statusBaru: "dibatalkan",
        });

        // 5. Periksa apakah pelanggan sudah sempat membayar uang muka (DP)
        let totalRefund = 0;
        const validDp = (booking.payments || []).filter(
          (p) =>
            p.jenis === "dp" &&
            (p.status === "menunggu_verifikasi" || p.status === "terverifikasi")
        );

        for (const p of validDp) {
          const refundNominal = Number(p.jumlah) || 0;
          if (refundNominal > 0) {
            totalRefund += refundNominal;
            const bankDetails = extractBankDetailsFromPayment(p);

            // Catat transaksi uang keluar refund_pembayaran dengan status menunggu_transfer
            await safeInsertPayment(supabase, {
              booking_id: booking.id,
              jenis: "refund_pembayaran",
              arah: "keluar",
              jumlah: refundNominal,
              metode: "Transfer Bank",
              status: "menunggu_transfer",
              catatan: `Refund otomatis timeout ${batasVerifikasiJam} jam #${booking.kode_booking}`,
              bank_pengirim: bankDetails.bank,
              no_rekening_pengirim: bankDetails.nomor,
              atas_nama_pengirim: bankDetails.atas_nama,
              rekening_pengirim: bankDetails.bank ? {
                bank: bankDetails.bank,
                nomor: bankDetails.nomor,
                atas_nama: bankDetails.atas_nama,
              } : null,
              tanggal_transaksi: now.toISOString(),
            });
          }
        }

        cancelledList.push({
          bookingId: booking.id,
          kodeBooking: booking.kode_booking,
          statusAwal: booking.status,
          elapsedJam,
          refundAmount: totalRefund,
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      batasVerifikasiJam,
      checkedCount: candidateBookings.length,
      cancelledCount: cancelledList.length,
      cancelledList,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
