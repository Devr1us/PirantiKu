"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 rounded-2xl"
        aria-label="Ganti tema"
      >
        <Sun className="h-5 w-5 opacity-50" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-2xl transition-transform active:scale-95"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Ganti tema mode gelap/terang"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-amber-400 transition-all rotate-0 scale-100" />
      ) : (
        <Moon className="h-5 w-5 text-slate-700 transition-all rotate-0 scale-100" />
      )}
    </Button>
  );
}
