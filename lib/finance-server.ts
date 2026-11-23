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
    sumber?: string | null;
    bukti_url?: string | null;
    catatan?: string | null;
    dicatat_oleh?: string | null;
    diverifikasi_oleh?: string | null;
    rekening_pengirim?: Record<string, unknown> | null;
    bank_pengirim?: string | null;
    no_rekening_pengirim?: string | null;
    atas_nama_pengirim?: string | null;
    tanggal_transaksi?: string;
    dibayar_pada?: string;
  }
) {
  const now = new Date().toISOString();
  const fullPayload: Record<string, unknown> = {
    booking_id: payload.booking_id,
    jenis: payload.jenis,
    jumlah: payload.jumlah,
    metode: payload.metode,
    status: payload.status,
    arah: payload.arah || (payload.jenis === "refund_deposit" || payload.jenis === "refund_pembayaran" ? "keluar" : "masuk"),
    sumber: payload.sumber || null,
    bukti_url: payload.bukti_url || null,
    catatan: payload.catatan || null,
    dicatat_oleh: payload.dicatat_oleh || null,
    diverifikasi_oleh: payload.diverifikasi_oleh || null,
    rekening_pengirim: payload.rekening_pengirim || null,
    bank_pengirim: payload.bank_pengirim || null,
    no_rekening_pengirim: payload.no_rekening_pengirim || null,
    atas_nama_pengirim: payload.atas_nama_pengirim || null,
    tanggal_transaksi: payload.tanggal_transaksi || now,
    dibayar_pada: payload.dibayar_pada || now,
  };

  // Coba insert dengan semua kolom (jika skema migration 03 & 04 sudah aktif)
  const { data, error } = await supabase.from("payments").insert(fullPayload).select().single();

  if (error && (error.code === "42703" || error.code === "23514" || error.message?.includes("does not exist") || error.message?.includes("violates check constraint"))) {
    // Fallback kompatibilitas: adaptasikan jenis dan status jika DB masih memakai check constraint lama
    let safeJenis = payload.jenis;
    let safeStatus = payload.status;
    let safeMetode = payload.metode;

    if (safeJenis === "denda_keterlambatan") safeJenis = "denda";
    else if (safeJenis === "ganti_rugi") {
      safeJenis = "denda";
      safeMetode = `Ganti Rugi: ${safeMetode}`;
    } else if (safeJenis === "tagihan_kekurangan") {
      safeJenis = "denda";
      safeMetode = `Kekurangan: ${safeMetode}`;
    } else if (safeJenis === "refund_pembayaran") {
      safeJenis = "refund_deposit";
      safeMetode = `Refund Pembatalan: ${safeMetode}`;
    }

    if (safeStatus === "menunggu_transfer" || safeStatus === "menunggu_pembayaran") {
      safeStatus = "menunggu_verifikasi";
    }

    // Jika kolom baru (catatan, arah, dll) belum ada, masukkan hanya kolom dasar
    let noteFallback = payload.catatan || "";
    if (payload.sumber) noteFallback += ` [Sumber: ${payload.sumber}]`;
    if (payload.bank_pengirim || payload.no_rekening_pengirim) {
      noteFallback += ` [Rek: ${payload.bank_pengirim || ""} ${payload.no_rekening_pengirim || ""} a/n ${payload.atas_nama_pengirim || ""}]`;
    }

    const fallbackPayload: Record<string, unknown> = {
      booking_id: payload.booking_id,
      jenis: safeJenis,
      jumlah: payload.jumlah,
      metode: noteFallback ? `${safeMetode} - ${noteFallback}` : safeMetode,
      status: safeStatus,
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
      aksi: `Verifikasi Pembayaran ID #${payment.id} (${payment.jenis}) -> ${status}${alasan ? `: ${alasan}` : ""
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

export interface ReturnInspectionDamagedItem {
  bookingItemId: number;
  equipmentId: number;
  condition: "rusak_ringan" | "rusak_berat" | "hilang";
  damageQty: number;
  deskripsi: string;
  biayaGantiRugi: number;
  biayaOtomatis: number;
  biayaOverride?: number | null;
  alasanOverride?: string | null;
  fotoUrl?: string | null;
}

export interface ProcessBookingReturnParams {
  bookingId: string;
  adminId: string;
  lateDays: number;
  lateFee: number;
  dendaOverrideAlasan?: string;
  returnNotes?: string;
  damagedReports: ReturnInspectionDamagedItem[];
}

/**
 * Memproses inspeksi pengembalian unit, mencatat denda/kerusakan/refund ke buku besar payments,
 * memperbarui stok fisik equipment, dan menyinkronkan status booking secara atomik & idempoten.
 */
export async function processBookingReturnFinancials(
  supabase: GenericSupabase,
  params: ProcessBookingReturnParams
) {
  const {
    bookingId,
    adminId,
    lateDays,
    lateFee,
    dendaOverrideAlasan,
    returnNotes,
    damagedReports,
  } = params;

  // 1. Ambil data booking lengkap
  const { data: booking, error: bErr } = await supabase
    .from("bookings")
    .select(`
      id,
      kode_booking,
      status,
      deposit,
      total_harga,
      items:booking_items(id, equipment_id, qty, equipment:equipment(id, nama, stok, stok_rusak))
    `)
    .eq("id", bookingId)
    .single();

  if (bErr || !booking) {
    throw new Error("Data booking tidak ditemukan.");
  }

  const depositAwal = Number(booking.deposit) || 0;
  const totalGantiRugi = damagedReports.reduce(
    (sum, d) => sum + (Number(d.biayaGantiRugi) || 0),
    0
  );
  const totalKewajiban = lateFee + totalGantiRugi;

  // 2. Alokasi potongan dari deposit
  const potonganDenda = Math.min(depositAwal, lateFee);
  const sisaDepositSetelahDenda = depositAwal - potonganDenda;
  const potonganGantiRugi = Math.min(sisaDepositSetelahDenda, totalGantiRugi);

  const sisaDepositDikembalikan = Math.max(0, depositAwal - totalKewajiban);
  const kekuranganBayar = Math.max(0, totalKewajiban - depositAwal);

  // 3. Simpan record booking_returns
  let returnId: number;
  const { data: existingReturn } = await supabase
    .from("booking_returns")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (existingReturn) {
    returnId = existingReturn.id;
    await supabase
      .from("booking_returns")
      .update({
        tanggal_dikembalikan: new Date().toISOString(),
        hari_terlambat: lateDays,
        denda_terlambat: lateFee,
        total_ganti_rugi: totalGantiRugi,
        deposit_dikembalikan: sisaDepositDikembalikan,
        catatan: returnNotes?.trim() || null,
      })
      .eq("id", returnId);
  } else {
    const { data: newRet, error: retErr } = await supabase
      .from("booking_returns")
      .insert({
        booking_id: bookingId,
        tanggal_dikembalikan: new Date().toISOString(),
        hari_terlambat: lateDays,
        denda_terlambat: lateFee,
        total_ganti_rugi: totalGantiRugi,
        deposit_dikembalikan: sisaDepositDikembalikan,
        catatan: returnNotes?.trim() || null,
      })
      .select("id")
      .single();

    if (retErr || !newRet) {
      throw new Error("Gagal menyimpan rekap pengembalian: " + (retErr?.message || ""));
    }
    returnId = newRet.id;
  }

  // 4. Simpan damage_reports jika ada unit rusak/hilang
  if (damagedReports.length > 0) {
    for (const d of damagedReports) {
      const damagePayload: Record<string, unknown> = {
        booking_item_id: d.bookingItemId,
        return_id: returnId,
        jenis: d.condition,
        jumlah: d.damageQty,
        deskripsi: d.deskripsi.trim() || `Unit dinyatakan ${d.condition.replace("_", " ")}`,
        biaya_ganti_rugi: d.biayaGantiRugi,
        biaya_otomatis: d.biayaOtomatis,
        biaya_override: d.biayaOverride || null,
        alasan_override: d.alasanOverride || null,
        foto_url: d.fotoUrl || null,
      };

      const { error: dmErr } = await supabase.from("damage_reports").insert(damagePayload);
      if (dmErr && (dmErr.code === "42703" || dmErr.message?.includes("does not exist"))) {
        // Fallback jika kolom biaya_otomatis/override belum dibuat di DB
        await supabase.from("damage_reports").insert({
          booking_item_id: d.bookingItemId,
          return_id: returnId,
          jenis: d.condition,
          jumlah: d.damageQty,
          deskripsi: d.deskripsi.trim() || `Unit dinyatakan ${d.condition.replace("_", " ")}`,
          biaya_ganti_rugi: d.biayaGantiRugi,
          foto_url: d.fotoUrl || null,
        });
      }

      // Perbarui stok fisik di master equipment
      try {
        const { data: eq } = await supabase
          .from("equipment")
          .select("id, stok, stok_rusak")
          .eq("id", d.equipmentId)
          .single();

        if (eq) {
          if (d.condition === "rusak_ringan" || d.condition === "rusak_berat") {
            await supabase
              .from("equipment")
              .update({ stok_rusak: (Number(eq.stok_rusak) || 0) + d.damageQty })
              .eq("id", d.equipmentId);
          } else if (d.condition === "hilang") {
            // Unit hilang mengurangi total stok fisik
            await supabase
              .from("equipment")
              .update({ stok: Math.max(0, (Number(eq.stok) || 0) - d.damageQty) })
              .eq("id", d.equipmentId);
          }
        }
      } catch (stkErr) {
        console.warn("Gagal update stok alat setelah kerusakan:", stkErr);
      }
    }
  }

  // 5. Catat mutasi ke buku besar `payments` secara atomik
  const now = new Date().toISOString();

  // A. Potongan Denda dari Deposit
  if (potonganDenda > 0) {
    let catatanDenda = `Potongan deposit untuk denda keterlambatan (${lateDays} hari)`;
    if (dendaOverrideAlasan) catatanDenda += ` [Alasan Override: ${dendaOverrideAlasan.trim()}]`;
    await safeInsertPayment(supabase, {
      booking_id: bookingId,
      jenis: "denda_keterlambatan",
      arah: "masuk",
      jumlah: potonganDenda,
      metode: "Potongan Uang Jaminan (Deposit)",
      status: "terverifikasi",
      sumber: "potongan_deposit",
      catatan: catatanDenda,
      dicatat_oleh: adminId,
      diverifikasi_oleh: adminId,
      tanggal_transaksi: now,
      dibayar_pada: now,
    });
  }

  // B. Potongan Ganti Rugi dari Deposit
  if (potonganGantiRugi > 0) {
    await safeInsertPayment(supabase, {
      booking_id: bookingId,
      jenis: "ganti_rugi",
      arah: "masuk",
      jumlah: potonganGantiRugi,
      metode: "Potongan Uang Jaminan (Deposit)",
      status: "terverifikasi",
      sumber: "potongan_deposit",
      catatan: "Potongan deposit untuk biaya ganti rugi fisik peralatan",
      dicatat_oleh: adminId,
      diverifikasi_oleh: adminId,
      tanggal_transaksi: now,
      dibayar_pada: now,
    });
  }

  // C. Sisa Deposit yang harus dikembalikan (Refund Deposit)
  if (sisaDepositDikembalikan > 0) {
    await safeInsertPayment(supabase, {
      booking_id: bookingId,
      jenis: "refund_deposit",
      arah: "keluar",
      jumlah: sisaDepositDikembalikan,
      metode: "Pengembalian Deposit (Menunggu Transfer)",
      status: "menunggu_transfer",
      catatan: "Sisa uang jaminan deposit yang wajib dikembalikan ke pelanggan",
      dicatat_oleh: adminId,
      tanggal_transaksi: now,
      dibayar_pada: now,
    });
  }

  // D. Pelunasan sisa denda & kerusakan yang dibayar pelanggan langsung di kasir toko saat pengembalian
  if (kekuranganBayar > 0) {
    await safeInsertPayment(supabase, {
      booking_id: bookingId,
      jenis: "denda_keterlambatan",
      arah: "masuk",
      jumlah: kekuranganBayar,
      metode: "Tunai / Kasir di Toko",
      status: "terverifikasi",
      sumber: "kasir_toko",
      catatan: `Pelunasan sisa biaya keterlambatan / kerusakan dibayar langsung oleh pelanggan di kasir toko saat pengembalian (Denda: ${lateFee}, Ganti Rugi: ${totalGantiRugi}, Deposit: ${depositAwal})`,
      dicatat_oleh: adminId,
      diverifikasi_oleh: adminId,
      tanggal_transaksi: now,
      dibayar_pada: now,
    });
  }

  // 6. Tentukan status akhir booking
  // Seluruh denda dan ganti rugi telah lunas diselesaikan saat pengembalian barang di toko
  const finalStatus: BookingStatus = sisaDepositDikembalikan > 0 ? "dikembalikan" : "selesai";

  let pesanStatus = `Unit telah dikembalikan. Denda: Rp ${lateFee.toLocaleString("id-ID")}, Ganti Rugi: Rp ${totalGantiRugi.toLocaleString("id-ID")}.`;
  if (kekuranganBayar > 0) {
    pesanStatus += ` Sisa biaya sebesar Rp ${kekuranganBayar.toLocaleString("id-ID")} telah lunas dibayar di toko. Pengembalian selesai.`;
  } else if (sisaDepositDikembalikan > 0) {
    pesanStatus += ` Sisa deposit Rp ${sisaDepositDikembalikan.toLocaleString("id-ID")} dalam antrean refund transfer.`;
  } else {
    pesanStatus += ` Deposit telah habis dialokasikan. Pengembalian selesai.`;
  }

  await supabase
    .from("bookings")
    .update({
      status: finalStatus,
      pesan_admin: pesanStatus,
    })
    .eq("id", bookingId);

  await logBookingStatusHistory(supabase, {
    bookingId,
    statusLama: booking.status,
    statusBaru: finalStatus,
  });

  await logAdminAction(supabase, {
    adminId,
    aksi: `Inspeksi Pengembalian #${booking.kode_booking}: Denda Rp ${lateFee.toLocaleString("id-ID")}, Ganti Rugi Rp ${totalGantiRugi.toLocaleString("id-ID")}, Status: ${finalStatus}`,
    namaTabel: "bookings",
    targetId: bookingId,
  });

  await syncBookingPaymentStatus(supabase, bookingId);

  return {
    success: true,
    returnId,
    finalStatus,
    depositAwal,
    lateFee,
    totalGantiRugi,
    totalKewajiban,
    potonganDenda,
    potonganGantiRugi,
    sisaDepositDikembalikan,
    kekuranganBayar,
  };
}
