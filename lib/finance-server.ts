import { type SupabaseClient } from "@supabase/supabase-js";
import { calculateBookingFinancials } from "./finance";
import type {
  BookingStatusPembayaran,
  BookingStatus,
  Booking,
  BookingItem,
  EquipmentItem,
  Payment,
  BookingReturn,
  DamageReport,
  Profile,
} from "@/types/database";

export interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  userName?: string;
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenericSupabase = SupabaseClient<any, "public", any>;

type BookingWithFullRelations = Booking & {
  items?: (BookingItem & { equipment?: EquipmentItem | null })[];
  payments?: Payment[];
  returns?: (BookingReturn & { damage_reports?: DamageReport[] })[];
};

/**
 * Validasi hak akses Admin di sisi server.
 */
export async function verifyAdminAuth(
  supabase: GenericSupabase
): Promise<AdminAuthResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAdmin: false, error: "Sesi login tidak ditemukan." };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, nama, role")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;

  if (!profile || profile.role !== "admin") {
    return { isAdmin: false, error: "Akses ditolak: Hanya administrator yang berwenang." };
  }

  return {
    isAdmin: true,
    userId: profile.id,
    userName: profile.nama,
  };
}

/**
 * Mencatat log aktivitas admin ke tabel admin_logs
 */
export async function logAdminAction(
  supabase: GenericSupabase,
  params: {
    adminId: string;
    aksi: string;
    namaTabel: string;
    targetId?: string | null;
  }
) {
  try {
    await supabase.from("admin_logs").insert({
      admin_id: params.adminId,
      aksi: params.aksi,
      nama_tabel: params.namaTabel,
      target_id: params.targetId || null,
    });
  } catch (err: unknown) {
    console.error("Gagal mencatat admin_log:", err);
  }
}

/**
 * Mencatat perubahan status booking ke tabel booking_status_history
 */
export async function logBookingStatusHistory(
  supabase: GenericSupabase,
  params: {
    bookingId: string;
    statusLama: BookingStatus | null;
    statusBaru: BookingStatus;
  }
) {
  try {
    await supabase.from("booking_status_history").insert({
      booking_id: params.bookingId,
      status_lama: params.statusLama,
      status_baru: params.statusBaru,
    });
  } catch (err: unknown) {
    console.error("Gagal mencatat booking_status_history:", err);
  }
}

/**
 * Menyimpan data pembayaran baru secara aman (backward & forward compatible dengan skema tabel payments)
 */
export async function safeInsertPayment(
  supabase: GenericSupabase,
  payload: {
    booking_id: string;
    jenis: string;
    jumlah: number;
    metode: string;
    status: string;
    arah?: "masuk" | "keluar";
    bukti_url?: string | null;
    catatan?: string | null;
    dicatat_oleh?: string | null;
    diverifikasi_oleh?: string | null;
    tanggal_transaksi?: string;
    dibayar_pada?: string;
  }
) {
  const now = new Date().toISOString();
  const fullPayload = {
    booking_id: payload.booking_id,
    jenis: payload.jenis,
    jumlah: payload.jumlah,
    metode: payload.metode,
    status: payload.status,
    arah: payload.arah || (payload.jenis === "refund_deposit" ? "keluar" : "masuk"),
    bukti_url: payload.bukti_url || null,
    catatan: payload.catatan || null,
    dicatat_oleh: payload.dicatat_oleh || null,
    diverifikasi_oleh: payload.diverifikasi_oleh || null,
    tanggal_transaksi: payload.tanggal_transaksi || now,
    dibayar_pada: payload.dibayar_pada || now,
  };

  // Coba insert dengan semua kolom (jika skema migration 03 sudah aktif)
  const { data, error } = await supabase.from("payments").insert(fullPayload).select().single();

  if (error && (error.code === "42703" || error.message?.includes("does not exist"))) {
    // Fallback: insert hanya dengan kolom core yang dijamin ada
    const fallbackPayload = {
      booking_id: payload.booking_id,
      jenis: payload.jenis,
      jumlah: payload.jumlah,
      metode: payload.metode,
      status: payload.status,
      bukti_url: payload.bukti_url || null,
      dibayar_pada: payload.dibayar_pada || now,
      diverifikasi_oleh: payload.diverifikasi_oleh || null,
    };
    return await supabase.from("payments").insert(fallbackPayload).select().single();
  }

  return { data, error };
}

/**
 * Logika verifikasi transaksi pembayaran yang atomik dan idempoten
 */
