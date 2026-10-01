import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[#E8E8E1] bg-white px-4 py-2 text-base text-[#234E5C] transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#5F7A84]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#234E5C] focus-visible:border-[#234E5C] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm shadow-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
