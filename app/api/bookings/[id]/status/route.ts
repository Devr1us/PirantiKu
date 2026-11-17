import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rawId } = await params;
    const supabase = await createClient();

    // 1. Cek sesi login pengguna
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    // 2. Ambil booking berdasarkan UUID id atau kode_booking
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

    let query = supabase
      .from("bookings")
      .select("id, user_id, status, pesan_admin");

    if (isUUID) {
      query = query.eq("id", rawId);
    } else {
      query = query.eq("kode_booking", rawId);
    }

    const { data: booking, error: bErr } = await query.maybeSingle();

    if (bErr || !booking) {
      return NextResponse.json(
        { error: "Booking tidak ditemukan" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    // 3. Pastikan booking milik user tersebut (atau admin)
    if (booking.user_id !== user.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden" },
          {
            status: 403,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            },
          }
        );
      }
    }

    // 4. Ambil pembayaran DP untuk booking ini
    const { data: payments } = await supabase
      .from("payments")
      .select("id, jenis, status, dibayar_pada")
      .eq("booking_id", booking.id)
      .order("id", { ascending: false });

    const latestDp = payments?.find((p) => p.jenis === "dp");

    // 5. Tentukan status pembayaran
    let status: "menunggu_verifikasi" | "terverifikasi" | "ditolak" | "menunggu_dp" = "menunggu_dp";

    const isVerified =
      booking.status === "dp_dibayar" ||
      booking.status === "lunas" ||
      booking.status === "diambil" ||
      booking.status === "selesai" ||
      latestDp?.status === "terverifikasi";

    const isRejected =
      booking.status === "dibatalkan" ||
      latestDp?.status === "ditolak" ||
      Boolean(booking.pesan_admin && /ditolak/i.test(booking.pesan_admin));

    if (isVerified) {
      status = "terverifikasi";
    } else if (isRejected) {
      status = "ditolak";
    } else if (latestDp?.status === "menunggu_verifikasi") {
      status = "menunggu_verifikasi";
    } else {
      status = "menunggu_dp";
    }

    return NextResponse.json(
      { status },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
