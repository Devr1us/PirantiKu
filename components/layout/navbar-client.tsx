"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup, useReducedMotion, type Transition } from "motion/react";
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
import type { Profile } from "@/types/database";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { useActiveNav, setOptimisticNav } from "@/components/layout/use-active-nav";
import { useNavbarVisibility } from "@/components/layout/use-navbar-visibility";
import { HoverRollText } from "@/components/ui/text-motion";
import { normalizeAdminPhone } from "@/lib/constants";

interface NavbarClientProps {
  user: User | null;
  profile: Profile | null;
  whatsappAdmin: string;
}

export function NavbarClient({
  user,
  profile,
  whatsappAdmin,
}: NavbarClientProps) {
  const pathname = usePathname();
  const { totalItems, isLoaded } = useCart();
  const [clientUser, setClientUser] = React.useState<User | null>(null);
  const [clientProfile, setClientProfile] = React.useState<Profile | null>(null);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const headerRef = React.useRef<HTMLElement | null>(null);

  // Gabungkan status autentikasi server prop dengan pembaruan real-time client
  const currentUser = clientUser ?? user;
  const currentProfile = clientProfile ?? profile;

  // Dengarkan perubahan sesi auth secara real-time di browser
  React.useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authUser = session?.user ?? null;
      setClientUser(authUser);

      if (authUser) {
        try {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();
          setClientProfile((prof as Profile) || null);
        } catch {
          // ignore
        }
      } else {
        setClientProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Otomatis tutup menu hamburger mobile ketika viewport beralih ke mode desktop (>= 1024px / lg)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const handleViewportChange = () => {
      if (window.innerWidth >= 1024 || mediaQuery.matches) {
        setIsMobileOpen((prev) => (prev ? false : prev));
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleViewportChange);
    } else {
      mediaQuery.addListener(handleViewportChange);
    }

    window.addEventListener("resize", handleViewportChange, { passive: true });

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleViewportChange);
      } else {
        mediaQuery.removeListener(handleViewportChange);
      }
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  const activeNav = useActiveNav();
  const shouldReduceMotion = useReducedMotion();

  const { isVisible, isScrolled } = useNavbarVisibility({
    isMobileOpen,
    isDropdownOpen,
    isHovered,
    headerRef,
  });

  const springTransition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 500, damping: 40 };

  const cleanWa = normalizeAdminPhone(whatsappAdmin);

  // Jangan render navbar publik di area admin agar tidak duplicate dengan AdminLayout
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const handleNavLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (pathname === href) {
      e.preventDefault();
      if (window.location.hash) {
        history.replaceState(null, "", href);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleMobileNavLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    setIsMobileOpen(false);
    if (pathname === href) {
      e.preventDefault();
      if (window.location.hash) {
        history.replaceState(null, "", href);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      try {
        localStorage.removeItem("pirantiku_cart_v1");
        localStorage.removeItem("pirantiku_cart_user_id");
        sessionStorage.removeItem("pirantiku_booking_dates");
      } catch {
        // ignore
      }
      toast.success("Berhasil keluar.");
    } catch (err) {
      console.error("Gagal keluar:", err);
    } finally {
      // Hard navigation ke /login agar sesi dan cookie terhapus bersih tanpa terhambat cache client
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  };

  const isAdmin = currentProfile?.role === "admin";
  const displayName =
    currentProfile?.nama ||
    currentUser?.user_metadata?.nama ||
    currentUser?.email?.split("@")[0] ||
    "User";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  // Sembunyikan avatar profil saat masih berada di halaman login/daftar agar tidak muncul sebelum redirect selesai
  const isAuthPage = pathname === "/login" || pathname === "/daftar";
  const shouldShowUser = Boolean(currentUser && !isAuthPage);

  return (
    <motion.header
      ref={headerRef}
      animate={{
        y: isVisible ? 0 : "-100%",
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        duration: isVisible ? 0.3 : 0.25,
        ease: isVisible ? [0.16, 1, 0.3, 1] : [0.4, 0, 0.2, 1],
      }}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className={`sticky top-0 z-50 w-full h-20 box-border bg-white/85 backdrop-blur-md transition-[border-color,box-shadow] duration-200 print:hidden ${isScrolled
        ? "border-b border-[var(--border-soft)] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
        : "border-b border-[var(--border-soft)] shadow-none"
        }`}
    >
      <div className="site-container flex h-full items-center justify-between gap-4 sm:gap-6">
        {/* Sisi Kiri: Wordmark PirantiKu */}
        <div className="flex items-center min-w-0 shrink-0">
          <Wordmark />
        </div>

        {/* Tengah: Navigasi Desktop (UPPERCASE, 14px, Medium/Bold) */}
        <LayoutGroup id="navbar-desktop">
          <nav className="hidden lg:flex items-center justify-center gap-2 xl:gap-5 mx-auto">
            {/* BERANDA */}
            <Link
              href="/"
              onClick={(e) => handleNavLinkClick(e, "/")}
              aria-current={activeNav === "beranda" ? "page" : undefined}
              className={`relative px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors cursor-pointer ${activeNav === "beranda"
                  ? "text-[var(--bg-dark)] font-bold"
                  : "text-[var(--text-main)]/80 hover:text-[var(--bg-dark)]"
                }`}
            >
              <HoverRollText text="BERANDA" />
              {activeNav === "beranda" && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[var(--accent-gold)]"
                  transition={springTransition}
                />
              )}
            </Link>

            {/* KATALOG */}
            <Link
              href="/alat"
              onClick={(e) => handleNavLinkClick(e, "/alat")}
              aria-current={activeNav === "katalog" ? "page" : undefined}
              className={`relative px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors cursor-pointer ${activeNav === "katalog"
                  ? "text-[var(--bg-dark)] font-bold"
                  : "text-[var(--text-main)]/80 hover:text-[var(--bg-dark)]"
                }`}
            >
              <HoverRollText text="KATALOG" />
              {activeNav === "katalog" && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[var(--accent-gold)]"
                  transition={springTransition}
                />
              )}
            </Link>

            {/* CARA BOOKING */}
            <Link
              href="/cara-booking"
              onClick={(e) => handleNavLinkClick(e, "/cara-booking")}
              aria-current={activeNav === "cara-sewa" ? "page" : undefined}
              className={`relative px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors cursor-pointer ${activeNav === "cara-sewa"
                  ? "text-[var(--bg-dark)] font-bold"
                  : "text-[var(--text-main)]/80 hover:text-[var(--bg-dark)]"
                }`}
            >
              <HoverRollText text="CARA BOOKING" />
              {activeNav === "cara-sewa" && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[var(--accent-gold)]"
                  transition={springTransition}
                />
              )}
            </Link>

            {/* KONTAK */}
            <Link
              href="/kontak"
              onClick={(e) => handleNavLinkClick(e, "/kontak")}
              aria-current={activeNav === "kontak" ? "page" : undefined}
              className={`relative px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors cursor-pointer ${activeNav === "kontak"
                  ? "text-[var(--bg-dark)] font-bold"
                  : "text-[var(--text-main)]/80 hover:text-[var(--bg-dark)]"
                }`}
            >
              <HoverRollText text="KONTAK" />
              {activeNav === "kontak" && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute inset-x-4 bottom-0 h-[2px] rounded-full bg-[var(--accent-gold)]"
                  transition={springTransition}
                />
              )}
            </Link>
          </nav>
        </LayoutGroup>

        {/* Sisi Kanan: Keranjang, WhatsApp, Auth (Masuk / Daftar / Avatar) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          {/* Tombol Hubungi Admin via WhatsApp */}
          <a
            href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center h-10 w-10 rounded-full border border-[var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--bg-sage)] hover:text-[var(--accent-gold)] transition-all"
            aria-label="Hubungi Admin via WhatsApp"
            title="Hubungi Admin via WhatsApp"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="sr-only">Hubungi Admin via WhatsApp</span>
          </a>

          {/* Ikon Keranjang dengan Badge Jumlah (Khusus Pelanggan, disembunyikan untuk Admin) */}
          {!isAdmin && (
            <Link href="/keranjang" aria-label="Keranjang Booking" className="relative shrink-0">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--bg-sage)] transition-all">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="sr-only">Keranjang Booking</span>
                {isLoaded && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 sm:h-5 sm:min-w-5 items-center justify-center rounded-full bg-[var(--accent-gold)] px-1 text-[10px] sm:text-[11px] font-bold text-[var(--bg-dark)] shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
          )}

          {/* Tombol Auth Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {shouldShowUser ? (
              <motion.div
                key="desktop-profile-badge"
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <DropdownMenu onOpenChange={setIsDropdownOpen} modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2.5 rounded-full border border-[var(--border-soft)] bg-white pl-2 pr-3.5 py-1.5 hover:border-[var(--bg-dark)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--bg-dark)]/20"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-dark)] text-white text-xs font-bold">
                        {userInitials}
                      </div>
                      <span className="max-w-[120px] truncate text-xs font-bold text-[var(--bg-dark)]">
                        {displayName}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 bg-white border-[var(--border-soft)] rounded-2xl shadow-xl">
                    <DropdownMenuLabel className="px-3 py-2 font-normal">
                      <p className="text-sm font-bold text-[var(--bg-dark)]">{displayName}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{currentUser?.email}</p>
                      {isAdmin && (
                        <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider text-[var(--bg-dark)] bg-[var(--accent-gold)]/20 px-2 py-0.5 rounded-full border border-[var(--accent-gold)]/40">
                          ADMINISTRATOR
                        </span>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--border-soft)]" />
                    {!isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/booking-saya"
                          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-sage)] rounded-xl cursor-pointer"
                        >
                          <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
                          <span>Riwayat Booking</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[var(--bg-dark)] hover:bg-[var(--bg-sage)] rounded-xl cursor-pointer"
                        >
                          <ShieldAlert className="h-4 w-4 text-[var(--accent-gold)]" />
                          <span>Panel Admin</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profil"
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-sage)] rounded-xl cursor-pointer"
                      >
                        <UserIcon className="h-4 w-4 text-[var(--text-muted)]" />
                        <span>Profil Akun</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[var(--border-soft)]" />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Keluar Akun</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold border-[var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--bg-sage)] hover:border-[var(--bg-dark)]">
                    <HoverRollText text="MASUK" />
                  </Button>
                </Link>
                <Link href="/daftar">
                  <Button variant="warm" size="sm" className="h-9 px-5 text-xs font-bold bg-[var(--accent-gold)] text-[var(--bg-dark)] hover:bg-[#E0A82E]">
                    <HoverRollText text="DAFTAR" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Mobile */}
          <div className="lg:hidden flex items-center shrink-0">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--bg-sage)] transition-colors cursor-pointer"
                  aria-label="Buka Menu"
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="lg:hidden w-[85vw] max-w-sm bg-white p-6 flex flex-col justify-between"
                overlayClassName="lg:hidden"
              >
                <div>
                  <SheetHeader className="border-b border-[var(--border-soft)] pb-4 mb-4 text-left">
                    <Wordmark />
                  </SheetHeader>

                  <LayoutGroup id="navbar-mobile">
                    <div className="flex flex-col space-y-1.5 pt-2">
                      <Link
                        href="/"
                        onClick={(e) => handleMobileNavLinkClick(e, "/")}
                        aria-current={activeNav === "beranda" ? "page" : undefined}
                        className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase transition-colors ${activeNav === "beranda"
                          ? "bg-[var(--bg-sage)] text-[var(--bg-dark)]"
                          : "text-[var(--text-main)] hover:bg-[var(--bg-sage)]"
                          }`}
                      >
                        {activeNav === "beranda" && (
                          <motion.span
                            layoutId="nav-underline-mobile"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent-gold)]"
                            transition={springTransition}
                          />
                        )}
                        BERANDA
                      </Link>

                      <Link
                        href="/alat"
                        onClick={(e) => handleMobileNavLinkClick(e, "/alat")}
                        aria-current={activeNav === "katalog" ? "page" : undefined}
                        className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase transition-colors ${activeNav === "katalog"
                          ? "bg-[var(--bg-sage)] text-[var(--bg-dark)]"
                          : "text-[var(--text-main)] hover:bg-[var(--bg-sage)]"
                          }`}
                      >
                        {activeNav === "katalog" && (
                          <motion.span
                            layoutId="nav-underline-mobile"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent-gold)]"
                            transition={springTransition}
                          />
                        )}
                        KATALOG ALAT
                      </Link>

                      <Link
                        href="/cara-booking"
                        onClick={(e) => handleMobileNavLinkClick(e, "/cara-booking")}
                        aria-current={activeNav === "cara-sewa" ? "page" : undefined}
                        className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase transition-colors ${activeNav === "cara-sewa"
                          ? "bg-[var(--bg-sage)] text-[var(--bg-dark)]"
                          : "text-[var(--text-main)] hover:bg-[var(--bg-sage)]"
                          }`}
                      >
                        {activeNav === "cara-sewa" && (
                          <motion.span
                            layoutId="nav-underline-mobile"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent-gold)]"
                            transition={springTransition}
                          />
                        )}
                        CARA BOOKING
                      </Link>

                      <Link
                        href="/kontak"
                        onClick={(e) => handleMobileNavLinkClick(e, "/kontak")}
                        aria-current={activeNav === "kontak" ? "page" : undefined}
                        className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase transition-colors ${activeNav === "kontak"
                          ? "bg-[var(--bg-sage)] text-[var(--bg-dark)]"
                          : "text-[var(--text-main)] hover:bg-[var(--bg-sage)]"
                          }`}
                      >
                        {activeNav === "kontak" && (
                          <motion.span
                            layoutId="nav-underline-mobile"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent-gold)]"
                            transition={springTransition}
                          />
                        )}
                        KONTAK
                      </Link>

                      {shouldShowUser && !isAdmin && (
                        <Link
                          href="/booking-saya"
                          onClick={() => setIsMobileOpen(false)}
                          className="px-3 py-2.5 rounded-xl text-sm font-bold uppercase text-[var(--text-main)] hover:bg-[var(--bg-sage)]"
                        >
                          RIWAYAT BOOKING
                        </Link>
                      )}

                      {shouldShowUser && (
                        <Link
                          href="/profil"
                          onClick={() => setIsMobileOpen(false)}
                          className="px-3 py-2.5 rounded-xl text-sm font-bold uppercase text-[var(--text-main)] hover:bg-[var(--bg-sage)]"
                        >
                          PROFIL AKUN
                        </Link>
                      )}

                      {shouldShowUser && isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsMobileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold uppercase text-[var(--bg-dark)] bg-[var(--accent-gold)]/20 border border-[var(--accent-gold)]/40"
                        >
                          <ShieldAlert className="h-4 w-4 text-[var(--accent-gold)]" />
                          PANEL ADMIN
                        </Link>
                      )}
                    </div>
                  </LayoutGroup>
                </div>

                {/* Bagian Bawah Menu Mobile */}
                <div className="border-t border-[var(--border-soft)] pt-4 space-y-3">
                  <a
                    href={`https://wa.me/${cleanWa}?text=Halo%20Admin%20PirantiKu,%20saya%20ingin%20tanya%20seputar%20booking%20alat`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-2.5 rounded-full border border-[var(--border-soft)] text-xs font-bold text-[var(--text-main)] hover:bg-[var(--bg-sage)]"
                  >
                    <span>Hubungi Admin via WhatsApp</span>
                  </a>

                  {shouldShowUser ? (
                    <motion.div
                      key="mobile-user-profile"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <Link
                        href="/profil"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-sage)] hover:bg-[var(--border-soft)] transition-colors group cursor-pointer"
                        title="Buka Profil Akun"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-dark)] text-white text-xs font-bold">
                            {userInitials}
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-[var(--bg-dark)] truncate">
                              {displayName}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] truncate">
                              {currentUser?.email}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--bg-dark)] group-hover:underline pl-2 shrink-0">
                          Profil
                        </span>
                      </Link>
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
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                        <Button variant="outline" size="sm" className="w-full text-xs font-bold border-[var(--border-soft)] text-[var(--text-main)] hover:bg-[var(--bg-sage)]">
                          MASUK
                        </Button>
                      </Link>
                      <Link href="/daftar" onClick={() => setIsMobileOpen(false)}>
                        <Button variant="warm" size="sm" className="w-full text-xs font-bold bg-[var(--accent-gold)] text-[var(--bg-dark)] hover:bg-[#E0A82E]">
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
    </motion.header>
  );
}
