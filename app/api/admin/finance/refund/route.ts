import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  verifyAdminAuth,
  logAdminAction,
  syncBookingPaymentStatus,
  safeInsertPayment,
} from "@/lib/finance-server";
import { extractBankDetailsFromPayment } from "@/lib/finance";

interface RawPaymentRow {
  id: number;
  booking_id: string;
  jenis: string;
  arah?: string;
  jumlah: number;
  metode: string;
  status: string;
  bukti_url: string | null;
  catatan?: string | null;
  dibayar_pada: string;
  created_at?: string;
  bank_pengirim?: string | null;
  no_rekening_pengirim?: string | null;
  atas_nama_pengirim?: string | null;
  rekening_pengirim?: Record<string, unknown> | null;
  booking?: {
    id: string;
    kode_booking: string;
    status: string;
    user_id: string;
    profile?: {
      id: string;
      nama: string;
      no_hp: string;
    } | null;
  } | null;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "menunggu_transfer";

    let rawData: RawPaymentRow[] = [];

    // Coba query lengkap dengan seluruh kolom terlebih dahulu
    const { data: fullData, error: fullErr } = await supabase
      .from("payments")
      .select(`
        id,
        booking_id,
        jenis,
        arah,
        jumlah,
        metode,
        status,
        bukti_url,
        catatan,
        dibayar_pada,
        created_at,
        bank_pengirim,
        no_rekening_pengirim,
        atas_nama_pengirim,
        rekening_pengirim,
        booking:bookings(
          id,
          kode_booking,
          status,
          user_id,
          profile:profiles(id, nama, no_hp)
        )
      `)
      .in("jenis", ["refund_deposit", "refund_pembayaran"])
      .order("id", { ascending: false });

    if (fullErr && (fullErr.code === "42703" || fullErr.message?.includes("does not exist"))) {
      // Fallback: Gunakan kolom-kolom yang dijamin selalu ada di DB
      const { data: basicData, error: basicErr } = await supabase
        .from("payments")
        .select(`
          id,
          booking_id,
          jenis,
          jumlah,
          metode,
          status,
          bukti_url,
          dibayar_pada,
          booking:bookings(
            id,
            kode_booking,
            status,
            user_id,
            profile:profiles(id, nama, no_hp)
          )
        `)
        .in("jenis", ["refund_deposit", "refund_pembayaran"])
        .order("id", { ascending: false });

      if (basicErr) {
        return NextResponse.json({ error: basicErr.message }, { status: 500 });
      }
      rawData = (basicData as unknown as RawPaymentRow[]) || [];
    } else if (fullErr) {
      return NextResponse.json({ error: fullErr.message }, { status: 500 });
    } else {
      rawData = (fullData as unknown as RawPaymentRow[]) || [];
    }

    // Normalisasi data dan deteksi informasi rekening
    const mappedData = rawData.map((p) => {
      const bankInfo = extractBankDetailsFromPayment(p);
      const isPending =
        p.status === "menunggu_transfer" ||
        (p.status === "menunggu_verifikasi" &&
          (p.metode?.includes("Transfer") || p.jenis === "refund_deposit" || p.jenis === "refund_pembayaran"));

      return {
        ...p,
        status: isPending ? "menunggu_transfer" : p.status,
        arah: p.arah || "keluar",
        bank_pengirim: bankInfo.bank,
        no_rekening_pengirim: bankInfo.nomor,
        atas_nama_pengirim: bankInfo.atas_nama,
        created_at: p.created_at || p.dibayar_pada || new Date().toISOString(),
      };
    });

    let filtered = mappedData;
    if (status === "menunggu_transfer") {
      filtered = filtered.filter((p) => p.status === "menunggu_transfer");
    } else if (status === "terverifikasi") {
      filtered = filtered.filter((p) => p.status === "terverifikasi");
    }

    return NextResponse.json({ data: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, bookingId, jumlah, metode = "Transfer Bank", buktiUrl, catatan } = body;

    // KASUS 1: Tandai pembayaran refund yang sudah ada di antrean menjadi terverifikasi / ditransfer
    if (paymentId) {
      const { data: existingPayment, error: findErr } = await supabase
        .from("payments")
        .select("id, booking_id, jenis, jumlah, status, booking:bookings(kode_booking)")
        .eq("id", paymentId)
        .single();

      if (findErr || !existingPayment) {
        return NextResponse.json({ error: "Data refund tidak ditemukan." }, { status: 404 });
      }

      const now = new Date().toISOString();
      const updatePayload: Record<string, unknown> = {
        status: "terverifikasi",
        dibayar_pada: now,
        diverifikasi_oleh: auth.userId,
      };
      if (buktiUrl) updatePayload.bukti_url = buktiUrl;
      if (catatan) updatePayload.catatan = catatan;

      let { data: updatedPayment, error: uErr } = await supabase
        .from("payments")
        .update(updatePayload)
        .eq("id", paymentId)
        .select()
        .single();

      if (uErr && (uErr.code === "42703" || uErr.message?.includes("does not exist"))) {
        delete updatePayload.catatan;
        const res = await supabase
          .from("payments")
          .update(updatePayload)
          .eq("id", paymentId)
          .select()
          .single();
        updatedPayment = res.data;
        uErr = res.error;
      }

      if (uErr) {
        return NextResponse.json({ error: uErr.message }, { status: 500 });
      }

      const bookingKode =
        (existingPayment.booking as unknown as { kode_booking: string })?.kode_booking ||
        existingPayment.booking_id;

      await logAdminAction(supabase, {
        adminId: auth.userId!,
        aksi: `Tandai Refund Rp ${Number(existingPayment.jumlah).toLocaleString("id-ID")} Selesai Ditransfer untuk Booking #${bookingKode}`,
        namaTabel: "payments",
        targetId: String(paymentId),
      });

      return NextResponse.json({
        success: true,
        data: updatedPayment,
        message: "Refund berhasil ditandai telah ditransfer.",
      });
    }

    // KASUS 2: Buat baris transaksi refund baru
    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID wajib diisi." }, { status: 400 });
    }

    const parsedJumlah = Math.round(Number(jumlah));
    if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
      return NextResponse.json(
        { error: "Jumlah refund harus berupa bilangan bulat positif (Rupiah > 0)." },
        { status: 400 }
      );
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
    const { data: newRefund, error: insertErr } = await safeInsertPayment(supabase, {
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
    });

    if (insertErr || !newRefund) {
      return NextResponse.json(
        { error: insertErr?.message || "Gagal mencatat refund deposit." },
        { status: 500 }
      );
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
