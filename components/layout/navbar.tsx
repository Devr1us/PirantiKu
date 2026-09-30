import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";
import { APP_NAME } from "@/lib/constants";
import type { Profile } from "@/types/database";

export async function Navbar() {
  let user = null;
  let profile: Profile | null = null;

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

  return <NavbarClient user={user} profile={profile} appName={APP_NAME} />;
}
