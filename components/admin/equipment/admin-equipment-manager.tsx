"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
  AlertCircle,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  DollarSign,
  Tag,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatRupiah } from "@/lib/format";
import { compressImage } from "@/lib/payment-utils";
import type { EquipmentWithDetails, Category } from "@/types/database";

interface AdminEquipmentManagerProps {
  initialEquipment: EquipmentWithDetails[];
  categories: Category[];
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function AdminEquipmentManager({
  initialEquipment,
  categories,
}: AdminEquipmentManagerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [equipmentList, setEquipmentList] = React.useState<EquipmentWithDetails[]>(initialEquipment);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("semua");
  const [statusFilter, setStatusFilter] = React.useState<"semua" | "aktif" | "nonaktif" | "rusak">("semua");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Form Fields
  const [nama, setNama] = React.useState<string>("");
  const [slug, setSlug] = React.useState<string>("");
  const [isCustomSlug, setIsCustomSlug] = React.useState<boolean>(false);
  const [categoryId, setCategoryId] = React.useState<number>(categories[0]?.id || 1);
  const [hargaPerHari, setHargaPerHari] = React.useState<string>("50000");
  const [hargaMingguan, setHargaMingguan] = React.useState<string>("");
  const [deposit, setDeposit] = React.useState<string>("100000");
  const [stok, setStok] = React.useState<string>("5");
  const [stokRusak, setStokRusak] = React.useState<string>("0");
  const [aktif, setAktif] = React.useState<boolean>(true);
  const [deskripsi, setDeskripsi] = React.useState<string>("");
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const [specsText, setSpecsText] = React.useState<string>("");

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = React.useState<boolean>(false);

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setNama("");
    setSlug("");
    setIsCustomSlug(false);
    setCategoryId(categories[0]?.id || 1);
    setHargaPerHari("50000");
    setHargaMingguan("");
    setDeposit("100000");
    setStok("5");
    setStokRusak("0");
    setAktif(true);
    setDeskripsi("");
    setImageUrl("");
    setSpecsText("");
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (item: EquipmentWithDetails) => {
    setEditingId(item.id);
    setNama(item.nama);
    setSlug(item.slug);
    setIsCustomSlug(true);
    setCategoryId(item.category_id);
    setHargaPerHari(String(item.harga_per_hari));
    setHargaMingguan(item.harga_mingguan ? String(item.harga_mingguan) : "");
    setDeposit(String(item.deposit));
    setStok(String(item.stok));
    setStokRusak(String(item.stok_rusak));
    setAktif(item.aktif);
    setDeskripsi(item.deskripsi || "");

    // Ambil gambar utama
    const mainImg = item.images?.find((img) => img.is_utama) || item.images?.[0];
    setImageUrl(mainImg?.url || "");

    // Format spesifikasi ke text key: value
    if (item.spesifikasi && typeof item.spesifikasi === "object") {
      const lines = Object.entries(item.spesifikasi).map(
        ([k, v]) => `${k}: ${v}`
      );
      setSpecsText(lines.join("\n"));
    } else {
      setSpecsText("");
    }

    setIsModalOpen(true);
  };

  // Handle Nama Change with Auto-slug
  const handleNamaChange = (val: string) => {
    setNama(val);
    if (!isCustomSlug && !editingId) {
      setSlug(slugify(val));
    }
  };

  // Handle image upload & compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, atau WebP)");
      return;
    }

