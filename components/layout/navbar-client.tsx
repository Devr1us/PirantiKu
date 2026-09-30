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
  Sparkles,
  Layers,
  ChevronDown,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  appName: string;
}

export function NavbarClient({ user, profile, appName }: NavbarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems, isLoaded } = useCart();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Katalog Alat", href: "/alat" },
  ];

  if (user) {
    navLinks.push({ label: "Booking Saya", href: "/booking-saya" });
  }

  const isAdmin = profile?.role === "admin";
  const displayName = profile?.nama || user?.user_metadata?.nama || user?.email?.split("@")[0] || "User";
  const userInitials = displayName.slice(0, 2).toUpperCase();

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-200 ${
        isScrolled
          ? "bg-card/85 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-sm border-b border-border/50"
      }`}
    >
      <div className="container mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
            <Layers className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {appName}
            </span>
            <span className="text-[10px] -mt-1 font-semibold tracking-wider text-muted-foreground uppercase">
              Rental Hub
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Panel Admin
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* Cart Button */}
          <Link href="/keranjang" aria-label="Keranjang belanja">
            <Button
              variant="outline"
              size="icon"
              className="relative h-10 w-10 rounded-2xl border-border hover:border-primary/50 transition-all"
            >
              <ShoppingCart className="h-4.5 w-4.5 text-foreground" />
              {isLoaded && totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-warm px-1.5 text-[11px] font-bold text-accent-warm-foreground shadow-sm animate-in zoom-in">
                  {totalItems}
                </span>
              )}
            </Button>
          </Link>

          {/* Auth State Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-2xl h-10 px-3 border-border hover:border-primary/40 focus:ring-1 focus:ring-primary"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/15 text-primary text-xs font-bold">
                      {userInitials}
                    </div>
                    <span className="max-w-[110px] truncate text-xs font-semibold">
                      {displayName}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5">
                  <DropdownMenuLabel className="px-3 py-2 font-normal">
                    <div className="flex flex-col space-y-0.5">
                      <p className="text-sm font-bold text-foreground leading-none">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {isAdmin && (
                        <span className="mt-1 inline-flex w-fit items-center rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                          Administrator
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/booking-saya"
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Booking Saya</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profil"
                      className="cursor-pointer flex items-center gap-2"
                    >
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>Profil Akun</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="cursor-pointer flex items-center gap-2 text-primary font-medium"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        <span>Panel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer flex items-center gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl h-9 px-3.5 font-medium">
                    Masuk
                  </Button>
                </Link>
                <Link href="/daftar">
                  <Button variant="warm" size="sm" className="rounded-xl h-9 px-4 font-semibold">
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden">
            <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl"
                  aria-label="Buka menu navigasi"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm sm:max-w-xs">
                <SheetHeader className="text-left border-b border-border pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <SheetTitle className="text-base font-extrabold text-foreground">
                        {appName}
                      </SheetTitle>
                      <p className="text-[11px] text-muted-foreground">Rental Hub Praktis</p>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex flex-col gap-2 py-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        pathname === link.href
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold bg-primary/15 text-primary border border-primary/20"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Panel Admin
                    </Link>
                  )}
                </div>

                <div className="mt-auto border-t border-border pt-4">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/50">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary font-bold text-xs">
                          {userInitials}
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-sm font-bold truncate">{displayName}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </div>
                      <Link
                        href="/profil"
                        onClick={() => setIsMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl"
                      >
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        Profil Akun
                      </Link>
                      <Button
                        variant="destructive"
                        className="w-full rounded-xl justify-start h-10"
                        onClick={() => {
                          setIsMobileOpen(false);
                          handleSignOut();
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Keluar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                        <Button variant="outline" className="w-full rounded-xl h-11 font-semibold">
                          Masuk
                        </Button>
                      </Link>
                      <Link href="/daftar" onClick={() => setIsMobileOpen(false)}>
                        <Button variant="warm" className="w-full rounded-xl h-11 font-bold">
                          Daftar Sekarang
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
