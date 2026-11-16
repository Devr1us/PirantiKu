"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/ui/wordmark";
import { P } from "@/components/ui/typography";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  const pathname = usePathname();

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleAuthLinkClick = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetUrl: "/login" | "/daftar"
  ) => {
    e.preventDefault();
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.auth.signOut();
        try {
          localStorage.removeItem("pirantiku_cart_v1");
          localStorage.removeItem("pirantiku_cart_user_id");
          sessionStorage.removeItem("pirantiku_booking_dates");
        } catch {}
      }
    } catch {
      // ignore
    }
    window.location.href = targetUrl;
  };

  return (
    <footer className="w-full bg-[var(--bg-footer)] border-t border-[var(--bg-dark)] text-white/90 mt-auto print:hidden">
      <div className="mx-auto max-w-[1200px] px-4 pt-12 pb-20 sm:pt-16 sm:pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          {/* Sisi Kiri: Wordmark & Deskripsi Singkat */}
          <div className="space-y-4 max-w-sm">
            <Wordmark variant="white" />
            <P className="text-sm text-white/70 leading-relaxed">
              Layanan booking perlengkapan serba ada dengan transparansi stok,
              proses cepat per tanggal booking, dan kondisi alat prima siap pakai.
            </P>
          </div>

          {/* Sisi Kanan: Daftar Tautan Vertikal Rapi */}
          <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Navigasi Cepat
              </span>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link
                    href="/"
                    onClick={(e) => handleLinkClick(e, "/")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link
                    href="/alat"
                    onClick={(e) => handleLinkClick(e, "/alat")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Katalog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cara-booking"
                    onClick={(e) => handleLinkClick(e, "/cara-booking")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Cara Booking
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kontak"
                    onClick={(e) => handleLinkClick(e, "/kontak")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Kontak
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Akun & Akses
              </span>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link
                    href="/login"
                    onClick={(e) => handleAuthLinkClick(e, "/login")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Masuk
                  </Link>
                </li>
                <li>
                  <Link
                    href="/daftar"
                    onClick={(e) => handleAuthLinkClick(e, "/daftar")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Daftar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/booking-saya"
                    onClick={(e) => handleLinkClick(e, "/booking-saya")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Riwayat Booking
                  </Link>
                </li>
                <li>
                  <Link
                    href="/keranjang"
                    onClick={(e) => handleLinkClick(e, "/keranjang")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Keranjang Booking
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Kebijakan & Bantuan
              </span>
              <ul className="space-y-2.5 text-sm font-medium">
                <li>
                  <Link
                    href="/syarat-ketentuan"
                    onClick={(e) => handleLinkClick(e, "/syarat-ketentuan")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Syarat & Ketentuan
                  </Link>
                </li>
                <li>
                  <Link
                    href="/kebijakan-privasi"
                    onClick={(e) => handleLinkClick(e, "/kebijakan-privasi")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    onClick={(e) => handleLinkClick(e, "/faq")}
                    className="text-white/75 hover:text-[var(--accent-gold)] transition-colors cursor-pointer"
                  >
                    Tanya Jawab (FAQ)
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Baris Hak Cipta */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-3 pb-8 sm:pb-2">
          <p className="text-center sm:text-left">&copy; {new Date().getFullYear()} {APP_NAME}. Hak cipta dilindungi undang-undang.</p>
          <p className="text-[11px] text-white/50 text-center sm:text-right">
            Rental alat praktis & transparan untuk segala kebutuhan Anda.
          </p>
        </div>
      </div>
    </footer>
  );
}
