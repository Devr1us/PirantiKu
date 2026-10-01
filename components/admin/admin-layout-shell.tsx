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
  ArrowLeft,
  Menu,
} from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Jika halaman login admin, tampilkan children langsung tanpa sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Kelola Alat", href: "/admin/alat", icon: Package },
    { label: "Kelola Booking", href: "/admin/booking", icon: CalendarDays },
    { label: "Kalender Rental", href: "/admin/kalender", icon: Calendar },
    { label: "Kategori Alat", href: "/admin/kategori", icon: Layers },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        {/* Brand Wordmark Versi Putih */}
        <div className="pb-4 border-b border-white/15">
          <Wordmark variant="white" asLink={false} />
          <div className="mt-2 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A0630F] bg-white px-2.5 py-0.5 rounded-full inline-block">
              Console Pengelola
            </span>
          </div>
        </div>

        {/* Menu Navigasi Admin */}
        <nav className="space-y-1.5">
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

      {/* Bagian Bawah Sidebar */}
      <div className="pt-6 border-t border-white/15 space-y-3">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Ke Beranda Publik</span>
        </Link>
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
        {/* Topbar Mobile */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#234E5C] text-white">
          <Wordmark variant="white" asLink={false} />
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="p-2 rounded-xl text-white hover:bg-white/10"
                aria-label="Buka Menu Admin"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-[#234E5C] text-white p-6 border-r-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        </div>

        {/* Konten Halaman Admin */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 max-w-[1200px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
