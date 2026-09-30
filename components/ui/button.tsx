import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | "default"
    | "warm"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const variantClasses = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-[0.98]",
      warm:
        "bg-accent-warm text-accent-warm-foreground hover:bg-accent-warm/90 shadow-md shadow-accent-warm/25 active:scale-[0.98] font-semibold",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm active:scale-[0.98]",
      outline:
        "border border-border bg-card hover:bg-muted/70 text-foreground active:scale-[0.98]",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
      ghost:
        "hover:bg-muted hover:text-foreground text-foreground active:scale-[0.98]",
      link: "text-primary underline-offset-4 hover:underline",
    };

    const sizeClasses = {
      default: "h-11 px-5 py-2.5 rounded-2xl text-sm font-medium",
      sm: "h-9 px-3.5 rounded-xl text-xs font-medium",
      lg: "h-13 px-8 rounded-2xl text-base font-semibold",
      icon: "h-11 w-11 rounded-2xl p-0 flex items-center justify-center",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
