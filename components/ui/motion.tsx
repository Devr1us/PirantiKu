"use client";

import * as React from "react";
import { motion, useInView, useReducedMotion, type Variants } from "motion/react";
import {
  ANIMASI_ULANG,
  EASE,
  Y_OFFSET,
  THRESHOLD_ENTER,
  THRESHOLD_RESET,
  DURATION_MEDIUM,
  DURATION_COUNTUP,
  STAGGER_LIST_ITEM,
} from "@/lib/motion";
import {
  useScrollDirection,
  useProgrammaticScroll,
  isProgrammaticScrolling,
  getProgrammaticTarget,
  getScrollDirection,
  type ScrollDirection,
} from "@/components/providers/scroll-direction";

// Re-export text animation components from unified text-motion module
export {
  AnimatedText,
  HoverRollText,
  type AnimatedTextMode,
} from "./text-motion";

// ============================================================================
// 1. REVEAL (Fade + Direction-Aware Slide 16px with Hysteresis)
// ============================================================================
export interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
  once?: boolean;
}

export function Reveal({
  children,
  delay = 0,
  duration = DURATION_MEDIUM,
  y = Y_OFFSET,
  className = "",
  once,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const scrollDirRef = useScrollDirection();
  const { isProgrammatic, target } = useProgrammaticScroll();

  const effectiveOnce = once !== undefined ? once : !ANIMASI_ULANG;

  // Hysteresis observers: enter at 20%, reset only when completely out at 0%
  const isEntering = useInView(ref, {
    amount: THRESHOLD_ENTER,
    once: effectiveOnce,
  });

  const isExiting = useInView(ref, {
    amount: THRESHOLD_RESET,
    once: effectiveOnce,
  });

  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const [direction, setDirection] = React.useState<ScrollDirection>("down");
  const [isInstant, setIsInstant] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      setIsVisible(true);
      return;
    }

    if (isEntering) {
      const currentDir = scrollDirRef.current || getScrollDirection();
      setDirection(currentDir);

      // Handle programmatic scroll: skip animation for elements passed along the way
      if (isProgrammatic.current || isProgrammaticScrolling()) {
        const targetId = target.current || getProgrammaticTarget();
        const isTarget = targetId && ref.current?.closest(`#${targetId}`);
        setIsInstant(!isTarget);
      } else {
        setIsInstant(false);
      }

      setIsVisible(true);
    } else if (!isExiting && !effectiveOnce) {
      // Completely out of view (0% visible)
      // Check keyboard focus exception: do NOT reset if focused
      const el = ref.current;
      const isFocused =
        el &&
        (el.matches(":focus-within") ||
          (document.activeElement && el.contains(document.activeElement)));

      if (!isFocused) {
        setIsVisible(false);
        setIsInstant(false);
      }
    }
  }, [
    isEntering,
    isExiting,
    effectiveOnce,
    shouldReduceMotion,
    scrollDirRef,
    isProgrammatic,
    target,
  ]);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const initialY = direction === "down" ? y : -y;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: initialY }}
      animate={
        isVisible
          ? {
              opacity: 1,
              y: 0,
              transitionEnd: { transform: "none", willChange: "auto" },
              transition: {
                duration: isInstant ? 0 : duration,
                delay: isInstant ? 0 : delay,
                ease: EASE,
              },
            }
          : {
              opacity: 0,
              y: initialY,
              transition: { duration: 0 },
            }
      }
      style={{ willChange: isVisible ? "transform, opacity" : "auto" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// 2. REVEAL GROUP / STAGGER (Single observer for <= 12 children)
// ============================================================================
interface RevealGroupContextValue {
  isVisible: boolean;
  direction: ScrollDirection;
  isInstant: boolean;
  duration: number;
}

const RevealGroupContext = React.createContext<RevealGroupContextValue>({
  isVisible: false,
  direction: "down",
  isInstant: false,
  duration: DURATION_MEDIUM,
});

export interface RevealGroupProps {
  children: React.ReactNode;
  staggerDelay?: number;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

export function RevealGroup({
  children,
  staggerDelay = STAGGER_LIST_ITEM,
  delay = 0,
  duration = DURATION_MEDIUM,
  className = "",
  once,
}: RevealGroupProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const scrollDirRef = useScrollDirection();
  const { isProgrammatic, target } = useProgrammaticScroll();

  const effectiveOnce = once !== undefined ? once : !ANIMASI_ULANG;

  const isEntering = useInView(ref, {
    amount: THRESHOLD_ENTER,
    once: effectiveOnce,
  });

  const isExiting = useInView(ref, {
    amount: THRESHOLD_RESET,
    once: effectiveOnce,
  });

  const [isVisible, setIsVisible] = React.useState<boolean>(false);
  const [direction, setDirection] = React.useState<ScrollDirection>("down");
  const [isInstant, setIsInstant] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      setIsVisible(true);
      return;
    }

    if (isEntering) {
      const currentDir = scrollDirRef.current || getScrollDirection();
      setDirection(currentDir);

      if (isProgrammatic.current || isProgrammaticScrolling()) {
        const targetId = target.current || getProgrammaticTarget();
        const isTarget = targetId && ref.current?.closest(`#${targetId}`);
        setIsInstant(!isTarget);
      } else {
        setIsInstant(false);
      }

      setIsVisible(true);
    } else if (!isExiting && !effectiveOnce) {
      const el = ref.current;
      const isFocused =
        el &&
        (el.matches(":focus-within") ||
          (document.activeElement && el.contains(document.activeElement)));

      if (!isFocused) {
        setIsVisible(false);
        setIsInstant(false);
      }
    }
  }, [
    isEntering,
    isExiting,
    effectiveOnce,
    shouldReduceMotion,
    scrollDirRef,
    isProgrammatic,
    target,
  ]);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: isInstant ? 0 : staggerDelay,
        delayChildren: isInstant ? 0 : delay,
      },
    },
  };

  return (
    <RevealGroupContext.Provider
      value={{ isVisible, direction, isInstant, duration }}
    >
      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className={className}
      >
        {children}
      </motion.div>
    </RevealGroupContext.Provider>
  );
}

