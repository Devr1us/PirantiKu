import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyAdminAuth, verifyPaymentTransaction } from "@/lib/finance-server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const auth = await verifyAdminAuth(supabase);
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error || "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, status, alasan } = body;

    if (!paymentId || !["terverifikasi", "ditolak"].includes(status)) {
      return NextResponse.json(
        { error: "Parameter paymentId dan status ('terverifikasi' | 'ditolak') wajib diisi." },
        { status: 400 }
      );
    }

    if (status === "ditolak" && (!alasan || !alasan.trim())) {
      return NextResponse.json(
        { error: "Alasan penolakan pembayaran wajib diisi." },
        { status: 400 }
      );
    }

    const result = await verifyPaymentTransaction(supabase, {
      paymentId: Number(paymentId),
      status,
      alasan,
      adminId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      message: `Pembayaran berhasil ${status === "terverifikasi" ? "disetujui" : "ditolak"}.`,
      isAlreadyInStatus: result.isAlreadyInStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
