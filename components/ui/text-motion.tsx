"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  EASE,
  DURATION_BASE,
  DURATION_PARAGRAPH,
  DURATION_SHORT,
  STAGGER_CHAR,
  STAGGER_WORD,
  STAGGER_LINE,
} from "@/lib/motion";

export type AnimatedTextMode = "char" | "word" | "line" | "block";

interface AnimatedTextProps {
  text?: string;
  children?: React.ReactNode;
  mode?: AnimatedTextMode;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
  amount?: number;
  isHero?: boolean;
}

/**
 * Extracts string content from text prop or React children for accurate word/char counting
 * and accessible aria-label representation.
 */
function extractString(text?: string, children?: React.ReactNode): string {
  if (typeof text === "string") return text;
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children
      .map((child) => (typeof child === "string" ? child : ""))
      .join("");
  }
  return "";
}

export function AnimatedText({
  text,
  children,
  mode = "word",
  as: Component = "span",
  className = "",
  delay = 0,
  stagger,
  once = true,
  amount = 0.4,
  isHero = false,
}: AnimatedTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const rawText = extractString(text, children);

  // If text is empty or motion is reduced, render immediately without animations
  if (shouldReduceMotion || !rawText) {
    return (
      <Component className={className} aria-label={rawText}>
        {children || text}
      </Component>
    );
  }

  // Calculate words and characters to apply automatic downgrade rules
  const trimmed = rawText.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = rawText.length;

  let resolvedMode: AnimatedTextMode = mode;

  // Rule 1: Text > 40 words -> force "block" mode
  if (wordCount > 40) {
    resolvedMode = "block";
  }
  // Rule 2: Text > 12 characters in "char" mode (unless explicitly marked as hero) -> downgrade to "word"
  else if (resolvedMode === "char" && charCount > 12 && !isHero) {
    resolvedMode = "word";
  }

  // --- MODE: CHAR (Split per character with mask) ---
  if (resolvedMode === "char") {
    const charStagger = stagger ?? (isHero ? 0.022 : STAGGER_CHAR);
    let charCounter = 0;

    const containerVariants: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: charStagger,
          delayChildren: delay,
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

    return (
      <Component className={className} aria-label={rawText}>
        <motion.span
          className="inline"
          aria-hidden="true"
          variants={containerVariants}
          initial="hidden"
          animate={isHero ? "visible" : undefined}
          whileInView={!isHero ? "visible" : undefined}
          viewport={!isHero ? { once, amount: 0.1 } : undefined}
        >
          {words.map((word, wIdx) => (
            <span key={wIdx} className="inline-block whitespace-nowrap">
              {Array.from(word).map((char) => {
                const i = charCounter++;
                return (
                  <span
                    key={i}
                    className="inline-block overflow-hidden align-top pb-[0.18em] -mb-[0.18em]"
                  >
                    <motion.span
                      variants={charVariants}
                      className="inline-block"
                    >
                      {char}
                    </motion.span>
                  </span>
                );
              })}
              {wIdx < words.length - 1 && (
                <span className="inline-block">&nbsp;</span>
              )}
            </span>
          ))}
        </motion.span>
      </Component>
    );
  }

  // --- MODE: WORD (Split per word with mask) ---
  if (resolvedMode === "word") {
    const wordStagger = stagger ?? STAGGER_WORD;

    const containerVariants: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: wordStagger,
          delayChildren: delay,
        },
      },
    };

    const wordVariants: Variants = {
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

    return (
      <Component className={className} aria-label={rawText}>
        <motion.span
          className="inline"
          aria-hidden="true"
          variants={containerVariants}
          initial="hidden"
          animate={isHero ? "visible" : undefined}
          whileInView={!isHero ? "visible" : undefined}
          viewport={!isHero ? { once, amount } : undefined}
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden align-top pb-[0.18em] -mb-[0.18em]"
            >
              <motion.span variants={wordVariants} className="inline-block">
                {word}
              </motion.span>
              {i < words.length - 1 && (
                <span className="inline-block">&nbsp;</span>
              )}
            </span>
          ))}
        </motion.span>
      </Component>
    );
  }

  // --- MODE: LINE (Per line fade-up) ---
  if (resolvedMode === "line") {
    const lines = rawText.split("\n").filter(Boolean);

    const containerVariants: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: stagger ?? STAGGER_LINE,
          delayChildren: delay,
        },
      },
    };

    const lineVariants: Variants = {
      hidden: { opacity: 0, y: 16 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: DURATION_BASE, ease: EASE },
      },
    };

    return (
      <Component className={className} aria-label={rawText}>
        <motion.span
          className="inline-block w-full"
          aria-hidden="true"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once, amount: 0.2 }}
        >
          {lines.map((line, i) => (
            <motion.span
              key={i}
              variants={lineVariants}
              className="block"
            >
              {line}
            </motion.span>
          ))}
        </motion.span>
      </Component>
    );
  }

  // --- MODE: BLOCK (Single block fade-up 16px, for paragraphs) ---
  return (
    <Component className={className} aria-label={rawText}>
      <motion.span
        className="inline-block w-full"
        aria-hidden="true"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, amount: 0.15 }}
        transition={{
          duration: DURATION_PARAGRAPH,
          delay,
          ease: EASE,
        }}
      >
        {children || rawText}
      </motion.span>
    </Component>
  );
}

/**
 * HoverRollText component:
 * When hovered, letters roll upward and are replaced by a duplicate below
 * with a very slight stagger (max 20ms per character).
 * Preserves precise layout width without shifts.
 */
export function HoverRollText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = React.useState(false);

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  const chars = Array.from(text);

  return (
    <span
      className={`relative inline-flex overflow-hidden cursor-pointer select-none leading-none ${className}`}
      aria-label={text}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Primary visible character row */}
      <span className="inline-flex" aria-hidden="true">
        {chars.map((char, i) => (
          <motion.span
            key={`char-1-${i}`}
            className="inline-block"
            animate={{
              y: isHovered ? "-100%" : "0%",
            }}
            transition={{
              duration: DURATION_SHORT,
              delay: i * 0.015,
              ease: EASE,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>

      {/* Duplicate rolling character row (positioned directly underneath) */}
      <span
        className="absolute inset-0 inline-flex pointer-events-none"
        aria-hidden="true"
      >
        {chars.map((char, i) => (
          <motion.span
            key={`char-2-${i}`}
            className="inline-block"
            initial={{ y: "100%" }}
            animate={{
              y: isHovered ? "0%" : "100%",
            }}
            transition={{
              duration: DURATION_SHORT,
              delay: i * 0.015,
              ease: EASE,
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
