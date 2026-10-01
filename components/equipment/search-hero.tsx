"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
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
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Search Input Box */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-full bg-white border border-[#E8E8E1] shadow-sm"
      >
        {/* Input Text */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3 h-4 w-4 text-[#5F7A84]" />
          <input
            type="text"
            placeholder="Cari alat (tenda, bor, sepeda...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-11 pr-4 bg-transparent text-xs sm:text-sm text-[#234E5C] placeholder:text-[#5F7A84]/70 focus:outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-[#E8E8E1] pt-1.5 sm:pt-0 sm:pl-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-36 h-10 px-3 bg-transparent text-xs font-semibold text-[#234E5C] appearance-none focus:outline-none cursor-pointer pr-7"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.nama}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-3.5 h-3.5 w-3.5 pointer-events-none text-[#5F7A84]" />
        </div>

        {/* Submit Search Button */}
        <Button
          type="submit"
          variant="warm"
          size="sm"
          className="w-full sm:w-auto h-10 px-6 text-xs font-bold shrink-0"
        >
          Cari Alat
        </Button>
      </form>

      {/* Popular Keyword Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-[#5F7A84]">
        <span className="font-semibold text-[#234E5C]">Populer:</span>
        {popularTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => handleTagClick(tag)}
            className="px-2.5 py-0.5 rounded-full bg-white border border-[#E8E8E1] text-[11px] text-[#5F7A84] hover:text-[#234E5C] hover:border-[#234E5C] transition-all cursor-pointer"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
