import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";
import { DEFAULT_SETTINGS, normalizeAdminPhone } from "@/lib/constants";
import type { Profile, Category } from "@/types/database";

export async function Navbar() {
  let user = null;
  let profile: Profile | null = null;
  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;
  let categories: Category[] = [];

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;

    if (user) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = profileData as Profile | null;
    }

    // Ambil kontak WhatsApp dari settings
    const { data: waData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_admin")
      .single();

    if (waData?.value) {
      whatsappAdmin = normalizeAdminPhone(waData.value);
    }

    // Ambil daftar kategori untuk dropdown navbar
    const { data: catData } = await supabase
      .from("categories")
      .select("id, nama, slug, ikon")
      .eq("aktif", true)
      .order("urutan", { ascending: true });

    if (catData) {
      categories = catData as Category[];
    }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw err;
    }
    console.error("Gagal memuat status user di Navbar:", err);
  }

  return (
    <NavbarClient
      user={user}
      profile={profile}
      whatsappAdmin={whatsappAdmin}
      categories={categories}
    />
  );
}
