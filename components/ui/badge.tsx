import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "warm" | "success";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantClasses = {
    default: "bg-primary/15 text-primary border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border-transparent",
    destructive: "bg-destructive/15 text-destructive border-destructive/20",
    outline: "text-foreground border-border",
    warm: "bg-accent-warm/15 text-accent-warm border-accent-warm/20",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
