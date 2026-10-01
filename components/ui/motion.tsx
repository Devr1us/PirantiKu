"use client";

import * as React from "react";
import { motion, type Variants } from "motion/react";

// 1. ANIMATED TEXT (Mode: "char", "word", "line")
interface AnimatedTextProps {
  text: string;
  mode?: "char" | "word" | "line";
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  delay?: number;
  once?: boolean;
}

export function AnimatedText({
  text,
  mode = "word",
  as: Component = "span",
  className = "",
  delay = 0,
  once = true,
}: AnimatedTextProps) {
  if (mode === "char") {
    const words = text.split(" ");
    let charIndexCounter = 0;

    const containerVariants: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.025,
          delayChildren: delay,
        },
      },
    };

    const charVariants: Variants = {
      hidden: {
        opacity: 0,
        y: "110%",
      },
      visible: {
        opacity: 1,
        y: "0%",
        transition: {
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    };

    return (
      <Component className={className}>
        <motion.span
          className="inline"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once, margin: "-20px" }}
        >
          {words.map((word, wordIndex) => (
            <span key={wordIndex} className="inline-block whitespace-nowrap">
              {Array.from(word).map((char) => {
                const i = charIndexCounter++;
                return (
                  <span
                    key={i}
                    className="inline-block overflow-hidden align-top"
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
              {wordIndex < words.length - 1 && (
                <span className="inline-block">&nbsp;</span>
              )}
            </span>
          ))}
        </motion.span>
      </Component>
    );
  }

  if (mode === "word") {
    const words = text.split(" ");
    const containerVariants: Variants = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.06,
          delayChildren: delay,
        },
      },
    };

    const wordVariants: Variants = {
      hidden: {
        opacity: 0,
        y: 14,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    };

    return (
      <Component className={className}>
        <motion.span
          className="inline"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once, margin: "-20px" }}
        >
          {words.map((word, i) => (
            <span key={i} className="inline-block">
              <motion.span variants={wordVariants} className="inline-block">
                {word}
              </motion.span>
              {i < words.length - 1 && <span>&nbsp;</span>}
            </span>
          ))}
        </motion.span>
      </Component>
    );
  }

  // mode === "line"
  return (
    <Component className={className}>
      <motion.span
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, margin: "-20px" }}
        transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block w-full"
      >
        {text}
      </motion.span>
    </Component>
  );
}

// 2. REVEAL (Fade + Naik 16px)
interface RevealProps {
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
  duration = 0.45,
  y = 16,
  className = "",
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-30px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 3. STAGGER (Container Anak Muncul Bertahap)
interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  delay?: number;
  className?: string;
  once?: boolean;
}

export function Stagger({
  children,
  staggerDelay = 0.08,
  delay = 0,
  className = "",
  once = true,
}: StaggerProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-30px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Child item for Stagger
export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// 4. COUNT UP ANIMATION (Angka Statistik saat Terlihat)
interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const [displayValue, setDisplayValue] = React.useState<number>(0);
  const [hasStarted, setHasStarted] = React.useState<boolean>(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasStarted]);

  React.useEffect(() => {
    if (!hasStarted) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
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
  }, [hasStarted, value, duration]);

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {displayValue.toLocaleString("id-ID")}
      {suffix}
    </span>
  );
}
