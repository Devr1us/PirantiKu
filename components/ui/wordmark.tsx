"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { EASE, DURATION_BASE, DURATION_SHORT } from "@/lib/motion";

interface WordmarkProps {
  variant?: "default" | "white";
  className?: string;
  asLink?: boolean;
}

export function Wordmark({
  variant = "default",
  className = "",
  asLink = true,
}: WordmarkProps) {
  const shouldReduceMotion = useReducedMotion();
  const emptySub = () => () => {};
  const isAlreadyAnimated = React.useSyncExternalStore(
    emptySub,
    () => {
      try {
        return sessionStorage.getItem("pirantiku_wordmark_animated") === "true";
      } catch {
        return true;
      }
    },
    () => true
  );
  const shouldAnimate = !isAlreadyAnimated && !shouldReduceMotion;

  React.useEffect(() => {
    if (shouldAnimate) {
      try {
        sessionStorage.setItem("pirantiku_wordmark_animated", "true");
      } catch {
        // Ignore
      }
    }
  }, [shouldAnimate]);

  const isWhite = variant === "white";
  const mainColor = isWhite ? "text-white" : "text-[#234E5C]";
  const subColor = isWhite ? "text-white/80" : "text-[#5F7A84]";

  const chars = Array.from("PIRANTIKU");

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.035,
        delayChildren: 0.05,
      },
    },
  };

  const charVariants: Variants = {
    hidden: {
      opacity: 0,
      y: "115%",
    },
    visible: {
      opacity: 1,
      y: "0%",
      transition: {
        duration: DURATION_BASE,
        ease: EASE,
      },
    },
  };

  const content = (
    <div
      aria-label="PIRANTIKU BOOKING ALAT"
      className={`inline-flex flex-col items-center justify-center select-none text-center ${className}`}
    >
      <span
        style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
        className={`text-xl sm:text-2xl font-bold uppercase tracking-[0.22em] leading-none pl-[0.22em] ${mainColor}`}
      >
        {shouldAnimate ? (
          <motion.span
            className="inline-flex overflow-hidden pb-[0.1em] -mb-[0.1em]"
            aria-hidden="true"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {chars.map((char, i) => (
              <span key={i} className="inline-block overflow-hidden align-top">
                <motion.span
                  variants={charVariants}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </motion.span>
        ) : (
          <span>PIRANTIKU</span>
        )}
      </span>

      <span
        style={{ fontFamily: "var(--font-open-sans), sans-serif" }}
        className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.45em] leading-tight mt-1 pl-[0.45em] ${subColor}`}
      >
        {shouldAnimate ? (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DURATION_SHORT, delay: 0.35, ease: EASE }}
          >
            BOOKING ALAT
          </motion.span>
        ) : (
          <span>BOOKING ALAT</span>
        )}
      </span>
    </div>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        className="inline-block group focus:outline-none focus:ring-2 focus:ring-[#234E5C]/30 rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return content;
}
