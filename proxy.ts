import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Wajib menggunakan supabase.auth.getUser() untuk keamanan otentikasi
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. User yang sudah login diarahkan menjauh dari /login dan /daftar
  if (user && (pathname === "/login" || pathname === "/daftar")) {
    const nextUrl = request.nextUrl.searchParams.get("next") || "/";
    return NextResponse.redirect(new URL(nextUrl, request.url));
  }

  // 2. /checkout, /booking-saya, dan /profil wajib login
  if (
    !user &&
    (pathname.startsWith("/checkout") ||
      pathname.startsWith("/booking-saya") ||
      pathname.startsWith("/profil"))
  ) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 3. /admin/* wajib admin (kecuali /admin/login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!user) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  // 4. Jika admin sudah login dan mengakses /admin/login, arahkan langsung ke /admin
  if (user && pathname === "/admin/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile && profile.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
