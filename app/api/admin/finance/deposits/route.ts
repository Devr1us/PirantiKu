import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth } from "@/lib/finance-server";
import { calculateBookingFinancials } from "@/lib/finance";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status") || "semua";
    const search = searchParams.get("search") || "";

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        *,
        profile:profiles(id, nama, no_hp),
        items:booking_items(*, equipment:equipment(*)),
        payments(*),
        returns:booking_returns(*, damage_reports(*))
      `)
      .gt("deposit", 0)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const depositRows = (bookings || []).map((b) => {
      const fin = calculateBookingFinancials({
        booking: b,
        items: b.items,
        payments: b.payments,
        returns: b.returns,
      });

      return {
        bookingId: b.id,
        kodeBooking: b.kode_booking,
        pelanggan: b.profile?.nama || "Pelanggan",
        noHp: b.profile?.no_hp || "-",
        bookingStatus: b.status,
        statusPembayaran: fin.statusPembayaran,
        depositAwal: fin.depositTarget,
        hariTerlambat: fin.hariTerlambat,
        dendaKeterlambatan: fin.dendaKeterlambatan,
        gantiRugiKerusakan: fin.gantiRugiKerusakan,
        totalPotongan: fin.totalPotonganDeposit,
        depositSisaSeharusnya: fin.depositSisaSeharusnya,
        refundTelahDibayar: fin.refundDepositTelahDibayar,
        sisaPerluRefund: fin.depositSisaPerluRefund,
        kekuranganBayar: fin.kekuranganBayarKerusakan,
        statusDeposit: fin.statusDeposit,
        createdAt: b.created_at,
      };
    });

    let filtered = depositRows;
    if (filterStatus !== "semua") {
      filtered = filtered.filter((r) => r.statusDeposit === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.kodeBooking.toLowerCase().includes(q) ||
          r.pelanggan.toLowerCase().includes(q) ||
          r.noHp.includes(q)
      );
    }

    return NextResponse.json({ data: filtered });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
