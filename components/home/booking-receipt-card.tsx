"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

export interface ReceiptItem {
  name: string;
  qty: number;
  subtotal: number;
}

export interface ReceiptData {
  customerName: string;
  pickupSchedule: string;
  bookingCode: string;
  orderId: string;
  statusLabel: string;
  durationLabel: string;
  items: ReceiptItem[];
  totalPrice: number;
  remainingPrice: number;
  dpStatus: string;
}

/**
 * Data simulasi nota booking PirantiKu.
 * Dipisahkan ke konstanta ini agar mudah disesuaikan atau diuji.
 */
export const DUMMY_RECEIPT_DATA: ReceiptData = {
  customerName: "Rina Anggraini",
  pickupSchedule: "Ambil: Rab, 18 Nov · 09.00 WIB",
  bookingCode: "PK-042",
  orderId: "#PK-0012",
  statusLabel: "Siap Diambil",
  durationLabel: "RINCIAN ALAT · 3 HARI",
  items: [
    { name: "Tenda Dome 4 Orang", qty: 1, subtotal: 225000 },
    { name: "Kompor Portable", qty: 1, subtotal: 45000 },
    { name: "Sleeping Bag", qty: 2, subtotal: 60000 },
  ],
  totalPrice: 330000,
  remainingPrice: 231000,
  dpStatus: "DP 30% LUNAS",
};

interface BookingReceiptCardProps {
  totalActiveTypes?: number;
  data?: ReceiptData;
  className?: string;
}

