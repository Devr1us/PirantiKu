import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminUserManager, type ProfileWithStats } from "@/components/admin/users/admin-user-manager";

export const metadata: Metadata = {
  title: "Kelola Pengguna | Admin PirantiKu",
  robots: { index: false, follow: false },
};

export default async function AdminPenggunaPage() {
  const supabase = await createClient();

  // 1. Verifikasi autentikasi sesi admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // 2. Verifikasi role admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin") {
    redirect("/admin/login");
  }

  // 3. Ambil data seluruh profil pengguna beserta relasi booking
  const { data: profilesData, error } = await supabase
    .from("profiles")
    .select(`
      *,
      bookings:bookings(id, status)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal mengambil data profil:", error);
  }

  // 4. Hitung ringkasan statistik peminjaman untuk setiap pengguna
  const profilesWithStats: ProfileWithStats[] = (profilesData || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (p: any) => {
      const bList = Array.isArray(p.bookings) ? p.bookings : [];
      const activeCount = bList.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (b: any) =>
          ["diambil", "dp_dibayar", "lunas", "terlambat"].includes(b.status)
      ).length;

      return {
        id: p.id,
        nama: p.nama,
        no_hp: p.no_hp,
        alamat: p.alamat,
        role: p.role,
        created_at: p.created_at,
        total_bookings: bList.length,
        active_bookings: activeCount,
      };
    }
  );

  return (
    <AdminUserManager
      initialProfiles={profilesWithStats}
      currentAdminId={user.id}
    />
  );
}
