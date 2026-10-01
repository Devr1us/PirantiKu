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

  // Sync CSS variable --navbar-offset on <html>
  const updateNavbarOffset = React.useCallback((visible: boolean) => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--navbar-offset",
        visible ? "80px" : "0px"
      );
    }
  }, []);

  // Initialize --navbar-offset on mount
  React.useEffect(() => {
    updateNavbarOffset(true);
    return () => {
      updateNavbarOffset(true);
    };
  }, [updateNavbarOffset]);

  // If any exemption is active, force navbar visible
  React.useEffect(() => {
    if (isMobileOpen || isDropdownOpen || isHovered) {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
    }
  }, [isMobileOpen, isDropdownOpen, isHovered, updateNavbarOffset]);

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

    // Always visible at or above top of page (including iOS bounce negative values)
    if (latest <= 0) {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
      return;
    }

    // Check exemption conditions:
    // - Mobile sheet is open
    // - Dropdown is open
    // - Pointer is hovering over navbar
    // - Element inside navbar has keyboard focus (:focus-within)
    const isFocusWithin =
      headerRef?.current?.matches?.(":focus-within") || false;

    if (isMobileOpen || isDropdownOpen || isHovered || isFocusWithin) {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
      return;
    }

    // Scroll DOWN > 8px and scrollY > 100px -> hide navbar
    if (delta > 8 && latest > 100) {
      if (isVisibleRef.current) {
        isVisibleRef.current = false;
        setIsVisible(false);
        updateNavbarOffset(false);
      }
    }
    // Scroll UP > 4px -> show navbar again
    else if (delta < -4) {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
        updateNavbarOffset(true);
      }
    }
  });

  return {
    isVisible,
    isScrolled,
  };
}
