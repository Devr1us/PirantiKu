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
let currentActiveNav: ActiveNav = "beranda";
let isLocked = false;
let unlockTimeout: ReturnType<typeof setTimeout> | null = null;
let activeScrollEndHandler: (() => void) | null = null;

// Track intersecting sections for scroll-spy on "/"
const visibleSections = new Set<string>();

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

  // Bottom edge check (last section can be short or pushed to bottom)
  if (currentBottom >= scrollHeight - 4) {
    notify("kontak");
    return;
  }

  if (visibleSections.has("kontak")) {
    notify("kontak");
  } else if (visibleSections.has("cara-sewa")) {
    notify("cara-sewa");
  } else {
    notify("beranda");
  }
}

/**
 * Optimistically sets active nav immediately, and locks scroll-spy
 * until smooth scroll finishes ("scrollend" event) or 1000ms timeout fallback.
 */
export function setOptimisticNav(item: ActiveNav) {
  if (typeof window === "undefined") return;

  // Immediately set active nav
  notify(item);

  // Lock observer updates during scrolling
  isLocked = true;

  if (unlockTimeout) {
    clearTimeout(unlockTimeout);
    unlockTimeout = null;
  }
  if (activeScrollEndHandler) {
    window.removeEventListener("scrollend", activeScrollEndHandler);
    activeScrollEndHandler = null;
  }

  const unlock = () => {
    isLocked = false;
    if (activeScrollEndHandler) {
      window.removeEventListener("scrollend", activeScrollEndHandler);
      activeScrollEndHandler = null;
    }
    if (unlockTimeout) {
      clearTimeout(unlockTimeout);
      unlockTimeout = null;
    }
    // Re-verify after scroll ends (if on home page)
    if (window.location.pathname === "/") {
      evaluateActiveSection();
    }
  };

  activeScrollEndHandler = unlock;
  window.addEventListener("scrollend", unlock, { once: true });
  unlockTimeout = setTimeout(unlock, 1000);
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

    // Setup IntersectionObserver for sections #cara-sewa and #kontak
    // rootMargin: "-35% 0px -60% 0px" targets an imaginary line around 35% from viewport top
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.add(entry.target.id);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });
        evaluateActiveSection();
      },
      {
        rootMargin: "-35% 0px -60% 0px",
        threshold: 0,
      }
    );

    const caraSewaEl = document.getElementById("cara-sewa");
    const kontakEl = document.getElementById("kontak");

    if (caraSewaEl) observer.observe(caraSewaEl);
    if (kontakEl) observer.observe(kontakEl);

    // Passive scroll listener for bottom-of-page edge case & manual scrolling
    const handleScroll = () => {
      evaluateActiveSection();
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
      visibleSections.clear();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", handleHashOrPopState);
      window.removeEventListener("popstate", handleHashOrPopState);
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      if (activeScrollEndHandler) {
        window.removeEventListener("scrollend", activeScrollEndHandler);
      }
      if (unlockTimeout) {
        clearTimeout(unlockTimeout);
      }
    };
  }, [pathname]);

  return activeNav;
}
