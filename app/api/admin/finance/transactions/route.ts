import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth } from "@/lib/finance-server";
import type { PaymentArah, PaymentJenis, PaymentStatus } from "@/types/database";

interface JoinedPayment {
  id: number;
  booking_id: string;
  jenis: PaymentJenis;
  arah: PaymentArah;
  jumlah: number;
  metode: string;
  bukti_url: string | null;
  status: PaymentStatus;
  catatan: string | null;
  created_at: string;
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
  admin?: {
    id: string;
    nama: string;
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
    const search = searchParams.get("search") || "";
    const jenis = searchParams.get("jenis") || "semua";
    const arah = searchParams.get("arah") || "semua";
    const status = searchParams.get("status") || "semua";
    const metode = searchParams.get("metode") || "semua";
    const startDate = searchParams.get("start_date") || "";
    const endDate = searchParams.get("end_date") || "";
    const isExport = searchParams.get("export") === "csv";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = isExport ? 5000 : Math.max(1, parseInt(searchParams.get("limit") || "15", 10));
    const offset = (page - 1) * limit;

    let query = supabase
      .from("payments")
      .select(`
        *,
        booking:bookings(
          id,
          kode_booking,
          status,
          user_id,
          profile:profiles(id, nama, no_hp)
        ),
        admin:profiles!payments_dicatat_oleh_fkey(id, nama)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (jenis !== "semua") {
      query = query.eq("jenis", jenis as PaymentJenis);
    }
    if (arah !== "semua") {
      query = query.eq("arah", arah as PaymentArah);
    }
    if (status !== "semua") {
      query = query.eq("status", status as PaymentStatus);
    }
    if (metode !== "semua") {
      query = query.ilike("metode", `%${metode}%`);
    }
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
    }

    if (!isExport) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filteredData = (data as unknown as JoinedPayment[]) || [];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      filteredData = filteredData.filter((p) => {
        const kode = p.booking?.kode_booking?.toLowerCase() || "";
        const nama = p.booking?.profile?.nama?.toLowerCase() || "";
        const hp = p.booking?.profile?.no_hp?.toLowerCase() || "";
        const cat = p.catatan?.toLowerCase() || "";
        return kode.includes(q) || nama.includes(q) || hp.includes(q) || cat.includes(q);
      });
    }

    if (isExport) {
      const rows = [
        ["ID", "Kode Booking", "Pelanggan", "Jenis Transaksi", "Arah", "Jumlah (IDR)", "Status", "Metode", "Tanggal (WIB)", "Catatan"],
      ];

      for (const p of filteredData) {
        rows.push([
          String(p.id),
          p.booking?.kode_booking || "-",
          p.booking?.profile?.nama || "-",
          p.jenis,
          p.arah || "masuk",
          String(p.jumlah),
          p.status,
          p.metode,
          p.created_at ? new Date(p.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "-",
          `"${(p.catatan || "").replace(/"/g, '""')}"`
        ]);
      }

      const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\r\n");
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="transaksi_keuangan_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      data: filteredData,
      pagination: {
        total: count || filteredData.length,
        page,
        limit,
        totalPages: Math.ceil((count || filteredData.length) / limit),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
