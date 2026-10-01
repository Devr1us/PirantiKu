"use client";

import * as React from "react";
import { AnimatedText, type AnimatedTextMode } from "./text-motion";
import { motion, useReducedMotion } from "motion/react";
import { EASE, DURATION_SHORT } from "@/lib/motion";

interface BaseHeadingProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  mode?: AnimatedTextMode;
  once?: boolean;
}

export interface H1Props extends BaseHeadingProps {
  hero?: boolean;
}

export function H1({
  children,
  hero = false,
  className = "",
  delay = 0,
  stagger,
  mode,
  once = true,
}: H1Props) {
  const chosenMode: AnimatedTextMode = mode ?? (hero ? "char" : "word");
  const baseClass = hero ? "hero-title block tracking-tight" : "text-2xl sm:text-3xl font-extrabold uppercase text-[#234E5C]";

  return (
    <AnimatedText
      as="h1"
      mode={chosenMode}
      isHero={hero}
      delay={delay}
      stagger={stagger}
      once={once}
      className={`${baseClass} ${className}`}
    >
      {children}
    </AnimatedText>
  );
}

export function H2({
  children,
  className = "",
  delay = 0,
  stagger,
  mode = "word",
  once = true,
}: BaseHeadingProps) {
  return (
    <AnimatedText
      as="h2"
      mode={mode}
      delay={delay}
      stagger={stagger}
      once={once}
      amount={0.35}
      className={`section-title block ${className}`}
    >
      {children}
    </AnimatedText>
  );
}

export function H3({
  children,
  className = "",
  delay = 0,
  stagger,
  mode = "word",
  once = true,
}: BaseHeadingProps) {
  return (
    <AnimatedText
      as="h3"
      mode={mode}
      delay={delay}
      stagger={stagger}
      once={once}
      amount={0.3}
      className={`text-lg sm:text-xl font-bold text-[#234E5C] ${className}`}
    >
      {children}
    </AnimatedText>
  );
}

export function Lead({
  children,
  className = "",
  delay = 0.1,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  return (
    <AnimatedText
      as="p"
      mode="line"
      delay={delay}
      once={once}
      className={`text-base sm:text-lg text-[#234E5C]/90 leading-relaxed ${className}`}
    >
      {children}
    </AnimatedText>
  );
}

export function P({
  children,
  className = "",
  delay = 0,
  once = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  return (
    <AnimatedText
      as="p"
      mode="block"
      delay={delay}
      once={once}
      className={`text-sm sm:text-base text-[#234E5C] leading-relaxed ${className}`}
    >
      {children}
    </AnimatedText>
  );
}

export function Eyebrow({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <span className={`text-xs font-bold uppercase tracking-wider text-[#5F7A84] ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <motion.span
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: DURATION_SHORT, delay, ease: EASE }}
      className={`inline-block text-xs font-bold uppercase tracking-wider text-[#5F7A84] ${className}`}
    >
      {children}
    </motion.span>
  );
}