    setIsProcessingImage(true);
    try {
      const compressedData = await compressImage(file, 900, 0.85);
      setImageUrl(compressedData);
      toast.success("Foto alat berhasil dikompresi & dimuat.");
    } catch {
      toast.error("Gagal memproses gambar alat.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Submit Save (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nama.trim()) {
      toast.error("Nama alat wajib diisi.");
      return;
    }

    const finalSlug = (slug.trim() || slugify(nama)).toLowerCase();
    const harian = Math.max(0, parseInt(hargaPerHari, 10) || 0);
    const mingguan = hargaMingguan ? Math.max(0, parseInt(hargaMingguan, 10) || 0) : null;
    const dep = Math.max(0, parseInt(deposit, 10) || 0);
    const st = Math.max(0, parseInt(stok, 10) || 0);
    const stRusak = Math.max(0, parseInt(stokRusak, 10) || 0);

    // Parse spesifikasi text menjadi JSON object
    let spesifikasiObj: Record<string, string> | null = null;
    if (specsText.trim()) {
      spesifikasiObj = {};
      specsText.split("\n").forEach((line) => {
        const parts = line.split(":");
        if (parts.length >= 2) {
          const k = parts[0].trim();
          const v = parts.slice(1).join(":").trim();
          if (k && v) {
            spesifikasiObj![k] = v;
          }
        }
      });
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // UPDATE EQUIPMENT
        const { data: updatedEq, error: eqErr } = await supabase
          .from("equipment")
          .update({
            nama: nama.trim(),
            slug: finalSlug,
            category_id: categoryId,
            harga_per_hari: harian,
            harga_mingguan: mingguan,
            deposit: dep,
            stok: st,
            stok_rusak: stRusak,
            aktif,
            deskripsi: deskripsi.trim() || null,
            spesifikasi: spesifikasiObj,
          })
          .eq("id", editingId)
          .select(`*, category:categories(*), images:equipment_images(*)`)
          .single();

        if (eqErr) throw eqErr;

        // Update / Insert Foto Alat jika diisi
        if (imageUrl.trim()) {
          const { data: existingImgs } = await supabase
            .from("equipment_images")
            .select("id")
            .eq("equipment_id", editingId)
            .limit(1);

          if (existingImgs && existingImgs.length > 0) {
            await supabase
              .from("equipment_images")
              .update({ url: imageUrl.trim() })
              .eq("id", existingImgs[0].id);
          } else {
            await supabase.from("equipment_images").insert({
              equipment_id: editingId,
              url: imageUrl.trim(),
              is_utama: true,
              urutan: 1,
            });
          }
        }

        // Perbarui state
        setEquipmentList((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? ({
                  ...(updatedEq as EquipmentWithDetails),
                  images: imageUrl.trim()
                    ? [{ id: 999, equipment_id: editingId, url: imageUrl.trim(), is_utama: true, urutan: 1 }]
                    : item.images,
                } as EquipmentWithDetails)
              : item
          )
        );

        toast.success(`Alat "${nama}" berhasil diperbarui!`);
      } else {
        // CREATE NEW EQUIPMENT
        const { data: newEq, error: eqErr } = await supabase
          .from("equipment")
          .insert({
            nama: nama.trim(),
            slug: finalSlug,
            category_id: categoryId,
            harga_per_hari: harian,
            harga_mingguan: mingguan,
            deposit: dep,
            stok: st,
            stok_rusak: stRusak,
            aktif,
            deskripsi: deskripsi.trim() || null,
            spesifikasi: spesifikasiObj,
          })
          .select(`*, category:categories(*)`)
          .single();

        if (eqErr) throw eqErr;

        // Tambah Gambar jika diisi
        let insertedImages: any[] = [];
        if (newEq && imageUrl.trim()) {
          const { data: imgData } = await supabase
            .from("equipment_images")
            .insert({
              equipment_id: newEq.id,
              url: imageUrl.trim(),
              is_utama: true,
              urutan: 1,
            })
            .select();

          if (imgData) insertedImages = imgData;
        }

        const fullNewItem: EquipmentWithDetails = {
          ...(newEq as EquipmentWithDetails),
          images: insertedImages,
        };

        setEquipmentList((prev) => [fullNewItem, ...prev]);
        toast.success(`Alat "${nama}" berhasil ditambahkan ke inventaris!`);
      }

      setIsModalOpen(false);
      resetForm();
      router.refresh();
    } catch (err: unknown) {
      console.error("Gagal menyimpan alat:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal menyimpan alat: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle status aktif langsung dari tabel
  const handleToggleAktif = async (item: EquipmentWithDetails) => {
    const nextStatus = !item.aktif;
    try {
      const { error } = await supabase
        .from("equipment")
        .update({ aktif: nextStatus })
        .eq("id", item.id);

      if (error) throw error;

      setEquipmentList((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, aktif: nextStatus } : e))
      );
      toast.success(
        `Alat "${item.nama}" ${nextStatus ? "diaktifkan" : "dinonaktifkan"}.`
      );
    } catch {
      toast.error("Gagal mengubah status aktif alat.");
    }
  };

