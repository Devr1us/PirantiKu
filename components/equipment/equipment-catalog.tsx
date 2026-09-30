"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, type Variants } from "motion/react";
import {
  Search,
  Filter,
  SlidersHorizontal,
  X,
  ChevronDown,
  Layers,
  RotateCcw,
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
      {/* Kategori */}
      {!selectedCategorySlug && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Kategori Alat
          </h4>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => handleCategorySelect("")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !currentCategory
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>Semua Kategori</span>
              <span>{initialEquipment.length}</span>
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
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

      {/* Rentang Harga */}
      <div className="space-y-3 border-t border-border/80 pt-6">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Rentang Harga (Rp/hari)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-muted-foreground">Min</label>
            <Input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">Maks</label>
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
          className="w-full rounded-xl text-xs font-semibold h-8"
        >
          Terapkan Harga
        </Button>
      </div>

      {/* Reset Filter Button */}
      {hasActiveFilters && (
        <div className="border-t border-border/80 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="w-full rounded-xl text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-1.5 h-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Semua Filter
          </Button>
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

  // Perbarui URL saat filter berubah
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

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

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
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-card via-card to-primary/5 p-6 sm:p-10 shadow-sm">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Katalog Penyewaan
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {categoryTitle || "Semua Alat Rental Tersedia"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {categoryDescription ||
              "Temukan dan sewa berbagai perlengkapan berkualitas dengan kepastian stok real-time, biaya transparan, dan DP ringan 30%."}
          </p>
        </div>
      </div>

      {/* Control Bar: Pencarian, Urutan & Tombol Filter Mobile */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Form Pencarian */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cari nama alat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                applyFilters({ q: "" });
              }}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          {/* Drawer Filter Mobile Trigger */}
          <div className="lg:hidden flex-1 sm:flex-none">
            <Sheet
              open={isMobileFilterOpen}
              onOpenChange={setIsMobileFilterOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-2xl h-10 text-xs font-semibold flex items-center gap-2"
                >
                  <Filter className="h-4 w-4 text-primary" />
                  Filter
                  {hasActiveFilters && (
                    <span className="h-2 w-2 rounded-full bg-accent-warm" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs">
                <SheetHeader className="text-left border-b border-border pb-4">
                  <SheetTitle className="text-base font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    Filter Katalog
                  </SheetTitle>
                </SheetHeader>
                <div className="py-6">
                  <FilterSidebar {...filterProps} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Sort Selector Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <select
              value={currentSort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full sm:w-44 h-10 px-3.5 bg-card border border-border text-xs font-semibold text-foreground rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer pr-8 shadow-sm"
            >
              <option value="populer">Paling Populer</option>
              <option value="termurah">Harga: Rendah ke Tinggi</option>
              <option value="termahal">Harga: Tinggi ke Rendah</option>
              <option value="terbaru">Terbaru Ditambahkan</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 h-3.5 w-3.5 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar Desktop + Grid Kartu Alat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter Desktop */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
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
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Menampilkan{" "}
              <strong className="text-foreground font-bold">
                {filteredEquipment.length}
              </strong>{" "}
              alat siap sewa
            </span>
          </div>

          {filteredEquipment.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredEquipment.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <EquipmentCard equipment={item} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border bg-card">
              <Layers className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-bold text-foreground">
                Tidak ada alat yang cocok
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Coba sesuaikan kata kunci pencarian atau ubah rentang filter harga Anda.
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="mt-4 rounded-xl text-xs font-semibold"
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
