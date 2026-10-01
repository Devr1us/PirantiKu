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
    default: "bg-[#F3F3EF] text-[#234E5C] border-[#E8E8E1]",
    secondary: "bg-[#F3F3EF] text-[#5F7A84] border-[#E8E8E1]",
    petrol: "bg-[#E6FFFA] text-[#234E5C] border-[#B2F5EA]",
    ochre: "bg-[#FEF3C7] text-[#78350F] border-[#FDE68A]",
    success: "bg-[#E2F0D9] text-[#2E5E4E] border-[#C5E1A5]",
    destructive: "bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]",
    outline: "bg-white text-[#234E5C] border-[#E8E8E1]",
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
