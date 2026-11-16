"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  RotateCcw,
  Package,
} from "lucide-react";
import type { Category, EquipmentWithDetails } from "@/types/database";
import { EquipmentCard } from "@/components/equipment/equipment-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useReducedMotion } from "motion/react";
import { Reveal } from "@/components/ui/motion";
import { getGridColumnDelay } from "@/lib/motion";
import { H1, Lead } from "@/components/ui/typography";
import { calculateAvailableStock } from "@/lib/inventory";

export interface PricePreset {
  id: string;
  label: string;
  min: string;
  max: string;
  count: number;
}

interface FilterSidebarProps {
  categories: Category[];
  currentCategory: string;
  selectedCategorySlug?: string;
  initialEquipment: EquipmentWithDetails[];
  handleCategorySelect: (slug: string) => void;
  handlePresetSelect: (min: string, max: string) => void;
  handleResetPriceFilter: () => void;
  handleResetFilters: () => void;
  hasActiveFilters: boolean;
  pricePresets: PricePreset[];
  currentMinPrice: string;
  currentMaxPrice: string;
}

function FilterSidebar({
  categories,
  currentCategory,
  selectedCategorySlug,
  initialEquipment,
  handleCategorySelect,
  handlePresetSelect,
  handleResetPriceFilter,
  handleResetFilters,
  hasActiveFilters,
  pricePresets,
  currentMinPrice,
  currentMaxPrice,
}: FilterSidebarProps) {
  const isPresetActive = (pMin: string, pMax: string) => {
    const curMin = (currentMinPrice || "").trim();
    const curMax = (currentMaxPrice || "").trim();
    const targetMin = (pMin || "").trim();
    const targetMax = (pMax || "").trim();

    if (!curMin && !curMax) return false;

    const minMatches =
      targetMin === ""
        ? curMin === "" || curMin === "0"
        : curMin === targetMin;

    const maxMatches =
      targetMax === "" ? curMax === "" : curMax === targetMax;

    return minMatches && maxMatches;
  };

  return (
    <div className="space-y-6">
      {/* Kategori Alat */}
      {!selectedCategorySlug && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-[#234E5C] uppercase tracking-wider">
            Kategori Alat
          </h4>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                !currentCategory
                  ? "bg-[#234E5C] text-white"
                  : "text-[#5F7A84] hover:bg-white hover:text-[#234E5C]"
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-left">Semua Kategori</span>
              <span className="text-[11px] opacity-80 shrink-0">
                {initialEquipment.length}
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = currentCategory === cat.slug;
              const count = initialEquipment.filter(
                (e) => e.category_id === cat.id
              ).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.slug)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-[#234E5C] text-white font-bold"
                      : "text-[#5F7A84] hover:bg-white hover:text-[#234E5C]"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-left">{cat.nama}</span>
                  <span className="text-[11px] opacity-80 shrink-0">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rentang Harga (Rp/hari) */}
      <div className="space-y-3 border-t border-[#E8E8E1] pt-5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#234E5C] uppercase tracking-wider flex items-center gap-1.5">
            Rentang Harga (Rp/hari)
          </h4>
          {(currentMinPrice || currentMaxPrice) && (
            <button
              type="button"
              onClick={handleResetPriceFilter}
              className="text-[11px] font-semibold text-[#5F7A84] hover:text-[#DC2626] transition-colors cursor-pointer flex items-center gap-1"
              title="Reset filter harga"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        {/* Pilihan Opsi Rentang Harga */}
        <div className="space-y-1">
          {pricePresets.map((preset) => {
            const isActive = isPresetActive(preset.min, preset.max);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset.min, preset.max)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer text-left ${
                  isActive
                    ? "bg-[#234E5C] text-white font-bold"
                    : "text-[#5F7A84] hover:bg-white hover:text-[#234E5C]"
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-left">{preset.label}</span>
                <span className="text-[11px] opacity-80 shrink-0">{preset.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="border-t border-[#E8E8E1] pt-4">
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full py-2 rounded-xl text-xs font-bold text-[#5F7A84] hover:text-[#DC2626] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Semua Filter
          </button>
        </div>
      )}
    </div>
  );
}

interface EquipmentCatalogProps {
  initialEquipment: EquipmentWithDetails[];
  categories: Category[];
  selectedCategorySlug?: string;
  categoryTitle?: string;
  categoryDescription?: string;
}

export function EquipmentCatalog({
  initialEquipment,
  categories,
  selectedCategorySlug,
  categoryTitle,
  categoryDescription,
}: EquipmentCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  const shouldReduceMotion = useReducedMotion();

  // Ambil state dari URL search params
  const currentQ = searchParams.get("q") || "";
  const currentCategory = selectedCategorySlug || searchParams.get("kategori") || "";
  const currentSort = searchParams.get("sort") || "populer";
  const currentMinPrice = searchParams.get("min_harga") || "";
  const currentMaxPrice = searchParams.get("max_harga") || "";

  const [searchQuery, setSearchQuery] = React.useState(currentQ);
  const [debouncedQuery, setDebouncedQuery] = React.useState(currentQ);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);

  // Sinkronisasi state pencarian jika URL berubah dari luar (misal tombol kembali / reset)
  const [prevQ, setPrevQ] = React.useState(currentQ);

  if (prevQ !== currentQ) {
    setPrevQ(currentQ);
    setSearchQuery(currentQ);
    setDebouncedQuery(currentQ);
  }

  // Debounce input search (300ms) agar hasil dan URL tidak berganti di setiap ketukan
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const trimmed = searchQuery.trim();
        if (trimmed) {
          params.set("q", trimmed);
        } else {
          params.delete("q");
        }
        const newQuery = params.toString();
        const currentTarget = selectedCategorySlug ? window.location.pathname : "/alat";
        const newUrl = newQuery ? `${currentTarget}?${newQuery}` : currentTarget;
        const currentFull = `${window.location.pathname}${window.location.search}`;

        if (newUrl !== currentFull) {
          window.history.replaceState(window.history.state, "", newUrl);
        }
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategorySlug]);

  const applyFilters = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });

    const targetPath = selectedCategorySlug ? pathname : "/alat";
    const queryString = params.toString();
    const url = queryString ? `${targetPath}?${queryString}` : targetPath;

    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(searchQuery);
    applyFilters({ q: searchQuery });
  };

  const handleCategorySelect = (slug: string) => {
    if (selectedCategorySlug) {
      // BUG-EC1: Jika slug kosong (Semua Kategori), redirect ke /alat bukan /kategori/
      if (!slug) {
        startTransition(() => {
          router.replace("/alat", { scroll: false });
        });
      } else {
        startTransition(() => {
          router.replace(`/kategori/${slug}`, { scroll: false });
        });
      }
    } else {
      const targetSlug = currentCategory === slug ? "" : slug;
      // BUG-EC2: Reset search query saat kategori berubah
      setSearchQuery("");
      setDebouncedQuery("");
      applyFilters({ kategori: targetSlug, q: "" });
    }
  };

  const handleSortChange = (sortVal: string) => {
    applyFilters({ sort: sortVal });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    const targetPath = selectedCategorySlug ? pathname : "/alat";
    startTransition(() => {
      router.replace(targetPath, { scroll: false });
    });
    setIsMobileFilterOpen(false);
  };

  const handleResetPriceFilter = () => {
    applyFilters({ min_harga: "", max_harga: "" });
  };

  const handlePresetSelect = (presetMin: string, presetMax: string) => {
    const curMin = (currentMinPrice || "").trim();
    const curMax = (currentMaxPrice || "").trim();
    const targetMin = (presetMin || "").trim();
    const targetMax = (presetMax || "").trim();

    const isCurrentActive =
      (targetMin === "" ? curMin === "" || curMin === "0" : curMin === targetMin) &&
      (targetMax === "" ? curMax === "" : curMax === targetMax) &&
      Boolean(curMin || curMax);

    if (isCurrentActive) {
      applyFilters({ min_harga: "", max_harga: "" });
    } else {
      applyFilters({ min_harga: presetMin, max_harga: presetMax });
    }
  };

  // Preset harga riil dari katalog
  const pricePresets = React.useMemo(() => {
    // Scope alat berdasarkan kategori aktif
    const scopeEquipment = currentCategory
      ? initialEquipment.filter((e) => e.category?.slug === currentCategory)
      : initialEquipment;

    const candidateConfigs: Array<{
      id: string;
      label: string;
      min: string;
      max: string;
    }> = [
      {
        id: "under-10k",
        label: "< Rp 10.000",
        min: "",
        max: "9999",
      },
      {
        id: "10k-50k",
        label: "Rp 10.000 - Rp 49.999",
        min: "10000",
        max: "49999",
      },
      {
        id: "50k-100k",
        label: "Rp 50.000 - Rp 99.999",
        min: "50000",
        max: "99999",
      },
      {
        id: "above-100k",
        label: "≥ Rp 100.000",
        min: "100000",
        max: "",
      },
    ];

    const presetsWithCount: PricePreset[] = candidateConfigs.map((cfg) => {
      const count = scopeEquipment.filter((item) => {
        const p = Number(item.harga_per_hari);
        if (cfg.min && p < Number(cfg.min)) return false;
        if (cfg.max && p > Number(cfg.max)) return false;
        return true;
      }).length;

      return {
        ...cfg,
        count,
      };
    });

    return presetsWithCount;
  }, [initialEquipment, currentCategory]);

  // Filter dan sorting lokal
  const filteredEquipment = React.useMemo(() => {
    const activeSearch = debouncedQuery.trim();
    return initialEquipment
      .filter((item) => {
        if (activeSearch) {
          const qLower = activeSearch.toLowerCase();
          const matchName = item.nama.toLowerCase().includes(qLower);
          const matchDesc = item.deskripsi?.toLowerCase().includes(qLower);
          if (!matchName && !matchDesc) return false;
        }

        if (currentCategory && item.category?.slug !== currentCategory) {
          return false;
        }

        if (currentMinPrice) {
          const min = parseInt(currentMinPrice, 10);
          if (!isNaN(min) && item.harga_per_hari < min) return false;
        }

        if (currentMaxPrice) {
          const max = parseInt(currentMaxPrice, 10);
          if (!isNaN(max) && item.harga_per_hari > max) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (currentSort === "termurah") {
          return a.harga_per_hari - b.harga_per_hari;
        }
        if (currentSort === "termahal") {
          return b.harga_per_hari - a.harga_per_hari;
        }
        if (currentSort === "terbaru") {
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }
        return calculateAvailableStock(b) - calculateAvailableStock(a);
      });
  }, [
    initialEquipment,
    debouncedQuery,
    currentCategory,
    currentMinPrice,
    currentMaxPrice,
    currentSort,
  ]);

  const hasActiveFilters = Boolean(
    debouncedQuery ||
    (!selectedCategorySlug && currentCategory) ||
    currentMinPrice ||
    currentMaxPrice ||
    currentSort !== "populer"
  );

  const filterProps: FilterSidebarProps = {
    categories,
    currentCategory,
    selectedCategorySlug,
    initialEquipment,
    handleCategorySelect,
    handlePresetSelect,
    handleResetPriceFilter,
    handleResetFilters,
    hasActiveFilters,
    pricePresets,
    currentMinPrice,
    currentMaxPrice,
  };

  const filterSignature = `${currentCategory}|${currentMinPrice}|${currentMaxPrice}|${currentSort}|${debouncedQuery}`;

  const [visibleCount, setVisibleCount] = React.useState(12);
  const [prevFilterSignature, setPrevFilterSignature] = React.useState(filterSignature);

  // Reset pagination saat filter atau kata kunci berubah (render-phase state adjustment)
  if (prevFilterSignature !== filterSignature) {
    setPrevFilterSignature(filterSignature);
    setVisibleCount(12);
  }

  const displayedEquipment = React.useMemo(() => {
    return filteredEquipment.slice(0, visibleCount);
  }, [filteredEquipment, visibleCount]);

  return (
    <div className="site-container py-10 space-y-8 bg-[#FAFAF8] text-[#234E5C] self-stretch">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="w-full space-y-2 border-b border-[#E8E8E1] pb-6">
        <H1 className="section-title block">
          {categoryTitle ? categoryTitle.toUpperCase() : "KATALOG BOOKING ALAT"}
        </H1>
        <Lead className="text-base text-[#5F7A84] font-medium leading-relaxed max-w-3xl">
          {categoryDescription ||
            "Pilihan perlengkapan berkualitas dengan kepastian ketersediaan unit, biaya booking harian transparan, dan DP ringan mulai 30%."}
        </Lead>
      </div>

      {/* Control Bar: Pencarian & Pengurutan */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Form Pencarian */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-[450px] w-full">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84] pointer-events-none" />
          <Input
            type="search"
            aria-label="Cari nama alat"
            placeholder="Cari nama alat atau spesifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-sm bg-white border-[#CBD5E1] text-[#234E5C] placeholder:text-[#5F7A84] shadow-xs focus:ring-2 focus:ring-[#234E5C]"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Hapus pencarian"
              onClick={() => {
                setSearchQuery("");
                setDebouncedQuery("");
                applyFilters({ q: "" });
              }}
              className="absolute right-3.5 top-3.5 text-[#5F7A84] hover:text-[#234E5C] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Tombol Filter Mobile */}
          <div className="lg:hidden shrink-0">
            <Sheet
              open={isMobileFilterOpen}
              onOpenChange={setIsMobileFilterOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-3.5 sm:px-4 text-xs font-bold flex items-center justify-center gap-2 shrink-0"
                >
                  <Filter className="h-4 w-4 text-[#234E5C]" />
                  <span>FILTER</span>
                  {hasActiveFilters && (
                    <span className="h-2 w-2 rounded-full bg-[#A0630F]" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs bg-white p-0 flex flex-col h-full">
                <SheetHeader className="text-left border-b border-[#E8E8E1] p-5 pb-4 shrink-0">
                  <SheetTitle className="text-base font-bold text-[#234E5C] flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#234E5C]" />
                    Filter Katalog
                  </SheetTitle>
                </SheetHeader>
                <div className="p-5 pt-3 overflow-y-auto flex-1 overscroll-contain">
                  <FilterSidebar {...filterProps} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Pengurutan */}
          <div className="relative flex-1 min-w-0 sm:flex-initial sm:w-48">
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full sm:w-48 h-11 pl-3.5 pr-8 bg-white border border-[#E8E8E1] text-xs font-bold text-[#234E5C] rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#234E5C] cursor-pointer truncate"
            >
              <option value="populer">Paling Banyak Unit</option>
              <option value="termurah">Harga: Rendah ke Tinggi</option>
              <option value="termahal">Harga: Tinggi ke Rendah</option>
              <option value="terbaru">Terbaru Ditambahkan</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-[#5F7A84]" />
          </div>
        </div>
      </div>

      {/* Konten Utama: Filter di Wadah --panel + Grid Kartu Alat */}
      <div className="catalog-layout">
        {/* Sidebar Filter Desktop: Lebar tetap 260px, align-self start */}
        <aside className="hidden lg:block w-[260px] min-w-[260px] max-w-[260px] shrink-0 self-start">
          <div className="sticky top-[calc(var(--navbar-offset)+24px)] max-h-[calc(100vh-var(--navbar-offset)-48px)] flex flex-col rounded-2xl bg-[#F3F3EF] border border-[#E8E8E1] shadow-xs transition-[top] duration-300 overflow-hidden">
            {/* Header Sticky Card */}
            <div className="flex items-center justify-between p-4 px-5 border-b border-[#E8E8E1] shrink-0 bg-[#F3F3EF]">
              <h3 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#234E5C]" />
                Filter Alat
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-[#5F7A84] hover:text-[#DC2626] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset semua filter"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Scrollable Card Body: Bebas scroll down dan scroll up tanpa terikat scroll produk */}
            <div className="p-5 overflow-y-auto flex-1 overscroll-contain">
              <FilterSidebar {...filterProps} />
            </div>
          </div>
        </aside>

        {/* Kolom Kanan: Hasil Pencarian & Grid Alat */}
        <div className="w-full min-w-0 space-y-6">
          <div className="w-full text-xs font-semibold text-[#5F7A84] flex items-center justify-between min-h-[28px]">
            <span>
              Menampilkan <strong className="text-[#234E5C] font-bold">{Math.min(visibleCount, filteredEquipment.length)}</strong> dari <strong className="text-[#234E5C] font-bold">{filteredEquipment.length}</strong> alat siap booking
            </span>
            {filteredEquipment.length > 12 && (
              <span className="text-[11px] text-[#5F7A84]/80 hidden sm:inline">
                Optimasi loading bertahap
              </span>
            )}
          </div>

          {/* Wrapper area hasil dengan min-height stabil dan transisi opacity */}
          <div
            className={`w-full min-w-0 min-h-[520px] lg:min-h-[max(60vh,520px)] flex flex-col justify-start transition-opacity duration-150 ${
              isPending ? "opacity-60 pointer-events-none" : "opacity-100"
            }`}
          >
            {filteredEquipment.length > 0 ? (
              <div className="space-y-8 w-full">
                <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-6 content-start">
                  {displayedEquipment.map((item, index) => {
                    if (shouldReduceMotion) {
                      return (
                        <div key={item.id} className="h-full">
                          <EquipmentCard equipment={item} />
                        </div>
                      );
                    }

                    const delay = getGridColumnDelay(index, 3);

                    return (
                      <Reveal
                        key={item.id}
                        delay={delay}
                        duration={0.32}
                        className="h-full"
                      >
                        <EquipmentCard equipment={item} />
                      </Reveal>
                    );
                  })}
                </div>

                {/* Tombol Muat Lebih Banyak (Pagination / Progressive Loading untuk HP) */}
                {filteredEquipment.length > visibleCount && (
                  <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-white border-2 border-[var(--border-soft)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm font-medium text-[var(--text-muted)] text-center sm:text-left">
                      Menampilkan <span className="font-bold text-[var(--bg-dark)]">{visibleCount}</span> dari{" "}
                      <span className="font-bold text-[var(--bg-dark)]">{filteredEquipment.length}</span> alat
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <Button
                        onClick={() => setVisibleCount((prev) => prev + 12)}
                        className="w-full sm:w-auto text-xs sm:text-sm font-bold px-6 h-11 rounded-xl bg-[var(--bg-dark)] text-white hover:bg-[#0B2F37] border-2 border-[var(--bg-dark)] shadow-xs hover:translate-y-[-1px] transition-all cursor-pointer"
                      >
                        Muat Lebih Banyak ({filteredEquipment.length - visibleCount} lagi)
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setVisibleCount(filteredEquipment.length)}
                        className="w-full sm:w-auto text-xs sm:text-sm font-bold px-6 h-11 rounded-xl bg-[var(--bg-sage)] hover:bg-white border-2 border-[var(--border-soft)] hover:border-[var(--bg-dark)] text-[var(--bg-dark)] shadow-xs hover:translate-y-[-1px] transition-all cursor-pointer"
                      >
                        Tampilkan Semua ({filteredEquipment.length})
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full min-h-[420px] flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-[#E8E8E1] bg-white shadow-xs">
                <Package className="h-12 w-12 text-[#5F7A84]/50 mb-3" />
                <h3 className="text-base font-bold text-[#234E5C]">
                  Tidak ada alat yang cocok
                </h3>
                <p className="text-xs text-[#5F7A84] max-w-sm mt-1">
                  Silakan sesuaikan kata kunci pencarian atau ubah rentang harga filter Anda.
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="mt-4 text-xs font-bold"
                  >
                    Reset Semua Filter
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
