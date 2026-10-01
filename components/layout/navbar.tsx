import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import type { Profile, Category } from "@/types/database";

export async function Navbar() {
  let user = null;
  let profile: Profile | null = null;
  let categories: Category[] = [];
  let whatsappAdmin = DEFAULT_SETTINGS.whatsapp_admin;

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

    // Ambil daftar kategori dari database untuk dropdown
    const { data: catData } = await supabase
      .from("categories")
      .select("*")
      .order("urutan", { ascending: true });

    if (catData) {
      categories = catData as Category[];
    }

    // Ambil kontak WhatsApp dari settings
    const { data: waData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "whatsapp_admin")
      .single();

    if (waData?.value) {
      whatsappAdmin = waData.value;
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
      categories={categories}
      whatsappAdmin={whatsappAdmin}
    />
  );
}
