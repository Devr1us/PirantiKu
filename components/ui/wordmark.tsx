"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";

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
  const isWhite = variant === "white";
  const mainColor = isWhite ? "text-white" : "text-[#234E5C]";
  const subColor = isWhite ? "text-white/80" : "text-[#5F7A84]";

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`inline-flex flex-col items-center justify-center select-none text-center ${className}`}
    >
      <span
        style={{ fontFamily: "var(--font-libre-baskerville), Georgia, serif" }}
        className={`text-xl sm:text-2xl font-bold uppercase tracking-[0.22em] leading-none pl-[0.22em] ${mainColor}`}
      >
        PIRANTIKU
      </span>
      <span
        style={{ fontFamily: "var(--font-open-sans), sans-serif" }}
        className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.45em] leading-tight mt-1 pl-[0.45em] ${subColor}`}
      >
        SEWA ALAT
      </span>
    </motion.div>
  );

  if (asLink) {
    return (
      <Link href="/" className="inline-block group focus:outline-none focus:ring-2 focus:ring-[#234E5C]/30 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
