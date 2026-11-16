"use client";

import * as React from "react";
import { useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";

interface UseNavbarVisibilityOptions {
  isMobileOpen?: boolean;
  isDropdownOpen?: boolean;
  isHovered?: boolean;
  headerRef?: React.RefObject<HTMLElement | null>;
}

export function useNavbarVisibility({
  isMobileOpen = false,
  isDropdownOpen = false,
  isHovered = false,
  headerRef,
}: UseNavbarVisibilityOptions = {}) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const [isVisible, setIsVisible] = React.useState(true);
  const [isScrolled, setIsScrolled] = React.useState(false);

  const isVisibleRef = React.useRef(true);
  const isScrolledRef = React.useRef(false);
  const lastScrollY = React.useRef(0);
  const idleTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync CSS variable --navbar-offset on <html>
  const updateNavbarOffset = React.useCallback((_visible: boolean) => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--navbar-offset",
        "80px"
      );
    }
  }, []);

  // Initialize --navbar-offset on mount
  React.useEffect(() => {
    updateNavbarOffset(true);
    return () => {
      updateNavbarOffset(true);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [updateNavbarOffset]);

  // If any exemption is active, force navbar visible
  React.useEffect(() => {
    if (isMobileOpen || isDropdownOpen || isHovered) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
    }
  }, [isMobileOpen, isDropdownOpen, isHovered, updateNavbarOffset]);

  // Dengarkan event 'scrollend' native di browser modern agar navbar langsung muncul saat scroll berhenti
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScrollEnd = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
    };

    window.addEventListener("scrollend", handleScrollEnd, { passive: true });
    return () => {
      window.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [updateNavbarOffset]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // If reduced motion is preferred, never hide navbar
    if (shouldReduceMotion) {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
      return;
    }

    const previous = lastScrollY.current;
    const delta = latest - previous;
    lastScrollY.current = latest;

    // Track if page is scrolled past 8px (to show/hide border and subtle shadow)
    const scrolled = latest > 8;
    if (scrolled !== isScrolledRef.current) {
      isScrolledRef.current = scrolled;
      setIsScrolled(scrolled);
    }

    // 1. Selalu tampil jika di bagian atas halaman (termasuk iOS bounce)
    if (latest <= 20) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
      return;
    }

    // 2. Kondisi pengecualian: Menu mobile buka, Dropdown profil buka, Hover, atau keyboard focus
    const isFocusWithin =
      headerRef?.current?.matches?.(":focus-within") || false;

    if (isMobileOpen || isDropdownOpen || isHovered || isFocusWithin) {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
      return;
    }

    // 3. Ketika di-scroll (baik scroll down maupun scroll up):
    // Navbar menghilang / terkena animasi exit
    if (Math.abs(delta) > 2) {
      if (isVisibleRef.current) {
        isVisibleRef.current = false;
        setIsVisible(false);
        updateNavbarOffset(false);
      }

      // Reset timer idle setiap kali user masih melakukan scrolling
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      // 4. Ketika diam atau tidak scroll: navbar akan muncul kembali secara halus
      idleTimerRef.current = setTimeout(() => {
        if (!isVisibleRef.current) {
          isVisibleRef.current = true;
          setIsVisible(true);
          updateNavbarOffset(true);
        }
      }, 650);
    }
  });

  return {
    isVisible,
    isScrolled,
  };
}
