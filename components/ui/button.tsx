import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?:
    | "default"
    | "warm"
    | "petrol"
    | "outline"
    | "outline-ochre"
    | "secondary"
    | "ghost"
    | "destructive"
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

    // Style specifications:
    // Tombol utama: pill (rounded-full), latar ochre, teks putih bold, hover naik 2px & lebih gelap, tap scale 0.97
    // Tombol sekunder: pill petrol teks putih, atau pill outline petrol
    const variantClasses = {
      default:
        "rounded-full bg-[var(--accent-gold)] text-[var(--bg-dark)] font-bold hover:bg-[#E0A82E] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200",
      warm:
        "rounded-full bg-[var(--accent-gold)] text-[var(--bg-dark)] font-bold hover:bg-[#E0A82E] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200",
      petrol:
        "rounded-full bg-[var(--bg-dark)] text-white font-bold hover:bg-[var(--bg-footer)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200",
      secondary:
        "rounded-full bg-[var(--bg-dark)] text-white font-bold hover:bg-[var(--bg-footer)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200",
      outline:
        "rounded-full border border-[var(--border-soft)] text-[var(--text-main)] bg-white font-bold hover:bg-[var(--bg-sage)] hover:border-[var(--bg-dark)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200",
      "outline-ochre":
        "rounded-full border border-[var(--accent-gold)] text-[var(--bg-dark)] bg-white font-bold hover:bg-[var(--accent-gold)] hover:text-[var(--bg-dark)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] transition-all duration-200",
      ghost:
        "rounded-full text-[var(--text-main)] hover:bg-[var(--bg-sage)] hover:text-[var(--bg-dark)] font-semibold active:scale-[0.97] transition-all duration-200",
      destructive:
        "rounded-full bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-200",
      link: "text-[var(--accent-gold)] underline-offset-4 hover:underline font-semibold p-0 h-auto",
    };

    const sizeClasses = {
      default: "h-11 px-6 py-2.5 text-sm",
      sm: "h-9 px-4 py-2 text-xs",
      lg: "h-13 px-8 py-3 text-base",
      icon: "h-10 w-10 p-0 flex items-center justify-center",
    };

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234E5C] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
