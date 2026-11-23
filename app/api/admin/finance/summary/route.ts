import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth } from "@/lib/finance-server";

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

    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date();

    if (period === "hari_ini") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "7_hari") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "bulan_ini") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "kustom" && customStart && customEnd) {
      startDate = new Date(customStart + "T00:00:00");
      endDate = new Date(customEnd + "T23:59:59.999");
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Ambil seluruh pembayaran terverifikasi dalam rentang periode
    const { data: periodPayments, error: pErr } = await supabase
      .from("payments")
      .select("id, jenis, arah, jumlah, status, created_at, tanggal_transaksi, dibayar_pada")
      .eq("status", "terverifikasi")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

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
      const arah = p.arah || (p.jenis === "refund_deposit" ? "keluar" : "masuk");
      const tgl = (p.created_at || p.tanggal_transaksi || p.dibayar_pada || "").slice(0, 10);

      if (arah === "masuk") {
        totalPemasukan += jml;
        if (p.jenis === "dp") dpMasuk += jml;
        else if (p.jenis === "pelunasan") pelunasanMasuk += jml;
        else if (p.jenis === "denda" || p.jenis === "denda_keterlambatan") dendaMasuk += jml;
        else if (p.jenis === "ganti_rugi") gantiRugiMasuk += jml;

        if (tgl) {
          dailyMap[tgl] = (dailyMap[tgl] || 0) + jml;
        }
      } else if (arah === "keluar") {
        if (p.jenis === "refund_deposit") {
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
        payments(id, jenis, arah, status, jumlah),
        returns:booking_returns(id, denda_terlambat, total_ganti_rugi)
      `)
      .not("status", "in", "('selesai','dibatalkan')");

    let totalDepositDitahan = 0;
    for (const b of activeBookings || []) {
      const hasVerifiedPayment = b.payments?.some((p) => p.status === "terverifikasi");
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

    // 3. Jumlah pembayaran menunggu verifikasi
    const { count: pendingCount } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", "menunggu_verifikasi");

    // Format chart series
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
        totalDepositDitahan,
        refundDibayar,
        pendingVerifications: pendingCount || 0,
      },
      chartData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
