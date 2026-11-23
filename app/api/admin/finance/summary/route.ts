import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth } from "@/lib/finance-server";
import { getWibDateRange, toWibDateString, getPaymentArah } from "@/lib/finance";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "bulan_ini";
    const customStart = searchParams.get("start_date") || "";
    const customEnd = searchParams.get("end_date") || "";

    // Dapatkan rentang tanggal presisi zona waktu WIB (UTC+7)
    const { startDate, endDate } = getWibDateRange(period, customStart, customEnd);

    // 1. Ambil seluruh pembayaran terverifikasi dalam rentang periode
    // Gunakan kolom yang dijamin ada: id, jenis, jumlah, status, dibayar_pada
    const { data: periodPayments, error: pErr } = await supabase
      .from("payments")
      .select("id, booking_id, jenis, jumlah, status, dibayar_pada")
      .eq("status", "terverifikasi")
      .gte("dibayar_pada", startDate.toISOString())
      .lte("dibayar_pada", endDate.toISOString());

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    let totalPemasukan = 0;
    let dpMasuk = 0;
    let pelunasanMasuk = 0;
    let dendaMasuk = 0;
    let gantiRugiMasuk = 0;
    let refundDibayar = 0;

    const dailyMap: Record<string, number> = {};

    for (const p of periodPayments || []) {
      const jml = Number(p.jumlah) || 0;
      const arah = getPaymentArah(p);
      const tglWib = toWibDateString(p.dibayar_pada);

      if (arah === "masuk") {
        totalPemasukan += jml;
        if (p.jenis === "dp") dpMasuk += jml;
        else if (p.jenis === "pelunasan") pelunasanMasuk += jml;
        else if (p.jenis === "denda" || p.jenis === "denda_keterlambatan") dendaMasuk += jml;
        else if (p.jenis === "ganti_rugi") gantiRugiMasuk += jml;

        if (tglWib) {
          dailyMap[tglWib] = (dailyMap[tglWib] || 0) + jml;
        }
      } else if (arah === "keluar") {
        if (p.jenis === "refund_deposit" || p.jenis === "refund_pembayaran") {
          refundDibayar += jml;
        }
      }
    }

    // 2. Total deposit yang sedang ditahan (dari booking yang masih aktif / belum selesai refund)
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        deposit,
        payments(id, jenis, status, jumlah),
        returns:booking_returns(id, denda_terlambat, total_ganti_rugi)
      `)
      .not("status", "in", "('selesai','dibatalkan')");

    let totalDepositDitahan = 0;
    for (const b of activeBookings || []) {
      const paymentsList = Array.isArray(b.payments) ? b.payments : [];
      const hasVerifiedPayment = paymentsList.some((p) => p.status === "terverifikasi");
      if (hasVerifiedPayment && Number(b.deposit) > 0) {
        let potong = 0;
        if (b.returns) {
          const rets = Array.isArray(b.returns) ? b.returns : [b.returns];
          for (const r of rets) {
            potong += (Number(r.denda_terlambat) || 0) + (Number(r.total_ganti_rugi) || 0);
          }
        }
        const sisa = Math.max(0, Number(b.deposit) - potong);
        totalDepositDitahan += sisa;
      }
    }

    // 3. Jumlah pembayaran menunggu verifikasi admin (Hanya pembayaran DP & Pelunasan)
    const { count: pendingCount } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .in("jenis", ["dp", "pelunasan"])
      .eq("status", "menunggu_verifikasi");

    // 4. Jumlah refund yang menunggu transfer admin
    const { data: pendingRefundList } = await supabase
      .from("payments")
      .select("id, status, metode")
      .in("jenis", ["refund_deposit", "refund_pembayaran"]);

    const pendingRefundsCount = (pendingRefundList || []).filter(
      (p) =>
        p.status === "menunggu_transfer" ||
        (p.status === "menunggu_verifikasi" && p.metode?.includes("Transfer"))
    ).length;

    // 5. Total tagihan kekurangan pelanggan yang belum dibayar
    const { data: allUnpaidPayments } = await supabase
      .from("payments")
      .select("jumlah, jenis, metode, status")
      .in("status", ["menunggu_pembayaran", "menunggu_verifikasi"]);

    const pendingShortfallTotal = (allUnpaidPayments || [])
      .filter(
        (p) =>
          p.jenis === "tagihan_kekurangan" ||
          p.metode?.toLowerCase().includes("kekurangan")
      )
      .reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0);

    // Format chart series diurutkan secara kronologis
    const chartData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        amount,
      }));

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalPemasukan,
        dpMasuk,
        pelunasanMasuk,
        dendaDanGantiRugi: dendaMasuk + gantiRugiMasuk,
        pendingShortfall: pendingShortfallTotal,
        totalDepositDitahan,
        refundDibayar,
        pendingVerifications: pendingCount || 0,
        pendingRefunds: pendingRefundsCount || 0,
      },
      chartData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
