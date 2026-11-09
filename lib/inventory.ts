import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Menghitung sisa stok fisik yang benar-benar siap disewa / siap diambil.
 * Rumus: MAX(0, (stok - stok_rusak) - stok_disewa)
 */
export function calculateAvailableStock(equipment: {
  stok?: number | null;
  stok_rusak?: number | null;
  stok_disewa?: number | null;
  stok_tersedia?: number | null;
}): number {
  if (typeof equipment.stok_tersedia === "number") {
    return Math.max(0, equipment.stok_tersedia);
  }
  const cleanStock = Math.max(0, (equipment.stok || 0) - (equipment.stok_rusak || 0));
  const rented = Math.max(0, equipment.stok_disewa || 0);
  return Math.max(0, cleanStock - rented);
}

interface RpcStockRow {
  equipment_id?: number;
  stok_total?: number;
  stok_rusak?: number;
  stok_disewa?: number;
  sisa_stok?: number;
}

interface BookingItemWithBooking {
  equipment_id: number;
  qty: number;
  booking:
    | { status: string; tanggal_mulai: string; tanggal_selesai: string }
    | { status: string; tanggal_mulai: string; tanggal_selesai: string }[]
    | null;
}

/**
 * Mengambil ringkasan jumlah unit yang sedang disewa / aktif per equipment_id.
 * Mendukung pemanggilan RPC get_all_equipment_stock dengan fallback query booking_items.
 */
export async function fetchRentedUnitsSummary(
  supabase: SupabaseClient<Database>
): Promise<Record<number, number>> {
  const rentedMap: Record<number, number> = {};

  try {
    // 1. Coba RPC get_all_equipment_stock (SECURITY DEFINER)
    const res = await supabase.rpc("get_all_equipment_stock");
    const rpcData = res.data as unknown as RpcStockRow[] | null;

    if (!res.error && Array.isArray(rpcData) && rpcData.length > 0) {
      for (const row of rpcData) {
        if (typeof row.equipment_id === "number") {
          rentedMap[row.equipment_id] = Number(row.stok_disewa || 0);
        }
      }
      return rentedMap;
    }
  } catch {
    // Abaikan jika RPC belum dieksekusi di database, lanjut ke fallback
  }

  try {
    // 2. Fallback: Query tabel booking_items & bookings
    const today = new Date().toISOString().split("T")[0];
    const { data: rawItems, error: itemsError } = await supabase
      .from("booking_items")
      .select(`
        equipment_id,
        qty,
        booking:bookings!inner(
          status,
          tanggal_mulai,
          tanggal_selesai
        )
      `)
      .in("booking.status", ["diambil", "terlambat", "dp_dibayar", "lunas"]);

    if (!itemsError && Array.isArray(rawItems)) {
      const items = rawItems as unknown as BookingItemWithBooking[];
      for (const item of items) {
        const b = Array.isArray(item.booking) ? item.booking[0] : item.booking;
        if (!b) continue;

        const isPhysicallyRented = b.status === "diambil" || b.status === "terlambat";
        const isCurrentlyActiveRental =
          (b.status === "dp_dibayar" || b.status === "lunas") &&
          b.tanggal_mulai <= today &&
          today <= b.tanggal_selesai;

        if (isPhysicallyRented || isCurrentlyActiveRental) {
          const eqId = item.equipment_id;
          rentedMap[eqId] = (rentedMap[eqId] || 0) + (item.qty || 1);
        }
      }
    }
  } catch (err) {
    console.error("Gagal mengambil ringkasan unit disewa:", err);
  }

  return rentedMap;
}

/**
 * Menambahkan informasi stok_disewa dan stok_tersedia ke setiap objek alat.
 */
export function enrichEquipmentWithStock<
  T extends { id: number; stok?: number | null; stok_rusak?: number | null }
>(
  equipmentList: T[],
  rentedMap: Record<number, number>
): (T & { stok_disewa: number; stok_tersedia: number })[] {
  return equipmentList.map((item) => {
    const stok_disewa = rentedMap[item.id] || 0;
    const stok_tersedia = calculateAvailableStock({ ...item, stok_disewa });
    return {
      ...item,
      stok_disewa,
      stok_tersedia,
    };
  });
}
