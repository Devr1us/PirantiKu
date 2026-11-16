"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

interface WordmarkProps {
  variant?: "default" | "white";
  className?: string;
  asLink?: boolean;
  showLogo?: boolean;
  logoClassName?: string;
  size?: "default" | "sm" | "lg";
}

export function Wordmark({
  variant = "default",
  className = "",
  asLink = true,
  showLogo = true,
  logoClassName = "",
  size = "default",
}: WordmarkProps) {
  const isWhite = variant === "white";
  const mainColor = isWhite ? "text-white" : "text-[#234E5C]";
  const subColor = isWhite ? "text-white/80" : "text-[#5F7A84]";
  const logoSrc = isWhite ? "/logo-white.png" : "/logo.png";
  const isSmall = size === "sm";

  // Ukuran sesuai spesifikasi prompt:
  // Desktop (>=768px): ikon 44x44, wordmark 24px, subtitle 9.5px
  // Mobile (<768px): ikon 36x36, wordmark 22px, subtitle 8px
  // Khusus size="sm" (admin sidebar / small): ikon 32px, wordmark 18px, subtitle 7.5px
  const iconSizeClass = isSmall
    ? "w-8 h-8"
    : "w-[36px] h-[36px] md:w-[44px] md:h-[44px]";

  const wordmarkSizeClass = isSmall
    ? "text-[18px]"
    : "text-[22px] md:text-[24px]";

  const subtitleSizeClass = isSmall
    ? "text-[7.5px]"
    : "text-[8px] md:text-[9.5px]";

  const content = (
    <div
      aria-label="PIRANTIKU BOOKING ALAT SERBA ADA"
      className={`inline-flex items-center gap-[14px] shrink-0 flex-nowrap select-none ${className}`}
    >
      {showLogo && (
        <div className="relative flex items-center justify-center shrink-0">
          <Image
            src={logoSrc}
            alt="Logo PirantiKu"
            width={44}
            height={44}
            priority
            unoptimized
            className={`${iconSizeClass} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 ${logoClassName}`}
          />
        </div>
      )}

      {/* Blok Teks: Flex Column, Gap 4px, Line-height 1 */}
      <div className="inline-flex flex-col gap-[4px] leading-none shrink-0 text-left">
        {/* Wordmark: font-bold, uppercase, letter-spacing 0.28em, margin-right: -0.28em */}
        <span
          style={{
            fontFamily: "var(--font-libre-baskerville), Georgia, serif",
            letterSpacing: "0.28em",
            marginRight: "-0.28em",
          }}
          className={`block font-bold uppercase leading-none ${wordmarkSizeClass} ${mainColor}`}
        >
          PIRANTIKU
        </span>

        {/* Subtitle: Selebar Wordmark, Tepi Kiri & Kanan Sejajar Sempurna */}
        <div
          style={{
            fontFamily: "var(--font-open-sans), sans-serif",
            textAlign: "justify",
            textAlignLast: "justify",
          }}
          className={`w-full flex justify-between items-center font-bold uppercase leading-none tracking-[0.22em] mr-[-0.22em] whitespace-nowrap ${subtitleSizeClass} ${subColor}`}
        >
          <span>BOOKING</span>
          <span>ALAT</span>
          <span>SERBA</span>
          <span>ADA</span>
        </div>
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link
        href="/"
        className="inline-flex items-center shrink-0 group focus:outline-none focus:ring-2 focus:ring-[#234E5C]/30 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}
