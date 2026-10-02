"use client";

import * as React from "react";
import { MotionConfig } from "motion/react";
import { ScrollDirectionProvider } from "@/components/providers/scroll-direction";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ScrollDirectionProvider>
        {children}
      </ScrollDirectionProvider>
    </MotionConfig>
  );
}