export async function verifyPaymentTransaction(
  supabase: GenericSupabase,
  params: {
    paymentId: number;
    status: "terverifikasi" | "ditolak";
    alasan?: string;
    adminId?: string;
  }
) {
  const { paymentId, status, alasan, adminId } = params;

  // 1. Ambil data payment saat ini beserta data booking
  const { data, error: fetchErr } = await supabase
    .from("payments")
    .select(`
      id,
      booking_id,
      jenis,
      jumlah,
      status,
      dibayar_pada,
      booking:bookings(id, kode_booking, status, user_id)
    `)
    .eq("id", paymentId)
    .single();

  if (fetchErr || !data) {
    throw new Error("Data pembayaran tidak ditemukan.");
  }

  const payment = data as unknown as {
    id: number;
    booking_id: string;
    jenis: string;
    jumlah: number;
    status: string;
    dibayar_pada?: string;
    booking?: {
      id: string;
      kode_booking: string;
      status: BookingStatus;
      user_id: string;
    } | null;
  };

  // Idempoten: Jika sudah dalam status yang sama, kembalikan langsung
  if (payment.status === status) {
    return { payment, isAlreadyInStatus: true };
  }

  // Transaksi yang sudah terverifikasi tidak boleh diubah menjadi ditolak
  if (payment.status === "terverifikasi" && status !== "terverifikasi") {
    throw new Error("Transaksi sudah berstatus terverifikasi dan bersifat kekal.");
  }

  // 2. Update status payments
  const updatePayload: Record<string, unknown> = {
    status,
    diverifikasi_oleh: adminId || null,
  };
  if (status === "terverifikasi") {
    updatePayload.dibayar_pada = payment.dibayar_pada || new Date().toISOString();
  }
  if (alasan && status === "ditolak") {
    updatePayload.catatan = `[Ditolak]: ${alasan.trim()}`;
  }

  let { error: updateErr } = await supabase
    .from("payments")
    .update(updatePayload)
    .eq("id", paymentId);

  // Jika kolom catatan belum ada di DB, ulangi update tanpa catatan
  if (updateErr && (updateErr.code === "42703" || updateErr.message?.includes("does not exist"))) {
    delete updatePayload.catatan;
    const retry = await supabase.from("payments").update(updatePayload).eq("id", paymentId);
    updateErr = retry.error;
  }

  if (updateErr) {
    throw new Error("Gagal memperbarui status pembayaran: " + updateErr.message);
  }

  // 3. Update status booking jika DP diverifikasi
  const booking = payment.booking;
  if (status === "terverifikasi" && payment.jenis === "dp" && booking && booking.status === "menunggu_dp") {
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
  } else if (status === "ditolak" && booking) {
    await supabase
      .from("bookings")
      .update({
        pesan_admin: `Bukti transfer ditolak: ${alasan?.trim() || "Tidak sesuai"}`,
      })
      .eq("id", booking.id);
  }

  // 4. Sinkronisasi status keuangan booking
  await syncBookingPaymentStatus(supabase, payment.booking_id);

  // 5. Catat log admin
  if (adminId) {
    await logAdminAction(supabase, {
      adminId,
      aksi: `Verifikasi Pembayaran ID #${payment.id} (${payment.jenis}) -> ${status}${
        alasan ? `: ${alasan}` : ""
      }`,
      namaTabel: "payments",
      targetId: String(payment.id),
    });
  }

  return { payment, isAlreadyInStatus: false };
}

/**
 * Sinkronisasi status_pembayaran pada tabel bookings berdasarkan transaksi real-time
 */
export async function syncBookingPaymentStatus(
  supabase: GenericSupabase,
  bookingId: string
) {
  const { data } = await supabase
    .from("bookings")
    .select(`
      *,
      items:booking_items(*, equipment:equipment(*)),
      payments(id, jenis, jumlah, status, dibayar_pada),
      returns:booking_returns(id, hari_terlambat, denda_terlambat, total_ganti_rugi, damage_reports(*))
    `)
    .eq("id", bookingId)
    .single();

  if (!data) return null;

  const booking = data as unknown as BookingWithFullRelations;
  const financials = calculateBookingFinancials({
    booking,
    items: booking.items,
    payments: booking.payments,
    returns: booking.returns,
  });

  const updates: {
    total_sewa?: number;
    status_pembayaran?: BookingStatusPembayaran;
    status?: BookingStatus;
  } = {
    total_sewa: financials.totalSewa,
    status_pembayaran: financials.statusPembayaran,
  };

  // Aturan bisnis: Booking baru boleh berstatus 'selesai' jika saldo bersih = 0
  if (
    financials.saldoBersih === 0 &&
    (booking.status === "dikembalikan" || booking.status === "bermasalah") &&
    financials.statusDeposit !== "ditahan" &&
    financials.depositSisaPerluRefund === 0
  ) {
    updates.status = "selesai";
  }

  // Coba update dengan kolom baru, fallback aman jika kolom total_sewa/status_pembayaran belum ada di DB
  const { error: updErr } = await supabase.from("bookings").update(updates).eq("id", bookingId);
  if (updErr && (updErr.code === "42703" || updErr.message?.includes("does not exist"))) {
    if (updates.status && updates.status !== booking.status) {
      await supabase.from("bookings").update({ status: updates.status }).eq("id", bookingId);
    }
  }

  if (updates.status && updates.status !== booking.status) {
    await logBookingStatusHistory(supabase, {
      bookingId,
      statusLama: booking.status,
      statusBaru: updates.status,
    });
  }

  return financials;
}