  // Delete Equipment
  const handleDelete = async (item: EquipmentWithDetails) => {
    if (!confirm(`Hapus alat "${item.nama}" dari inventaris?`)) {
      return;
    }

    try {
      // Coba hapus langsung
      const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", item.id);

      if (error) {
        // Jika terdapat riwayat sewa / foreign key constraint, tawarkan soft delete (nonaktifkan)
        if (error.code === "23503" || error.message.includes("violates foreign key")) {
          const soft = confirm(
            `Alat ini memiliki riwayat penyewaan sebelumnya dan tidak dapat dihapus permanen. Nonaktifkan alat ini agar tidak tampil lagi di katalog?`
          );
          if (soft) {
            await supabase
              .from("equipment")
              .update({ aktif: false })
              .eq("id", item.id);

            setEquipmentList((prev) =>
              prev.map((e) => (e.id === item.id ? { ...e, aktif: false } : e))
            );
            toast.success(`Alat "${item.nama}" dinonaktifkan dari katalog.`);
            return;
          }
        }
        throw error;
      }

      setEquipmentList((prev) => prev.filter((e) => e.id !== item.id));
      toast.success(`Alat "${item.nama}" berhasil dihapus.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(`Gagal menghapus: ${msg}`);
    }
  };

  // Filter & Search Logic
  const filteredEquipment = React.useMemo(() => {
    return equipmentList.filter((item) => {
      // 1. Filter Kategori
      if (selectedCategory !== "semua" && String(item.category_id) !== selectedCategory) {
        return false;
      }

      // 2. Filter Status
      if (statusFilter === "aktif" && !item.aktif) return false;
      if (statusFilter === "nonaktif" && item.aktif) return false;
      if (statusFilter === "rusak" && (item.stok_rusak || 0) <= 0) return false;

      // 3. Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = item.nama.toLowerCase().includes(q);
      const slugMatch = item.slug.toLowerCase().includes(q);
      const catMatch = item.category?.nama?.toLowerCase().includes(q);
      return nameMatch || slugMatch || catMatch;
    });
  }, [equipmentList, selectedCategory, statusFilter, searchQuery]);

  // Statistics
  const totalJenis = equipmentList.length;
  const totalUnitBersih = equipmentList.reduce(
    (sum, e) => sum + Math.max(0, (e.stok || 0) - (e.stok_rusak || 0)),
    0
  );
  const totalUnitRusak = equipmentList.reduce((sum, e) => sum + (e.stok_rusak || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Bar Statistik Singkat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
              Total Jenis Alat
            </span>
            <span className="text-2xl font-extrabold text-[#234E5C]">
              {totalJenis} <span className="text-xs font-semibold text-[#5F7A84]">tipe</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#FAFAF8] border border-[#E8E8E1] flex items-center justify-center text-[#234E5C]">
            <Package className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
              Unit Siap Disewa
            </span>
            <span className="text-2xl font-extrabold text-[#2E5E4E]">
              {totalUnitBersih} <span className="text-xs font-semibold text-[#5F7A84]">unit</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#E2F0D9] text-[#2E5E4E] flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E8E8E1] bg-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F7A84] block">
              Unit Sedang Servis / Rusak
            </span>
            <span className="text-2xl font-extrabold text-[#991B1B]">
              {totalUnitRusak} <span className="text-xs font-semibold text-[#5F7A84]">unit</span>
            </span>
          </div>
          <div className="h-10 w-10 rounded-full bg-[#FEE2E2] text-[#991B1B] flex items-center justify-center">
            <Wrench className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. Toolbar Filter & Tombol Tambah */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5F7A84]" />
            <Input
              type="text"
              placeholder="Cari nama alat atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-white rounded-xl"
            />
          </div>

          {/* Kategori Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
          >
            <option value="semua">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nama}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex rounded-xl border border-[#E8E8E1] bg-white p-1 gap-1 text-xs">
            {(["semua", "aktif", "nonaktif", "rusak"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-bold capitalize transition-all ${
                  statusFilter === st
                    ? "bg-[#234E5C] text-white"
                    : "text-[#5F7A84] hover:text-[#234E5C]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="warm"
          size="sm"
          onClick={handleOpenCreate}
          className="text-xs font-bold gap-1.5 shadow-sm shrink-0 h-10 px-5"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Alat Baru</span>
        </Button>
      </div>

      {/* 3. Tabel Data Inventaris */}
      <div className="rounded-xl border border-[#E8E8E1] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#234E5C]">
            <thead className="border-b border-[#E8E8E1] bg-[#FAFAF8] text-[11px] uppercase font-bold text-[#5F7A84]">
              <tr>
                <th className="py-3 px-4 w-14 text-center">Foto</th>
                <th className="py-3 px-4">Nama Alat</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Tarif / Hari</th>
                <th className="py-3 px-4 text-right">Deposit</th>
                <th className="py-3 px-4 text-center">Stok Bersih</th>
                <th className="py-3 px-4 text-center">Rusak</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8E1]">
              {filteredEquipment.length > 0 ? (
                filteredEquipment.map((item) => {
                  const bersih = Math.max(0, (item.stok || 0) - (item.stok_rusak || 0));
                  const mainImg = item.images?.find((img) => img.is_utama) || item.images?.[0];

                  return (
                    <tr key={item.id} className="hover:bg-[#F3F3EF]/50 transition-colors">
                      {/* Foto Thumbnail */}
                      <td className="py-3 px-4 text-center">
                        <div className="h-10 w-10 rounded-lg overflow-hidden border border-[#E8E8E1] bg-[#FAFAF8] relative mx-auto flex items-center justify-center">
                          {mainImg?.url ? (
                            <img
                              src={mainImg.url}
                              alt={item.nama}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-[#5F7A84]/60" />
                          )}
                        </div>
                      </td>

                      {/* Nama Alat & Slug */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/alat/${item.slug}`}
                          target="_blank"
                          className="font-bold text-[#234E5C] hover:text-[#A0630F] hover:underline block leading-snug"
                        >
                          {item.nama}
                        </Link>
                        <span className="font-mono text-[10px] text-[#5F7A84]">
                          /{item.slug}
                        </span>
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4 font-semibold text-[#5F7A84]">
                        {item.category?.nama || "-"}
                      </td>

                      {/* Harga per Hari */}
                      <td className="py-3 px-4 text-right font-bold text-[#A0630F]">
                        {formatRupiah(item.harga_per_hari)}
                      </td>

                      {/* Deposit */}
                      <td className="py-3 px-4 text-right font-medium text-[#5F7A84]">
                        {formatRupiah(item.deposit)}
                      </td>

                      {/* Stok Bersih */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            bersih > 0
                              ? "bg-[#E2F0D9] text-[#2E5E4E]"
                              : "bg-[#FEE2E2] text-[#991B1B]"
                          }`}
                        >
                          {bersih} unit
                        </span>
                      </td>

                      {/* Stok Rusak */}
                      <td className="py-3 px-4 text-center font-medium">
                        {(item.stok_rusak || 0) > 0 ? (
                          <span className="text-[#991B1B] font-bold">
                            {item.stok_rusak} unit
                          </span>
                        ) : (
                          <span className="text-[#5F7A84]">0</span>
                        )}
                      </td>

                      {/* Status Aktif */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAktif(item)}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            item.aktif
                              ? "bg-[#E2F0D9] text-[#2E5E4E] border-[#C5E1A5] hover:bg-[#C5E1A5]"
                              : "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB] hover:bg-[#E5E7EB]"
                          }`}
                          title="Klik untuk ubah status aktif"
                        >
                          {item.aktif ? "Aktif" : "Nonaktif"}
                        </button>
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="h-8 w-8 p-0 text-[#234E5C] hover:bg-[#F3F3EF]"
                            title="Edit Data Alat"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item)}
                            className="h-8 w-8 p-0 text-[#991B1B] hover:bg-[#FEE2E2]"
                            title="Hapus Alat"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#5F7A84]">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm">Tidak ada alat yang sesuai filter.</p>
                    <p className="text-xs text-[#5F7A84]">
                      Coba ganti kata kunci pencarian atau tambah alat baru.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL DIALOG CREATE & EDIT ALAT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#234E5C] border-b border-[#E8E8E1] pb-3">
              {editingId ? "Edit Perlengkapan Sewa" : "Tambah Perlengkapan Sewa Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* 1. Baris Nama & Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Nama Alat <span className="text-[#DC2626]">*</span>
                </Label>
                <Input
                  required
                  placeholder="Contoh: Tenda Dome Eiger 4P"
                  value={nama}
                  onChange={(e) => handleNamaChange(e.target.value)}
                  className="h-10 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Kategori Alat <span className="text-[#DC2626]">*</span>
                </Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8E8E1] bg-white text-xs font-semibold text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Slug URL */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Slug URL (Otomatis)
                </Label>
                <button
                  type="button"
                  onClick={() => setIsCustomSlug(!isCustomSlug)}
                  className="text-[11px] font-bold text-[#A0630F] hover:underline"
                >
                  {isCustomSlug ? "Kunci Otomatis" : "Ubah Manual"}
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-[#5F7A84]">/alat/</span>
                <Input
                  value={slug}
                  disabled={!isCustomSlug && !editingId}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="tenda-dome-eiger-4p"
                  className="h-9 text-xs font-mono flex-1"
                />
              </div>
            </div>

            {/* 2. Baris Finansial: Tarif Harian, Mingguan, Deposit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1]">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Tarif / Hari (Rp) <span className="text-[#DC2626]">*</span>
                </Label>
                <Input
                  type="number"
                  required
                  min={0}
                  step={5000}
                  value={hargaPerHari}
                  onChange={(e) => setHargaPerHari(e.target.value)}
                  className="h-10 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Tarif / Minggu (Opsional)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  placeholder="Opsional"
                  value={hargaMingguan}
                  onChange={(e) => setHargaMingguan(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Deposit Jaminan (Rp)
                </Label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className="h-10 text-xs font-bold"
                />
              </div>
            </div>

            {/* 3. Baris Stok Total & Stok Rusak */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Stok Total Unit <span className="text-[#DC2626]">*</span>
                </Label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={stok}
                  onChange={(e) => setStok(e.target.value)}
                  className="h-10 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Unit Rusak / Servis
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={stokRusak}
                  onChange={(e) => setStokRusak(e.target.value)}
                  className="h-10 text-xs text-[#991B1B] font-bold"
                />
                <span className="text-[10px] text-[#5F7A84] block">
                  Tidak dapat disewa pelanggan
                </span>
              </div>

              <div className="space-y-1.5 flex flex-col justify-center pt-2 sm:pt-0">
                <Label className="text-xs font-bold text-[#234E5C] mb-1">
                  Status Publikasi
                </Label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aktif}
                    onChange={(e) => setAktif(e.target.checked)}
                    className="h-4 w-4 rounded text-[#234E5C] focus:ring-[#234E5C]"
                  />
                  <span className="text-xs font-bold text-[#234E5C]">
                    Tampilkan di Katalog
                  </span>
                </label>
              </div>
            </div>

            {/* 4. Foto Peralatan */}
            <div className="space-y-2 p-4 rounded-xl bg-[#FAFAF8] border border-[#E8E8E1]">
              <Label className="text-xs font-bold text-[#234E5C]">
                Foto Utama Perlengkapan
              </Label>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {imageUrl ? (
                  <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-[#E8E8E1] shrink-0 bg-white">
                    <img
                      src={imageUrl}
                      alt="Pratinjau"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-white border-2 border-dashed border-[#E8E8E1] flex items-center justify-center text-[#5F7A84] shrink-0">
                    <Upload className="h-6 w-6 opacity-40" />
                  </div>
                )}

                <div className="flex-1 w-full space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="https://... atau klik Unggah Foto"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="h-10 text-xs font-mono flex-1 bg-white"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingImage}
                      className="h-10 text-xs font-bold shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      {isProcessingImage ? "Memproses..." : "Pilih File"}
                    </Button>
                  </div>
                  <span className="text-[10px] text-[#5F7A84] block">
                    Format gambar JPG, PNG, atau WebP (otomatis dikompresi &lt;150KB)
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Deskripsi & Spesifikasi */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#234E5C]">
                  Deskripsi Lengkap
                </Label>
                <textarea
                  rows={3}
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan kondisi unit, fitur unggulan, dan kelengkapan standar..."
                  className="w-full rounded-xl border border-[#E8E8E1] bg-white p-3 text-xs text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-[#234E5C]">
                    Spesifikasi Teknis (Format Baris: Nama: Nilai)
                  </Label>
                  <span className="text-[10px] text-[#5F7A84]">
                    Contoh: Merk: Eiger
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={specsText}
                  onChange={(e) => setSpecsText(e.target.value)}
                  placeholder={"Kapasitas: 4 Orang\nBerat: 3.2 Kg\nBahan: Polyester Ripstop 210T\nFrame: Fiber Alloy"}
                  className="w-full font-mono rounded-xl border border-[#E8E8E1] bg-white p-3 text-xs text-[#234E5C] focus:outline-none focus:ring-2 focus:ring-[#234E5C]"
                />
              </div>
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="border-t border-[#E8E8E1] pt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="warm"
                size="sm"
                disabled={isSubmitting}
                className="text-xs font-bold px-6"
              >
                {isSubmitting ? "Menyimpan Data..." : editingId ? "Simpan Perubahan" : "Tambahkan ke Inventaris"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminEquipmentManager;
