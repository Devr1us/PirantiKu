import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();

    // 1. Verifikasi admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya admin yang berwenang mengelola dan menghapus akun pengguna." },
        { status: 403 }
      );
    }

    // 2. Proteksi tidak bisa menghapus akun admin sendiri
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun admin Anda sendiri yang sedang aktif." },
        { status: 400 }
      );
    }

    // 3. Cek apakah pengguna memiliki pesanan aktif yang belum selesai
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("kode_booking, status")
      .eq("user_id", targetUserId)
      .in("status", ["diambil", "dp_dibayar", "lunas", "terlambat"]);

    if (activeBookings && activeBookings.length > 0) {
      const kodeList = activeBookings.map((b) => `#${b.kode_booking}`).join(", ");
      return NextResponse.json(
        {
          error: `Pengguna tidak dapat dihapus karena masih memiliki ${activeBookings.length} pesanan aktif (${kodeList}). Selesaikan atau batalkan pesanan tersebut terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    // 4. Hapus dari tabel public.profiles
    const { error: delErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    if (delErr) {
      return NextResponse.json(
        { error: `Gagal menghapus profil pengguna: ${delErr.message}` },
        { status: 500 }
      );
    }

    // 5. Jika SUPABASE_SERVICE_ROLE_KEY tersedia, hapus juga dari auth.users
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    if (serviceKey && supabaseUrl) {
      try {
        const adminAuthClient = createAdminClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await adminAuthClient.auth.admin.deleteUser(targetUserId);
      } catch (authErr) {
        console.warn("Info: Hapus auth.users dilewati atau tidak tersedia:", authErr);
      }
    }

    // 6. Catat riwayat aksi ke admin_logs jika tabel tersedia
    try {
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        aksi: "Hapus Akun Pengguna",
        nama_tabel: "profiles",
        target_id: targetUserId,
      });
    } catch {
      // Abaikan jika trigger/RLS menangani
    }

    return NextResponse.json({
      success: true,
      message: "Akun pengguna berhasil dihapus.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createClient();

    // 1. Verifikasi admin
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak: Hanya admin yang berwenang mengubah profil pengguna." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nama, no_hp, alamat, role } = body;

    const updateData: {
      nama?: string;
      no_hp?: string;
      alamat?: string | null;
      role?: "user" | "admin";
    } = {};

    if (nama !== undefined) updateData.nama = String(nama).trim();
    if (no_hp !== undefined) updateData.no_hp = String(no_hp).trim();
    if (alamat !== undefined) updateData.alamat = alamat ? String(alamat).trim() : null;
    if (role !== undefined && (role === "user" || role === "admin")) {
      // Jangan izinkan admin mencabut role admin akunnya sendiri agar tidak terkunci
      if (currentUser.id === targetUserId && role !== "admin") {
        return NextResponse.json(
          { error: "Anda tidak dapat menurunkan role admin akun Anda sendiri." },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", targetUserId);

    if (updErr) {
      return NextResponse.json(
        { error: `Gagal memperbarui data pengguna: ${updErr.message}` },
        { status: 500 }
      );
    }

    // Catat log admin
    try {
      await supabase.from("admin_logs").insert({
        admin_id: currentUser.id,
        aksi: "Perbarui Profil/Role Pengguna",
        nama_tabel: "profiles",
        target_id: targetUserId,
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: "Data akun pengguna berhasil diperbarui.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
