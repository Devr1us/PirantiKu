"use client";

import * as React from "react";

export type ScrollDirection = "down" | "up";

// Module-level single source of truth for high-performance synchronous reads without triggering re-renders
export const globalScrollDirectionRef: { current: ScrollDirection } = {
  current: "down",
};
export const globalProgrammaticScrollRef: { current: boolean } = {
  current: false,
};
export const globalProgrammaticTargetRef: { current: string | null } = {
  current: null,
};

let programmaticUnlockTimer: ReturnType<typeof setTimeout> | null = null;
let programmaticScrollEndHandler: (() => void) | null = null;

/**
 * Locks replay animations during programmatic smooth scrolls (e.g. anchor link clicks).
 * Elements passed by will render immediately without animation.
 * Re-enables after "scrollend" event or 1000ms fallback timeout.
 */
export function lockProgrammaticScroll(
  targetId?: string | null,
  onUnlock?: () => void
) {
  if (typeof window === "undefined") return;

  globalProgrammaticScrollRef.current = true;
  globalProgrammaticTargetRef.current = targetId || null;

  if (programmaticUnlockTimer) {
    clearTimeout(programmaticUnlockTimer);
    programmaticUnlockTimer = null;
  }
  if (programmaticScrollEndHandler) {
    window.removeEventListener("scrollend", programmaticScrollEndHandler);
    programmaticScrollEndHandler = null;
  }

  const unlock = () => {
    globalProgrammaticScrollRef.current = false;
    globalProgrammaticTargetRef.current = null;
    if (programmaticScrollEndHandler) {
      window.removeEventListener("scrollend", programmaticScrollEndHandler);
      programmaticScrollEndHandler = null;
    }
    if (programmaticUnlockTimer) {
      clearTimeout(programmaticUnlockTimer);
      programmaticUnlockTimer = null;
    }
    if (onUnlock) {
      onUnlock();
    }
  };

  programmaticScrollEndHandler = unlock;
  window.addEventListener("scrollend", unlock, { once: true });
  programmaticUnlockTimer = setTimeout(unlock, 1000);
}

export function isProgrammaticScrolling(): boolean {
  return globalProgrammaticScrollRef.current;
}

export function getProgrammaticTarget(): string | null {
  return globalProgrammaticTargetRef.current;
}

export function getScrollDirection(): ScrollDirection {
  return globalScrollDirectionRef.current;
}

interface ScrollDirectionContextType {
  directionRef: React.RefObject<ScrollDirection>;
  isProgrammaticScrollRef: React.RefObject<boolean>;
  targetRef: React.RefObject<string | null>;
}

const ScrollDirectionContext = React.createContext<ScrollDirectionContextType>({
  directionRef: globalScrollDirectionRef,
  isProgrammaticScrollRef: globalProgrammaticScrollRef,
  targetRef: globalProgrammaticTargetRef,
});

export function ScrollDirectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const directionRef = React.useRef<ScrollDirection>("down");
  const isProgrammaticScrollRef = React.useRef<boolean>(false);
  const targetRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    let lastScrollY = window.scrollY;
    let isTicking = false;

    const handleScroll = () => {
      if (isTicking) return;
      isTicking = true;

      window.requestAnimationFrame(() => {
        isTicking = false;
        const currentScrollY = window.scrollY;
        const diff = currentScrollY - lastScrollY;

        // Ignore small scroll noise less than 4px
        if (Math.abs(diff) >= 4) {
          const nextDir: ScrollDirection = diff > 0 ? "down" : "up";
          directionRef.current = nextDir;
          globalScrollDirectionRef.current = nextDir;
          lastScrollY = currentScrollY;
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const value = React.useMemo(
    () => ({
      directionRef: globalScrollDirectionRef,
      isProgrammaticScrollRef: globalProgrammaticScrollRef,
      targetRef: globalProgrammaticTargetRef,
    }),
    []
  );

  return (
    <ScrollDirectionContext.Provider value={value}>
      {children}
    </ScrollDirectionContext.Provider>
  );
}

/**
 * Hook to access current scroll direction ref ("down" | "up") without re-rendering
 */
export function useScrollDirection(): React.RefObject<ScrollDirection> {
  const ctx = React.useContext(ScrollDirectionContext);
  return ctx.directionRef;
}

/**
 * Hook to access programmatic scroll status ref
 */
export function useProgrammaticScroll() {
  const ctx = React.useContext(ScrollDirectionContext);
  return {
    isProgrammatic: ctx.isProgrammaticScrollRef,
    target: ctx.targetRef,
  };
}
