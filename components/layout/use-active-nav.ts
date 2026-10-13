"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { lockProgrammaticScroll } from "@/components/providers/scroll-direction";

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
let currentActiveNav: ActiveNav = "beranda";
let isLocked = false;


function notify(nav: ActiveNav) {
  currentActiveNav = nav;
  listeners.forEach((listener) => listener(nav));
}

/**
 * Derives initial active nav purely from pathname without touching window/document
 * to prevent SSR hydration mismatches.
 */
export function getInitialActiveNav(pathname: string): ActiveNav {
  if (pathname === "/alat" || pathname.startsWith("/alat/")) return "katalog";
  if (pathname.startsWith("/kategori")) return "kategori";
  if (pathname === "/") return "beranda";
  return null;
}

/**
 * Re-evaluates which section is currently active based on:
 * 1. Bottom of page check (window.innerHeight + window.scrollY >= scrollHeight - 4) -> "kontak"
 * 2. IntersectionObserver entries (via visibleSections) -> "kontak" | "cara-sewa"
 * 3. Fallback (hero / other sections) -> "beranda"
 */
function evaluateActiveSection() {
  if (typeof window === "undefined" || isLocked) return;

  const scrollHeight = document.documentElement.scrollHeight;
  const currentBottom = window.innerHeight + window.scrollY;

  // 1. Bottom edge check (anywhere near the page bottom is always kontak)
  if (currentBottom >= scrollHeight - 80) {
    notify("kontak");
    return;
  }

  // 2. If near top of page (hero / header area)
  if (window.scrollY < 120) {
    notify("beranda");
    return;
  }

  const kontakEl = document.getElementById("kontak");
  const caraSewaEl = document.getElementById("cara-sewa");

  // Threshold from viewport top (accounts for 80px sticky header)
  const navThreshold = 220;

  if (kontakEl) {
    const kontakRect = kontakEl.getBoundingClientRect();
    if (kontakRect.top <= navThreshold) {
      notify("kontak");
      return;
    }
  }

  if (caraSewaEl) {
    const caraSewaRect = caraSewaEl.getBoundingClientRect();
    if (caraSewaRect.top <= navThreshold) {
      notify("cara-sewa");
      return;
    }
  }

  notify("beranda");
}

/**
 * Optimistically sets active nav immediately, and locks scroll-spy
 * until smooth scroll finishes ("scrollend" event) or 1000ms timeout fallback.
 */
export function setOptimisticNav(item: ActiveNav) {
  if (typeof window === "undefined") return;

  // Immediately set active nav
  notify(item);

  // Lock observer updates during scrolling via unified programmatic lock
  isLocked = true;
  lockProgrammaticScroll(item, () => {
    isLocked = false;
    // Re-verify after scroll ends (if on home page)
    if (window.location.pathname === "/") {
      evaluateActiveSection();
    }
  });
}

/**
 * Custom hook returning the single source of truth for active nav item:
 * "beranda" | "katalog" | "kategori" | "cara-sewa" | "kontak" | null
 */
export function useActiveNav(): ActiveNav {
  const pathname = usePathname();
  const [activeNav, setActiveNav] = React.useState<ActiveNav>(() =>
    getInitialActiveNav(pathname)
  );

  React.useEffect(() => {
    // Subscribe state updater to module listener
    listeners.add(setActiveNav);

    // If on a page other than "/", determine active item strictly from pathname
    if (pathname !== "/") {
      const pageNav = getInitialActiveNav(pathname);
      notify(pageNav);
      return () => {
        listeners.delete(setActiveNav);
      };
    }

    // --- On home page ("/"): initialize scroll-spy and hash tracking ---
    const hash = window.location.hash;
    if (hash === "#cara-sewa") {
      setOptimisticNav("cara-sewa");
    } else if (hash === "#kontak") {
      setOptimisticNav("kontak");
    } else {
      // Evaluate initial position after mount
      evaluateActiveSection();
    }

    // Observe cara-sewa and kontak to trigger re-evaluation on layout changes
    const observer = new IntersectionObserver(
      () => {
        evaluateActiveSection();
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const caraSewaEl = document.getElementById("cara-sewa");
    const kontakEl = document.getElementById("kontak");

    if (caraSewaEl) observer.observe(caraSewaEl);
    if (kontakEl) observer.observe(kontakEl);

    // Passive scroll listener for real-time section tracking
    let isTicking = false;
    const handleScroll = () => {
      if (!isTicking) {
        window.requestAnimationFrame(() => {
          evaluateActiveSection();
          isTicking = false;
        });
        isTicking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Synchronize browser back/forward and hash changes
    const handleHashOrPopState = () => {
      if (window.location.pathname !== "/") return;
      const currentHash = window.location.hash;
      if (currentHash === "#cara-sewa") {
        setOptimisticNav("cara-sewa");
      } else if (currentHash === "#kontak") {
        setOptimisticNav("kontak");
      } else if (!currentHash || currentHash === "#") {
        if (window.scrollY < 120) {
          setOptimisticNav("beranda");
        } else {
          evaluateActiveSection();
        }
      }
    };

    window.addEventListener("hashchange", handleHashOrPopState);
    window.addEventListener("popstate", handleHashOrPopState);

    // Intercept clicks on anchor tags pointing to /#cara-sewa or /#kontak
    const handleDocumentClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (href === "/#cara-sewa" || href === "#cara-sewa") {
        setOptimisticNav("cara-sewa");
      } else if (href === "/#kontak" || href === "#kontak") {
        setOptimisticNav("kontak");
      } else if (href === "/" && window.location.pathname === "/") {
        setOptimisticNav("beranda");
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });

    // Cleanup all observers, timers, and event listeners on unmount
    return () => {
      listeners.delete(setActiveNav);
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashOrPopState);
      window.removeEventListener("popstate", handleHashOrPopState);
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, [pathname]);

  return activeNav;
}
