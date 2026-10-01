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
import {
  AnimatedText,
  Stagger,
  StaggerItem,
} from "@/components/ui/motion";
import { H1, Lead } from "@/components/ui/typography";

interface FilterSidebarProps {
  categories: Category[];
  currentCategory: string;
  selectedCategorySlug?: string;
  initialEquipment: EquipmentWithDetails[];
  minPrice: string;
  maxPrice: string;
  setMinPrice: (val: string) => void;
  setMaxPrice: (val: string) => void;
  handleCategorySelect: (slug: string) => void;
  handlePriceApply: () => void;
  handleResetFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterSidebar({
  categories,
  currentCategory,
  selectedCategorySlug,
  initialEquipment,
  minPrice,
  maxPrice,
  setMinPrice,
  setMaxPrice,
  handleCategorySelect,
  handlePriceApply,
  handleResetFilters,
  hasActiveFilters,
}: FilterSidebarProps) {
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !currentCategory
                  ? "bg-[#234E5C] text-white"
                  : "text-[#5F7A84] hover:bg-white hover:text-[#234E5C]"
              }`}
            >
              <span>Semua Kategori</span>
              <span className="text-[11px] opacity-80">{initialEquipment.length}</span>
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#234E5C] text-white font-bold"
                      : "text-[#5F7A84] hover:bg-white hover:text-[#234E5C]"
                  }`}
                >
                  <span className="truncate">{cat.nama}</span>
                  <span className="text-[11px] opacity-80">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rentang Harga (Rp/hari) */}
      <div className="space-y-3 border-t border-[#E8E8E1] pt-5">
        <h4 className="text-xs font-bold text-[#234E5C] uppercase tracking-wider">
          Rentang Harga (Rp/hari)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-[#5F7A84] block mb-1">Min</label>
            <Input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#5F7A84] block mb-1">Maks</label>
            <Input
              type="number"
              placeholder="500000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePriceApply}
          className="w-full text-xs font-bold h-8"
        >
          Terapkan Harga
        </Button>
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

  // Ambil state dari URL search params
  const currentQ = searchParams.get("q") || "";
  const currentCategory = selectedCategorySlug || searchParams.get("kategori") || "";
  const currentSort = searchParams.get("sort") || "populer";
  const currentMinPrice = searchParams.get("min_harga") || "";
  const currentMaxPrice = searchParams.get("max_harga") || "";

  const [searchQuery, setSearchQuery] = React.useState(currentQ);
  const [minPrice, setMinPrice] = React.useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = React.useState(currentMaxPrice);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);

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
    router.push(`${targetPath}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ q: searchQuery });
  };

  const handleCategorySelect = (slug: string) => {
    if (selectedCategorySlug) {
      router.push(`/kategori/${slug}`);
    } else {
      const targetSlug = currentCategory === slug ? "" : slug;
      applyFilters({ kategori: targetSlug });
    }
  };

  const handleSortChange = (sortVal: string) => {
    applyFilters({ sort: sortVal });
  };

  const handlePriceApply = () => {
    applyFilters({ min_harga: minPrice, max_harga: maxPrice });
    setIsMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    if (selectedCategorySlug) {
      router.push(pathname);
    } else {
      router.push("/alat");
    }
    setIsMobileFilterOpen(false);
  };

  // Filter dan sorting lokal
  const filteredEquipment = React.useMemo(() => {
    return initialEquipment
      .filter((item) => {
        if (currentQ) {
          const qLower = currentQ.toLowerCase();
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
        return b.stok - a.stok;
      });
  }, [
    initialEquipment,
    currentQ,
    currentCategory,
    currentMinPrice,
    currentMaxPrice,
    currentSort,
  ]);

  const hasActiveFilters = Boolean(
    currentQ ||
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
    minPrice,
    maxPrice,
    setMinPrice,
    setMaxPrice,
    handleCategorySelect,
    handlePriceApply,
    handleResetFilters,
    hasActiveFilters,
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 space-y-8 bg-[#FAFAF8] text-[#234E5C]">
      {/* Header Halaman: Judul Kapital Petrol + Satu Kalimat Pendukung */}
      <div className="space-y-2 border-b border-[#E8E8E1] pb-6">
        <H1 className="section-title block">
          {categoryTitle ? categoryTitle.toUpperCase() : "KATALOG ALAT RENTAL"}
        </H1>
        <Lead className="text-base text-[#5F7A84] font-medium leading-relaxed max-w-3xl">
          {categoryDescription ||
            "Pilihan perlengkapan berkualitas dengan kepastian ketersediaan unit, biaya sewa harian transparan, dan DP ringan mulai 30%."}
        </Lead>
      </div>

      {/* Control Bar: Pencarian & Pengurutan */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Form Pencarian */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F7A84]" />
          <Input
            type="text"
            placeholder="Cari nama alat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 text-sm bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                applyFilters({ q: "" });
              }}
              className="absolute right-3.5 top-3.5 text-[#5F7A84] hover:text-[#234E5C] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          {/* Tombol Filter Mobile */}
          <div className="lg:hidden flex-1 sm:flex-none">
            <Sheet
              open={isMobileFilterOpen}
              onOpenChange={setIsMobileFilterOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-11 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Filter className="h-4 w-4 text-[#234E5C]" />
                  FILTER
                  {hasActiveFilters && (
                    <span className="h-2 w-2 rounded-full bg-[#A0630F]" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs bg-white p-6">
                <SheetHeader className="text-left border-b border-[#E8E8E1] pb-4 mb-4">
                  <SheetTitle className="text-base font-bold text-[#234E5C] flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-[#234E5C]" />
                    Filter Katalog
                  </SheetTitle>
                </SheetHeader>
                <div className="py-2">
                  <FilterSidebar {...filterProps} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Pengurutan */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full sm:w-48 h-11 px-3.5 bg-white border border-[#E8E8E1] text-xs font-bold text-[#234E5C] rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#234E5C] cursor-pointer pr-8"
            >
              <option value="populer">Paling Banyak Unit</option>
              <option value="termurah">Harga: Rendah ke Tinggi</option>
              <option value="termahal">Harga: Tinggi ke Rendah</option>
              <option value="terbaru">Terbaru Ditambahkan</option>
            </select>
            <ChevronDown className="absolute right-3 top-4 h-3.5 w-3.5 pointer-events-none text-[#5F7A84]" />
          </div>
        </div>
      </div>

      {/* Konten Utama: Filter di Wadah --panel + Grid Kartu Alat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter Desktop: Wadah --panel */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-[var(--navbar-offset)] rounded-2xl bg-[#F3F3EF] border border-[#E8E8E1] p-5 transition-[top] duration-300">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E8E8E1]">
              <h3 className="text-sm font-bold text-[#234E5C] flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#234E5C]" />
                Filter Alat
              </h3>
            </div>
            <div className="pt-4">
              <FilterSidebar {...filterProps} />
            </div>
          </div>
        </aside>

        {/* Grid Kartu Alat */}
        <main className="lg:col-span-3 space-y-6">
          <div className="text-xs font-semibold text-[#5F7A84]">
            Menampilkan <strong className="text-[#234E5C] font-bold">{filteredEquipment.length}</strong> alat siap sewa
          </div>

          {filteredEquipment.length > 0 ? (
            <Stagger
              staggerDelay={0.05}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredEquipment.map((item) => (
                <StaggerItem key={item.id}>
                  <EquipmentCard equipment={item} />
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-[#E8E8E1] bg-white">
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
        </main>
      </div>
    </div>
  );
}
