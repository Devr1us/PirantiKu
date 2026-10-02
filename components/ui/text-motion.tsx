"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "motion/react";
import {
  ANIMASI_ULANG,
  EASE,
  Y_OFFSET,
  THRESHOLD_ENTER,
  THRESHOLD_RESET,
  DURATION_BASE,
  DURATION_PARAGRAPH,
  STAGGER_CHAR,
  STAGGER_WORD,
  STAGGER_LINE,
} from "@/lib/motion";
import {
  useScrollDirection,
  useProgrammaticScroll,
  isProgrammaticScrolling,
  getProgrammaticTarget,
  getScrollDirection,
  type ScrollDirection,
} from "@/components/providers/scroll-direction";

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
  once,
  amount,
  isHero = false,
}: AnimatedTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const rawText = extractString(text, children);
  const containerRef = React.useRef<HTMLElement>(null);
  const scrollDirRef = useScrollDirection();
  const { isProgrammatic, target } = useProgrammaticScroll();

  const effectiveOnce = once !== undefined ? once : !ANIMASI_ULANG;
  const enterAmount = amount ?? THRESHOLD_ENTER;

  // Two useInView observers for hysteresis (enter at 20%, reset at 0%)
  const isEntering = useInView(containerRef, {
    amount: enterAmount,
    once: effectiveOnce,
  });

  const isExiting = useInView(containerRef, {
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
        const isTarget =
          targetId && containerRef.current?.closest(`#${targetId}`);
        setIsInstant(!isTarget);
      } else {
        setIsInstant(false);
      }

      setIsVisible(true);
    } else if (!isExiting && !effectiveOnce) {
      // Completely out of view
      const el = containerRef.current;
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
  // Rule 2: "char" mode is strictly for short hero titles <= 12 characters.
  // Never replay per-character animation on text longer than 12 characters.
  else if (resolvedMode === "char" && (charCount > 12 || !isHero)) {
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
          staggerChildren: isInstant ? 0 : charStagger,
          delayChildren: isInstant ? 0 : delay,
        },
      },
    };

    const initialY = direction === "down" ? "115%" : "-115%";

    const charVariants: Variants = {
      hidden: {
        opacity: 0,
        y: initialY,
        transition: { duration: 0 },
      },
      visible: {
        opacity: 1,
        y: "0%",
        transitionEnd: { transform: "none", willChange: "auto" },
        transition: {
          duration: isInstant ? 0 : DURATION_BASE,
          ease: EASE,
        },
      },
    };

    return (
      <Component
        ref={containerRef as React.Ref<any>}
        className={className}
        aria-label={rawText}
      >
        <motion.span
          className="inline"
          aria-hidden="true"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
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
                      style={{
                        willChange: isVisible ? "transform, opacity" : "auto",
                      }}
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
          staggerChildren: isInstant ? 0 : wordStagger,
          delayChildren: isInstant ? 0 : delay,
        },
      },
    };

    const initialY = direction === "down" ? "115%" : "-115%";

    const wordVariants: Variants = {
      hidden: {
        opacity: 0,
        y: initialY,
        transition: { duration: 0 },
      },
      visible: {
        opacity: 1,
        y: "0%",
        transitionEnd: { transform: "none", willChange: "auto" },
        transition: {
          duration: isInstant ? 0 : DURATION_BASE,
          ease: EASE,
        },
      },
    };

    return (
      <Component
        ref={containerRef as React.Ref<any>}
        className={className}
        aria-label={rawText}
      >
        <motion.span
          className="inline"
          aria-hidden="true"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {words.map((word, i) => (
            <span
              key={i}
              className="inline-block overflow-hidden align-top pb-[0.18em] -mb-[0.18em]"
            >
              <motion.span
                variants={wordVariants}
                className="inline-block"
                style={{
                  willChange: isVisible ? "transform, opacity" : "auto",
                }}
              >
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
          staggerChildren: isInstant ? 0 : (stagger ?? STAGGER_LINE),
          delayChildren: isInstant ? 0 : delay,
        },
      },
    };

    const initialY = direction === "down" ? Y_OFFSET : -Y_OFFSET;

    const lineVariants: Variants = {
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
          duration: isInstant ? 0 : DURATION_BASE,
          ease: EASE,
        },
      },
    };

    return (
      <Component
        ref={containerRef as React.Ref<any>}
        className={className}
        aria-label={rawText}
      >
        <motion.span
          className="inline-block w-full"
          aria-hidden="true"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {lines.map((line, i) => (
            <motion.span
              key={i}
              variants={lineVariants}
              className="block"
              style={{
                willChange: isVisible ? "transform, opacity" : "auto",
              }}
            >
              {line}
            </motion.span>
          ))}
        </motion.span>
      </Component>
    );
  }

  // --- MODE: BLOCK (Single block fade-up 16px, for paragraphs) ---
  const initialY = direction === "down" ? Y_OFFSET : -Y_OFFSET;

  return (
    <Component
      ref={containerRef as React.Ref<any>}
      className={className}
      aria-label={rawText}
    >
      <motion.span
        className="inline-block w-full"
        aria-hidden="true"
        initial={{ opacity: 0, y: initialY }}
        animate={
          isVisible
            ? {
                opacity: 1,
                y: 0,
                transitionEnd: { transform: "none", willChange: "auto" },
                transition: {
                  duration: isInstant ? 0 : DURATION_PARAGRAPH,
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
      className={`inline-block relative overflow-hidden select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={text}
    >
      <span className="inline-flex" aria-hidden="true">
        {chars.map((char, i) => (
          <span
            key={i}
            className="inline-block relative overflow-hidden align-top"
          >
            {/* Primary Char */}
            <motion.span
              className="inline-block"
              initial={false}
              animate={{
                y: isHovered ? "-100%" : "0%",
              }}
              transition={{
                duration: 0.22,
                delay: i * 0.015,
                ease: EASE,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>

            {/* Duplicate Char Below */}
            <motion.span
              className="inline-block absolute top-0 left-0"
              initial={{ y: "100%" }}
              animate={{
                y: isHovered ? "0%" : "100%",
              }}
              transition={{
                duration: 0.22,
                delay: i * 0.015,
                ease: EASE,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          </span>
        ))}
      </span>
    </span>
  );
}