export function BookingReceiptCard({
  totalActiveTypes = 34,
  data = DUMMY_RECEIPT_DATA,
  className = "",
}: BookingReceiptCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const totalToolCount = totalActiveTypes > 0 ? totalActiveTypes : 34;

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? false
          : { opacity: 0, y: 35, rotate: -2 }
      }
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className={`relative w-full max-w-[420px] lg:max-w-[390px] xl:max-w-[460px] 2xl:max-w-[500px] mx-auto select-none ${className}`}
    >
      {/* ========================================================
          1. LAPISAN KARTU BELAKANG (Layered Shadow Depth)
          ======================================================== */}
      {/* Lapisan 1: Emas (#F2B93B) miring rotate(5deg) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[28px] bg-[var(--accent-gold)] rotate-[5deg] scale-[0.98] transition-transform duration-300 pointer-events-none shadow-md shadow-[var(--accent-gold)]/20"
      />

      {/* Lapisan 2: Teal Tua (#0F3D47) miring rotate(-3deg) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-[28px] bg-[var(--bg-dark)] -rotate-[3deg] scale-[0.99] transition-transform duration-300 pointer-events-none shadow-lg shadow-[var(--bg-dark)]/25"
      />

      {/* ========================================================
          2. KARTU UTAMA PUTIH (Rounded-[28px] + Ticket Cutouts)
          ======================================================== */}
      <div className="relative z-10 w-full rounded-[24px] sm:rounded-[28px] bg-white border border-[var(--border-soft)] shadow-2xl shadow-black/10 p-5 sm:p-6 lg:p-5 xl:p-8 text-[var(--text-main)] overflow-hidden">
        {/* Header Nota: User, Jadwal, ID & Status Badge */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border-soft)]">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[var(--accent-gold)] block">
              USER
            </span>
            <h4 className="text-xl sm:text-2xl lg:text-xl xl:text-[26px] font-black text-[var(--bg-dark)] tracking-tight leading-tight mt-0.5">
              {data.customerName}
            </h4>
            <p className="text-xs sm:text-[13px] text-[var(--text-muted)] font-medium mt-1">
              {data.pickupSchedule}
            </p>
          </div>

          <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
            <span className="font-mono text-xs sm:text-sm font-bold text-[var(--text-muted)]">
              {data.orderId}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E2F0D9] text-[#2E5E4E] border border-[#C5E1A5]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2E5E4E]" />
              {data.statusLabel}
            </span>
          </div>
        </div>

        {/* Kotak Abu Krem: KODE BOOKING Besar */}
        <div className="my-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] p-3 sm:p-4 text-center">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[var(--text-muted)] block">
            KODE BOOKING
          </span>
          <div className="text-2xl sm:text-4xl lg:text-3xl xl:text-[44px] font-black tracking-[0.2em] text-[var(--bg-dark)] font-mono leading-tight py-1">
            {data.bookingCode}
          </div>
          <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">
            Tunjukkan kode ini ke admin saat pengambilan
          </p>
        </div>

        {/* Pemisah Tiket Sobek 1 (Garis putus-putus + 2 lubang lingkaran di sisi) */}
        <div className="relative my-4">
          {/* Lubang sobek kiri */}
          <div
            aria-hidden="true"
            className="absolute -left-[32px] sm:-left-[40px] top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--bg-sage)] border-r border-[var(--border-soft)]"
          />
          {/* Garis putus-putus */}
          <div className="border-t-2 border-dashed border-[var(--border-soft)] w-full" />
          {/* Lubang sobek kanan */}
          <div
            aria-hidden="true"
            className="absolute -right-[32px] sm:-right-[40px] top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--bg-sage)] border-l border-[var(--border-soft)]"
          />
        </div>

        {/* Rincian Peralatan */}
        <div className="space-y-2.5 py-0.5">
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-[var(--accent-gold)] block">
            {data.durationLabel}
          </span>
          <div className="space-y-2 text-xs sm:text-sm">
            {data.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-baseline justify-between text-[var(--text-muted)]"
              >
                <span className="font-semibold text-[var(--bg-dark)]">
                  {item.qty}× {item.name}
                </span>
                <span className="flex-1 mx-2.5 border-b border-dotted border-[var(--border-soft)] min-w-3" />
                <span className="font-mono font-bold text-[var(--bg-dark)]">
                  Rp {item.subtotal.toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pemisah Tiket Sobek 2 */}
        <div className="relative my-4">
          <div
            aria-hidden="true"
            className="absolute -left-[32px] sm:-left-[40px] top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--bg-sage)] border-r border-[var(--border-soft)]"
          />
          <div className="border-t-2 border-dashed border-[var(--border-soft)] w-full" />
          <div
            aria-hidden="true"
            className="absolute -right-[32px] sm:-right-[40px] top-1/2 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--bg-sage)] border-l border-[var(--border-soft)]"
          />
        </div>

        {/* Total Sewa & Stempel DP 30% LUNAS */}
        <div className="flex items-center justify-between gap-3 pt-1 pb-1">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] block">
              TOTAL BOOKING
            </span>
            <div className="text-2xl sm:text-3xl xl:text-[34px] font-black text-[var(--bg-dark)] leading-none mt-1">
              Rp {data.totalPrice.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--text-muted)] mt-1 font-medium">
              Sisa Rp {data.remainingPrice.toLocaleString("id-ID")} dibayar saat ambil
            </p>
          </div>

          {/* Stempel DP 30% LUNAS miring -8deg */}
          <motion.div
            initial={
              shouldReduceMotion
                ? false
                : { scale: 1.45, opacity: 0, rotate: -8 }
            }
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{
              delay: 0.45,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border-[3px] border-[var(--accent-gold)] bg-[var(--bg-base)] text-[var(--bg-dark)] shadow-sm select-none shrink-0"
            aria-label={data.dpStatus}
          >
            <span className="block text-xs sm:text-sm font-black uppercase tracking-wider text-center whitespace-nowrap">
              {data.dpStatus}
            </span>
          </motion.div>
        </div>

        {/* Footer Nota: Stok Terkunci Otomatis & Verifikasi Sukses */}
        <div className="pt-3.5 mt-3.5 sm:pt-4 sm:mt-4 border-t border-[var(--border-soft)] flex items-center justify-between text-xs sm:text-[13px]">
          <span className="text-[var(--text-muted)] font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#2E5E4E]" />
            Stok terkunci otomatis
          </span>
          <span className="font-mono font-bold text-[#2E5E4E] tracking-wider">
            VERIFIKASI SUKSES
          </span>
        </div>
      </div>

      {/* ========================================================
          3. DUA BADGE MELAYANG (Floating Badges)
          ======================================================== */}
      {/* Badge 1 (Kanan Atas): Stok Tersedia */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, -6, 0],
                rotate: [3, 4.5, 3],
              }
        }
        transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-3.5 -right-2 sm:-right-4 z-20 px-4 py-2 rounded-full bg-white border border-[var(--border-soft)] shadow-lg text-xs sm:text-sm font-bold text-[var(--bg-dark)] flex items-center gap-2 select-none"
        aria-hidden="true"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#2E5E4E]" />
        <span>Stok tersedia</span>
      </motion.div>

      {/* Badge 2 (Kiri Bawah): N+ alat siap sewa (Diambil dari data asli) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                y: [0, 6, 0],
                rotate: [-4, -2.5, -4],
              }
        }
        transition={{
          duration: 5.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6,
        }}
        className="absolute -bottom-3.5 -left-2 sm:-left-4 z-20 px-4.5 py-2 rounded-full bg-[var(--accent-gold)] border border-[#E0A82E] shadow-lg text-xs sm:text-sm font-black text-[var(--bg-dark)] flex items-center gap-2 select-none"
        aria-hidden="true"
      >
        <span>{totalToolCount}+ alat siap booking</span>
      </motion.div>
    </motion.div>
  );
}
