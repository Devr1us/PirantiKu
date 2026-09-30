import * as React from "react";
import { BOOKING_STATUS_CONFIG } from "@/lib/constants";
import type { BookingStatus } from "@/types/database";
import { cn } from "@/lib/utils";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: BookingStatus;
  showDot?: boolean;
}

export function StatusBadge({
  status,
  showDot = true,
  className,
  ...props
}: StatusBadgeProps) {
  const config = BOOKING_STATUS_CONFIG[status] || {
    label: status,
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        config.bg,
        config.text,
        config.border,
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
      )}
      {config.label}
    </span>
  );
}
