"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  Menu,
  User as UserIcon,
  LogOut,
  Calendar,
  ShieldAlert,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile, Category } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface NavbarClientProps {
  user: User | null;
  profile: Profile | null;
  categories: Category[];
  whatsappAdmin: string;
}

export function NavbarClient({
  user,
  profile,
  categories,
  whatsappAdmin,
}: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, isLoaded } = useCart();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [hoveredNav, setHoveredNav] = React.useState<string | null>(null);

  const cleanWa = whatsappAdmin.replace(/[^0-9]/g, "");

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Berhasil keluar.");
      router.refresh();
      router.push("/");
    } catch {
      toast.error("Gagal keluar. Silakan coba lagi.");
    }
  };

  const isAdmin = profile?.role === "admin";
  const displayName =
    profile?.nama ||
    user?.user_metadata?.nama ||
    user?.email?.split("@")[0] ||
    "Penyewa";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E8E8E1] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Sisi Kiri: Wordmark PirantiKu */}
        <div className="flex items-center gap-6">
          <Wordmark />
        </div>

        {/* Tengah: Navigasi Desktop (UPPERCASE, 14px, Medium) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {/* BERANDA */}
          <Link
            href="/"
            onMouseEnter={() => setHoveredNav("beranda")}
            onMouseLeave={() => setHoveredNav(null)}
            className={`relative px-3.5 py-2 text-sm font-medium uppercase tracking-wide transition-colors ${
              pathname === "/"
                ? "text-[#234E5C] font-semibold"
                : "text-[#234E5C]/80 hover:text-[#234E5C]"
            }`}
          >
            BERANDA
            {(pathname === "/" || hoveredNav === "beranda") && (
              <motion.div
                layoutId="navbar-underline"
                className="absolute inset-x-3.5 bottom-0 h-[2px] bg-[#234E5C]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          {/* KATALOG */}
          <Link
            href="/alat"
            onMouseEnter={() => setHoveredNav("katalog")}
            onMouseLeave={() => setHoveredNav(null)}
            className={`relative px-3.5 py-2 text-sm font-medium uppercase tracking-wide transition-colors ${
              pathname === "/alat"
                ? "text-[#234E5C] font-semibold"
                : "text-[#234E5C]/80 hover:text-[#234E5C]"
            }`}
          >
            KATALOG
            {(pathname === "/alat" || hoveredNav === "katalog") && (
              <motion.div
                layoutId="navbar-underline"
                className="absolute inset-x-3.5 bottom-0 h-[2px] bg-[#234E5C]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          {/* KATEGORI (Dropdown dari Database) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              onMouseEnter={() => setHoveredNav("kategori")}
              onMouseLeave={() => setHoveredNav(null)}
              className={`relative inline-flex items-center gap-1 px-3.5 py-2 text-sm font-medium uppercase tracking-wide transition-colors cursor-pointer outline-none ${
                pathname.startsWith("/kategori")
                  ? "text-[#234E5C] font-semibold"
                  : "text-[#234E5C]/80 hover:text-[#234E5C]"
              }`}
            >
              <span>KATEGORI</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#5F7A84]" />
              {(pathname.startsWith("/kategori") || hoveredNav === "kategori") && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute inset-x-3.5 bottom-0 h-[2px] bg-[#234E5C]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 p-2 bg-white border-[#E8E8E1] rounded-2xl shadow-lg">
              <DropdownMenuLabel className="text-xs uppercase tracking-wider text-[#5F7A84] px-3 py-1 font-bold">
                Pilih Kategori Alat
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E8E8E1]" />
              {categories.map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link
                    href={`/kategori/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-[#234E5C] hover:bg-[#F3F3EF] rounded-xl cursor-pointer"
                  >
                    <span>{cat.nama}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-[#E8E8E1]" />
              <DropdownMenuItem asChild>
                <Link
                  href="/alat"
                  className="flex items-center justify-between px-3 py-2 text-xs font-bold text-[#A0630F] hover:bg-[#F3F3EF] rounded-xl cursor-pointer"
                >
                  <span>Lihat Semua Kategori &rarr;</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* CARA SEWA (Scroll ke #cara-sewa) */}
          <Link
            href="/#cara-sewa"
            onMouseEnter={() => setHoveredNav("cara-sewa")}
            onMouseLeave={() => setHoveredNav(null)}
            className="relative px-3.5 py-2 text-sm font-medium uppercase tracking-wide text-[#234E5C]/80 hover:text-[#234E5C] transition-colors"
          >
            CARA SEWA
            {hoveredNav === "cara-sewa" && (
              <motion.div
                layoutId="navbar-underline"
                className="absolute inset-x-3.5 bottom-0 h-[2px] bg-[#234E5C]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>

          {/* KONTAK (Scroll ke #kontak) */}
          <Link
            href="/#kontak"
            onMouseEnter={() => setHoveredNav("kontak")}
            onMouseLeave={() => setHoveredNav(null)}
            className="relative px-3.5 py-2 text-sm font-medium uppercase tracking-wide text-[#234E5C]/80 hover:text-[#234E5C] transition-colors"
          >
            KONTAK
            {hoveredNav === "kontak" && (
              <motion.div
                layoutId="navbar-underline"
                className="absolute inset-x-3.5 bottom-0 h-[2px] bg-[#234E5C]"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </Link>
        </nav>

        {/* Sisi Kanan: Keranjang, WhatsApp, Auth (Masuk / Daftar / Avatar) */}
        <div className="flex items-center gap-3">
          {/* Tombol Chat WhatsApp Admin */}
          <a
            href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20sewa%20alat`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-full border border-[#E8E8E1] text-[#234E5C] hover:bg-[#F3F3EF] hover:text-[#A0630F] transition-all"
            aria-label="Chat WhatsApp Admin"
            title="Chat WhatsApp Admin"
          >
            <MessageCircle className="h-5 w-5" />
          </a>

          {/* Ikon Keranjang dengan Badge Jumlah */}
          <Link href="/keranjang" aria-label="Keranjang Sewa" className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E8E1] text-[#234E5C] hover:bg-[#F3F3EF] transition-all">
              <ShoppingCart className="h-5 w-5" />
              {isLoaded && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#A0630F] px-1 text-[11px] font-bold text-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </div>
          </Link>

          {/* Tombol Auth Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 rounded-full border border-[#E8E8E1] bg-white pl-2 pr-3.5 py-1.5 hover:border-[#234E5C] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#234E5C]/20"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#234E5C] text-white text-xs font-bold">
                      {userInitials}
                    </div>
                    <span className="max-w-[120px] truncate text-xs font-bold text-[#234E5C]">
                      {displayName}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-[#5F7A84]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 bg-white border-[#E8E8E1] rounded-2xl shadow-xl">
                  <DropdownMenuLabel className="px-3 py-2 font-normal">
                    <p className="text-sm font-bold text-[#234E5C]">{displayName}</p>
                    <p className="text-xs text-[#5F7A84] truncate">{user.email}</p>
                    {isAdmin && (
                      <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider text-[#A0630F] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                        ADMINISTRATOR
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#E8E8E1]" />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/booking-saya"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#234E5C] hover:bg-[#F3F3EF] rounded-xl cursor-pointer"
                    >
                      <Calendar className="h-4 w-4 text-[#5F7A84]" />
                      <span>Booking Saya</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profil"
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#234E5C] hover:bg-[#F3F3EF] rounded-xl cursor-pointer"
                    >
                      <UserIcon className="h-4 w-4 text-[#5F7A84]" />
                      <span>Profil Akun</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#234E5C] hover:bg-[#F3F3EF] rounded-xl cursor-pointer"
                      >
                        <ShieldAlert className="h-4 w-4 text-[#A0630F]" />
                        <span>Panel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-[#E8E8E1]" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar Akun</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold">
                    MASUK
                  </Button>
                </Link>
                <Link href="/daftar">
                  <Button variant="warm" size="sm" className="h-9 px-5 text-xs font-bold">
                    DAFTAR
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Mobile */}
          <div className="lg:hidden flex items-center">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E8E1] text-[#234E5C] hover:bg-[#F3F3EF] transition-colors"
                  aria-label="Buka Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm bg-white p-6 flex flex-col justify-between">
                <div>
                  <SheetHeader className="border-b border-[#E8E8E1] pb-4 mb-4 text-left">
                    <Wordmark />
                  </SheetHeader>

                  <div className="flex flex-col space-y-1.5 pt-2">
                    <Link
                      href="/"
                      onClick={() => setIsMobileOpen(false)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-bold uppercase ${
                        pathname === "/"
                          ? "bg-[#F3F3EF] text-[#234E5C]"
                          : "text-[#234E5C] hover:bg-[#F3F3EF]"
                      }`}
                    >
                      BERANDA
                    </Link>
                    <Link
                      href="/alat"
                      onClick={() => setIsMobileOpen(false)}
                      className={`px-3 py-2.5 rounded-xl text-sm font-bold uppercase ${
                        pathname === "/alat"
                          ? "bg-[#F3F3EF] text-[#234E5C]"
                          : "text-[#234E5C] hover:bg-[#F3F3EF]"
                      }`}
                    >
                      KATALOG ALAT
                    </Link>

                    {/* Submenu Kategori Mobile */}
                    <div className="pt-2 pb-1">
                      <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#5F7A84]">
                        Kategori Alat
                      </span>
                      <div className="mt-1 space-y-1 pl-2">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/kategori/${cat.slug}`}
                            onClick={() => setIsMobileOpen(false)}
                            className="block px-3 py-1.5 text-xs font-semibold text-[#234E5C] hover:bg-[#F3F3EF] rounded-lg"
                          >
                            {cat.nama}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <Link
                      href="/#cara-sewa"
                      onClick={() => setIsMobileOpen(false)}
                      className="px-3 py-2.5 rounded-xl text-sm font-bold uppercase text-[#234E5C] hover:bg-[#F3F3EF]"
                    >
                      CARA SEWA
                    </Link>

                    <Link
                      href="/#kontak"
                      onClick={() => setIsMobileOpen(false)}
                      className="px-3 py-2.5 rounded-xl text-sm font-bold uppercase text-[#234E5C] hover:bg-[#F3F3EF]"
                    >
                      KONTAK
                    </Link>

                    {user && (
                      <Link
                        href="/booking-saya"
                        onClick={() => setIsMobileOpen(false)}
                        className="px-3 py-2.5 rounded-xl text-sm font-bold uppercase text-[#234E5C] hover:bg-[#F3F3EF]"
                      >
                        BOOKING SAYA
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold uppercase text-[#234E5C] bg-[#FEF3C7] border border-[#FDE68A]"
                      >
                        <ShieldAlert className="h-4 w-4 text-[#A0630F]" />
                        PANEL ADMIN
                      </Link>
                    )}
                  </div>
                </div>

                {/* Bagian Bawah Menu Mobile */}
                <div className="border-t border-[#E8E8E1] pt-4 space-y-3">
                  <a
                    href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20sewa%20alat`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full border border-[#E8E8E1] text-xs font-bold text-[#234E5C] hover:bg-[#F3F3EF]"
                  >
                    <MessageCircle className="h-4 w-4 text-[#A0630F]" />
                    Chat WhatsApp Admin
                  </a>

                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-[#F3F3EF]">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#234E5C] text-white text-xs font-bold">
                          {userInitials}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-bold text-[#234E5C] truncate">
                            {displayName}
                          </span>
                          <span className="text-[11px] text-[#5F7A84] truncate">
                            {user.email}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full text-xs font-bold"
                        onClick={() => {
                          setIsMobileOpen(false);
                          handleSignOut();
                        }}
                      >
                        Keluar Akun
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                          MASUK
                        </Button>
                      </Link>
                      <Link href="/daftar" onClick={() => setIsMobileOpen(false)}>
                        <Button variant="warm" size="sm" className="w-full text-xs font-bold">
                          DAFTAR
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
