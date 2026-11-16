"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export type ActiveNav =
  | "beranda"
  | "katalog"
  | "kategori"
  | "cara-sewa"
  | "kontak"
  | null;

type NavListener = (nav: ActiveNav) => void;

// Module-level state & listener subscriptions
const listeners = new Set<NavListener>();

function notify(nav: ActiveNav) {
  listeners.forEach((listener) => listener(nav));
}

/**
 * Menentukan navigasi aktif murni berdasarkan pathname URL
 * - "/" -> "beranda"
 * - "/alat" / "/kategori" -> "katalog"
 * - "/cara-booking" -> "cara-sewa"
 * - "/kontak" -> "kontak"
 */
export function getInitialActiveNav(pathname: string): ActiveNav {
  if (
    pathname === "/alat" ||
    pathname.startsWith("/alat/") ||
    pathname.startsWith("/kategori")
  ) {
    return "katalog";
  }
  if (pathname === "/cara-booking" || pathname.startsWith("/cara-booking")) {
    return "cara-sewa";
  }
  if (pathname === "/kontak" || pathname.startsWith("/kontak")) {
    return "kontak";
  }
  if (pathname === "/") return "beranda";
  return null;
}

export function setOptimisticNav(item: ActiveNav) {
  if (typeof window === "undefined") return;
  notify(item);
}

/**
 * Hook navigasi aktif yang konsisten:
 * Selama pengguna berada di halaman Beranda ("/"), status navigasi akan selalu "beranda"
 * dan tidak akan berubah menjadi "kontak" saat scroll ke bagian bawah.
 */
export function useActiveNav(): ActiveNav {
  const pathname = usePathname();
  const [activeNav, setActiveNav] = React.useState<ActiveNav>(() =>
    getInitialActiveNav(pathname)
  );

  React.useEffect(() => {
    listeners.add(setActiveNav);
    const nav = getInitialActiveNav(pathname);
    setActiveNav(nav);

    return () => {
      listeners.delete(setActiveNav);
    };
  }, [pathname]);

  return activeNav;
}