export function RevealGroupItem({
  children,
  className = "",
  y = Y_OFFSET,
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const ctx = React.useContext(RevealGroupContext);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const initialY = ctx.direction === "down" ? y : -y;

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: initialY,
      transition: { duration: 0 },
    },
    visible: {
      opacity: 1,
      y: 0,
      transitionEnd: { transform: "none", willChange: "auto" },
      transition: {
        duration: ctx.isInstant ? 0 : ctx.duration,
        ease: EASE,
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      style={{ willChange: ctx.isVisible ? "transform, opacity" : "auto" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Seamless backwards compatible aliases
export const Stagger = RevealGroup;
export const StaggerItem = RevealGroupItem;

// ============================================================================
// 3. COUNT UP ANIMATION (Capped at 900ms, resets on complete exit)
// ============================================================================
export interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  value,
  duration = DURATION_COUNTUP,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = React.useState<number>(0);
  const [hasStarted, setHasStarted] = React.useState<boolean>(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);

  // Maximum allowed duration is 900ms (0.9s)
  const cappedDuration = Math.min(duration, 0.9);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        // Enter threshold: at least 20% visible
        if (entry.isIntersecting && entry.intersectionRatio >= THRESHOLD_ENTER) {
          if (!hasStarted) {
            setHasStarted(true);
          }
        }
        // Exit threshold: 0% visible (completely offscreen)
        else if (!entry.isIntersecting || entry.intersectionRatio === 0) {
          if (ANIMASI_ULANG && hasStarted) {
            setHasStarted(false);
            setDisplayValue(0);
          }
        }
      },
      { threshold: [THRESHOLD_RESET, THRESHOLD_ENTER] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted, shouldReduceMotion, value]);

  React.useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(
        (timestamp - startTime) / (cappedDuration * 1000),
        1
      );
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(easedProgress * value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasStarted, value, cappedDuration, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return (
      <span className={className}>
        {prefix}
        {value.toLocaleString("id-ID")}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {displayValue.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}
