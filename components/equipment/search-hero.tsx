"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types/database";

interface SearchHeroProps {
  categories: Category[];
}

export function SearchHero({ categories }: SearchHeroProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (selectedCategory) params.set("kategori", selectedCategory);

    router.push(`/alat?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    router.push(`/alat?q=${encodeURIComponent(tag)}`);
  };

  const popularTags = [
    "Tenda Dome",
    "Genset",
    "Bor Baterai",
    "Sound System",
    "Proyektor",
    "Vacuum Cleaner",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Search Input Box */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-3xl bg-card border border-border shadow-xl backdrop-blur-md"
      >
        {/* Input Text */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari alat (contoh: tenda, genset, drill...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/80 pt-2 sm:pt-0 sm:pl-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-44 h-11 px-3 bg-muted/60 hover:bg-muted text-xs sm:text-sm font-medium text-foreground rounded-2xl appearance-none focus:outline-none cursor-pointer pr-8"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.nama}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 pointer-events-none text-muted-foreground" />
        </div>

        {/* Submit Search Button */}
        <Button
          type="submit"
          variant="warm"
          className="w-full sm:w-auto h-12 px-7 rounded-2xl font-bold shadow-md shadow-accent-warm/25 shrink-0"
        >
          Cari Alat
        </Button>
      </form>

      {/* Popular Keyword Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1 font-semibold text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-accent-warm" />
          Populer:
        </span>
        {popularTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="px-3 py-1 rounded-full bg-card/80 border border-border/80 text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-card transition-all cursor-pointer text-xs"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
