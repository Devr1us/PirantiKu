"use client";

import * as React from "react";
import { AnimatedText, type AnimatedTextMode } from "./text-motion";
import { Reveal } from "./motion";
import { DURATION_SHORT } from "@/lib/motion";

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
  once,
}: H1Props) {
  const chosenMode: AnimatedTextMode = mode ?? (hero ? "char" : "word");
  const baseClass = hero
    ? "hero-title block tracking-tight"
    : "text-2xl sm:text-3xl font-extrabold uppercase text-[#234E5C]";

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
  once,
}: BaseHeadingProps) {
  return (
    <AnimatedText
      as="h2"
      mode={mode}
      delay={delay}
      stagger={stagger}
      once={once}
      amount={0.2}
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
  once,
}: BaseHeadingProps) {
  return (
    <AnimatedText
      as="h3"
      mode={mode}
      delay={delay}
      stagger={stagger}
      once={once}
      amount={0.2}
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
  once,
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
  once,
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
  once,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
}) {
  return (
    <Reveal
      delay={delay}
      duration={DURATION_SHORT}
      y={8}
      once={once}
      className={`inline-block text-xs font-bold uppercase tracking-wider text-[#5F7A84] ${className}`}
    >
      {children}
    </Reveal>
  );
}
