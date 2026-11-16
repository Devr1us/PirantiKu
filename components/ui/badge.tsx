import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ochre"
    | "success"
    | "petrol";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "bg-[var(--bg-sage)] text-[var(--bg-dark)] border-[var(--border-soft)]",
    secondary: "bg-[var(--bg-sage)] text-[var(--text-muted)] border-[var(--border-soft)]",
    petrol: "bg-[var(--bg-sage)] text-[var(--bg-dark)] border-[var(--border-soft)]",
    ochre: "bg-[var(--accent-gold)]/20 text-[var(--bg-dark)] border-[var(--accent-gold)]/40",
    success: "bg-[#E2F0D9] text-[#2E5E4E] border-[#C5E1A5]",
    destructive: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
    outline: "bg-white text-[var(--text-main)] border-[var(--border-soft)]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
