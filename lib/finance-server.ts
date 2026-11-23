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
      payments(*),
      returns:booking_returns(*, damage_reports(*))
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
  // (semua tagihan lunas dan deposit sudah dikembalikan atau dipotong).
  if (
    financials.saldoBersih === 0 &&
    (booking.status === "dikembalikan" || booking.status === "bermasalah") &&
    financials.statusDeposit !== "ditahan" &&
    financials.depositSisaPerluRefund === 0
  ) {
    updates.status = "selesai";
  }

  await supabase.from("bookings").update(updates).eq("id", bookingId);

  if (updates.status && updates.status !== booking.status) {
    await logBookingStatusHistory(supabase, {
      bookingId,
      statusLama: booking.status,
      statusBaru: updates.status,
    });
  }

  return financials;
}
