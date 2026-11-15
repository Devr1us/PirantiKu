"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  Calendar,
  Layers,
  Settings,
  ExternalLink,
  Menu,
  User,
  LogOut,
} from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [adminUser, setAdminUser] = React.useState<{ name: string; email: string } | null>(null);

  React.useEffect(() => {
    async function loadAdminUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nama")
            .eq("id", user.id)
            .single();
          setAdminUser({
            name: profile?.nama || user.email?.split("@")[0] || "Admin Pengelola",
            email: user.email || "",
          });
        }
      } catch (err) {
        console.error("Gagal memuat profil admin:", err);
      }
    }
    loadAdminUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Berhasil keluar.");
    } catch (err) {
      console.error("Gagal keluar akun admin:", err);
    } finally {
      // Hard navigation ke /login agar sesi dan cookie terhapus bersih tanpa terhambat cache client
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  };

  // Jika halaman login admin, tampilkan children langsung tanpa sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const userInitials = (adminUser?.name || "AD").slice(0, 2).toUpperCase();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Kelola Alat", href: "/admin/alat", icon: Package },
    { label: "Kelola Booking", href: "/admin/booking", icon: CalendarDays },
    { label: "Kalender Rental", href: "/admin/kalender", icon: Calendar },
    { label: "Kategori Alat", href: "/admin/kategori", icon: Layers },
    { label: "Pengaturan Toko", href: "/admin/pengaturan", icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-5">
        {/* Brand Wordmark Versi Putih */}
        <div className="pb-4 border-b border-white/15">
          <Wordmark variant="white" asLink={false} />
          <div className="mt-2 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0630F] bg-white px-2.5 py-0.5 rounded-full inline-block">
              Console Pengelola
            </span>
          </div>
        </div>

        {/* Profil Singkat Admin */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#A0630F] text-white text-xs font-bold">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {adminUser?.name || "Administrator"}
            </p>
            <p className="text-[10px] text-white/70 truncate">
              {adminUser?.email || "admin@pirantiku.web.id"}
            </p>
          </div>
        </div>

        {/* Menu Navigasi Admin */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  isActive
                    ? "bg-[#A0630F] text-white shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bagian Bawah Sidebar: Profil, Ke Web, & Keluar */}
      <div className="pt-4 border-t border-white/15 space-y-1.5">
        <Link
          href="/"
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0 text-[#E8E8E1]" />
          <span>Lihat Website Publik</span>
        </Link>

        <Link
          href="/profil"
          onClick={() => setIsMobileOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <User className="h-4 w-4 shrink-0 text-[#E8E8E1]" />
          <span>Profil Penyewa</span>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-200 hover:text-white hover:bg-red-500/20 transition-colors text-left cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Keluar Akun Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#FAFAF8] text-[#234E5C]">
      {/* Sidebar Desktop: Petrol Penuh */}
      <aside className="hidden lg:block w-64 bg-[#234E5C] text-white p-6 shrink-0 border-r border-[#E8E8E1]/30">
        <div className="sticky top-6 h-[calc(100vh-3rem)]">
          {sidebarContent}
        </div>
      </aside>

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Mobile: Satu-satunya navbar di halaman admin */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-3.5 bg-[#234E5C] text-white border-b border-white/15 shadow-sm">
          <div className="flex items-center gap-2">
            <Wordmark variant="white" asLink={false} />
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#A0630F] bg-white px-2 py-0.5 rounded-full inline-block">
              Admin
            </span>
          </div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-xl text-white hover:bg-white/10 flex items-center gap-1.5 focus:outline-none"
                aria-label="Buka Menu Pengelola"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-[#234E5C] text-white p-6 border-r-0 overflow-y-auto">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>

        {/* Konten Halaman Admin */}
        <main className="flex-1 p-3.5 sm:p-8 lg:p-10 max-w-[1200px] w-full mx-auto min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
