import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth, processBookingReturnFinancials } from "@/lib/finance-server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const {
      bookingId,
      lateDays = 0,
      lateFee = 0,
      dendaOverrideAlasan = "",
      returnNotes = "",
      damagedReports = [],
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID wajib disertakan." }, { status: 400 });
    }

    if (lateFee < 0) {
      return NextResponse.json({ error: "Total denda tidak boleh bernilai negatif." }, { status: 400 });
    }

    // Validasi setiap damage report
    for (const d of damagedReports) {
      if (!d.bookingItemId || !d.equipmentId) {
        return NextResponse.json({ error: "Data item inspeksi tidak lengkap." }, { status: 400 });
      }
      if (d.damageQty <= 0) {
        return NextResponse.json({ error: "Jumlah unit rusak/hilang minimal 1 unit." }, { status: 400 });
      }
      if (d.biayaGantiRugi < 0) {
        return NextResponse.json({ error: "Biaya ganti rugi tidak boleh bernilai negatif." }, { status: 400 });
      }
      // Validasi override: jika biaya berbeda dengan otomatis, alasan wajib diisi
      if (d.biayaOverride !== null && d.biayaOverride !== undefined && d.biayaOverride !== d.biayaOtomatis) {
        if (!d.alasanOverride || !d.alasanOverride.trim()) {
          return NextResponse.json({
            error: "Alasan penyesuaian biaya ganti rugi wajib diisi jika mengubah tarif otomatis.",
          }, { status: 400 });
        }
      }
    }

    const result = await processBookingReturnFinancials(supabase, {
      bookingId,
      adminId: auth.userId!,
      lateDays: Math.max(0, parseInt(String(lateDays), 10) || 0),
      lateFee: Math.max(0, parseInt(String(lateFee), 10) || 0),
      dendaOverrideAlasan,
      returnNotes,
      damagedReports,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Inspeksi pengembalian dan mutasi keuangan berhasil dicatat.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
