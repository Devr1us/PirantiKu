"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#234E5C] group-[.toaster]:border-[#E8E8E1] group-[.toaster]:shadow-md group-[.toaster]:rounded-2xl group-[.toaster]:p-4",
          description: "group-[.toast]:text-[#5F7A84]",
          actionButton:
            "group-[.toast]:bg-[#A0630F] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[#F3F3EF] group-[.toast]:text-[#5F7A84]",
        },
      }}
      richColors
      position="top-right"
      {...props}
    />
  );
}
