"use client";

import * as React from "react";
import { Calendar } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import {
  isiHariKosong,
  hitungBatasSumbuY,
  formatRupiahRingkas,
  formatTanggalIndoPenuh,
  type DailyChartItem,
  type GenericChartDataPoint,
} from "@/lib/chart-utils";

interface DailyIncomeChartProps {
  data: GenericChartDataPoint[];
  dari: string;
  sampai: string;
  isLoading?: boolean;
}

export function DailyIncomeChart({
  data = [],
  dari,
  sampai,
  isLoading = false,
}: DailyIncomeChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // 1. Lengkapi seluruh tanggal dalam rentang dengan fungsi isiHariKosong
  const chartItems: DailyChartItem[] = React.useMemo(() => {
    return isiHariKosong(data, dari, sampai);
  }, [data, dari, sampai]);

  // 2. Hitung statistik nilai maksimum asli dan total pemasukan rentang ini
  const { maxOriginalAmount, totalPemasukan } = React.useMemo(() => {
    let max = 0;
    let sum = 0;
    for (const item of chartItems) {
      if (item.total > max) max = item.total;
      sum += item.total;
    }
    return { maxOriginalAmount: max, totalPemasukan: sum };
  }, [chartItems]);

  // 3. Hitung batas sumbu Y berbasis angka "bagus" (contoh: Rp 508.800 -> Rp 600.000)
  const { maxAxis, ticks } = React.useMemo(() => {
    return hitungBatasSumbuY(maxOriginalAmount);
  }, [maxOriginalAmount]);

  // Geometri SVG tetap (viewBox="0 0 800 280")
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 280;
  const PADDING_TOP = 25;
  const PADDING_BOTTOM = 40;
  const PADDING_LEFT = 75;
  const PADDING_RIGHT = 25;

  const PLOT_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT; // 700
  const PLOT_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM; // 215
  const BASELINE_Y = PADDING_TOP + PLOT_HEIGHT; // 240

  const totalDays = chartItems.length;

  // Logika interval pelabelan sumbu X agar tidak bertumpuk jika > 12 hari
  const labelInterval = React.useMemo(() => {
    if (totalDays <= 12) return 1;
    if (totalDays <= 24) return 2;
    return 3;
  }, [totalDays]);

  // Loading State
  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-[#5F7A84] space-y-3">
        <div className="w-10 h-10 border-4 border-[#234E5C]/20 border-t-[#234E5C] rounded-full animate-spin" />
        <span className="font-medium">Memuat grafik tren pemasukan harian...</span>
      </div>
    );
  }

  // Empty State: Hanya jika semua hari bernilai 0 atau tidak ada data
  const isEmpty = totalDays === 0 || totalPemasukan === 0;
  if (isEmpty) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-[#5F7A84] space-y-2">
        <div className="h-12 w-12 rounded-2xl bg-[#FAFAF8] border border-[#E8E8E1] flex items-center justify-center text-[#A0630F]">
          <Calendar className="h-6 w-6 opacity-60" />
        </div>
        <p className="font-semibold text-sm text-[#234E5C]">
          Belum ada transaksi pemasukan terverifikasi pada rentang waktu ini.
        </p>
        <p className="text-[11px] text-[#5F7A84]">
          Seluruh uang masuk dari DP, pelunasan, atau denda akan otomatis terpetakan di grafik ini.
        </p>
      </div>
    );
  }

  const slotWidth = PLOT_WIDTH / totalDays;
  const barWidth = Math.max(4, Math.min(26, slotWidth * 0.65));

  // Data titik aktif untuk tooltip
  const activeItem = activeIndex !== null && chartItems[activeIndex] ? chartItems[activeIndex] : null;

  return (
    <div className="space-y-3 select-none">
      {/* Container SVG Responsif */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width="100%"
          height="auto"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Grafik tren pemasukan harian periode ${dari} sampai ${sampai}. Total pemasukan: ${formatRupiah(totalPemasukan)}, nilai harian tertinggi: ${formatRupiah(maxOriginalAmount)}.`}
          className="overflow-visible"
          onMouseLeave={() => setActiveIndex(null)}
        >
          {/* Defs untuk shadow & styling */}
          <defs>
            <filter id="barShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.1" />
            </filter>
          </defs>

          {/* 1. Garis Bantu Horizontal Sumbu Y (Grid Lines) & Label Ticks */}
          {ticks.map((tickVal, i) => {
            const yPos = BASELINE_Y - (tickVal / maxAxis) * PLOT_HEIGHT;
            const isBase = i === 0;

            return (
              <g key={`y-grid-${tickVal}-${i}`}>
                {/* Garis Horizontal */}
                <line
                  x1={PADDING_LEFT}
                  y1={yPos}
                  x2={SVG_WIDTH - PADDING_RIGHT}
                  y2={yPos}
                  stroke={isBase ? "#CBD5E1" : "#E8E8E1"}
                  strokeWidth={isBase ? 1.5 : 1}
                  strokeDasharray={isBase ? undefined : "4 4"}
                />

                {/* Label Teks Sumbu Y */}
                <text
                  x={PADDING_LEFT - 10}
                  y={yPos + 3.5}
                  textAnchor="end"
                  fill="#5F7A84"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="inherit"
                >
                  {formatRupiahRingkas(tickVal)}
                </text>
              </g>
            );
          })}

          {/* 2. Gambar Batang Grafik & Label Sumbu X */}
          {chartItems.map((item, idx) => {
            const isHovered = activeIndex === idx;
            const xCenter = PADDING_LEFT + idx * slotWidth + slotWidth / 2;
            const barX = xCenter - barWidth / 2;

            const hasIncome = item.total > 0;
            const barHeight = hasIncome
              ? Math.max(4, (item.total / maxAxis) * PLOT_HEIGHT)
              : 2; // Garis dasar tipis jika nilai 0

            const barY = BASELINE_Y - barHeight;

            // Warna batang: Teal normal (#234E5C), aksen Cokelat Emas (#A0630F) saat hover/aktif
            const barFill = isHovered
              ? "#A0630F"
              : hasIncome
              ? "#234E5C"
              : "#CBD5E1";

            // Tanggal untuk sumbu X (format dd/MM)
            const parts = item.tanggal.split("-");
            const xLabel = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.tanggal;
            const isLast = idx === totalDays - 1;
            const showXLabel = idx % labelInterval === 0 || (isLast && (totalDays - 1) % labelInterval !== 0);

            return (
              <g key={`bar-group-${item.tanggal}`}>
                {/* Area Hit-Target Transparan (Memudahkan Hover & Tap di Layar Sentuh) */}
                <rect
                  x={PADDING_LEFT + idx * slotWidth}
                  y={PADDING_TOP}
                  width={slotWidth}
                  height={PLOT_HEIGHT + 10}
                  fill="transparent"
                  cursor="pointer"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onTouchStart={() => setActiveIndex(idx)}
                  onClick={() => setActiveIndex(idx)}
                />

                {/* Elemen Batang SVG */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx={hasIncome ? 3 : 1}
                  ry={hasIncome ? 3 : 1}
                  fill={barFill}
                  filter={hasIncome ? "url(#barShadow)" : undefined}
                  className="transition-colors duration-150"
                  style={{ pointerEvents: "none" }}
                />

                {/* Label Tanggal Sumbu X */}
                {showXLabel && (
                  <text
                    x={xCenter}
                    y={BASELINE_Y + 18}
                    textAnchor="middle"
                    fill={isHovered ? "#234E5C" : "#5F7A84"}
                    fontSize="10"
                    fontWeight={isHovered ? "700" : "500"}
                    fontFamily="inherit"
                  >
                    {xLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. Tooltip Interaktif SVG Saat Hover / Tap */}
          {activeItem && activeIndex !== null && (
            <g
              transform={`translate(${Math.max(
                110,
                Math.min(
                  SVG_WIDTH - 110,
                  PADDING_LEFT + activeIndex * slotWidth + slotWidth / 2
                )
              )}, ${Math.max(
                15,
                BASELINE_Y -
                  (activeItem.total > 0 ? (activeItem.total / maxAxis) * PLOT_HEIGHT : 2) -
                  45
              )})`}
              style={{ pointerEvents: "none" }}
            >
              {/* Balon Tooltip Box */}
              <rect
                x="-85"
                y="-5"
                width="170"
                height="40"
                rx="8"
                fill="#234E5C"
                filter="url(#barShadow)"
              />
              {/* Segitiga Panah Bawah */}
              <polygon points="-6,35 6,35 0,41" fill="#234E5C" />

              {/* Teks Tanggal Lengkap */}
              <text
                x="0"
                y="11"
                textAnchor="middle"
                fill="#E8E8E1"
                fontSize="9"
                fontWeight="500"
                fontFamily="inherit"
              >
                {formatTanggalIndoPenuh(activeItem.tanggal)}
              </text>

              {/* Teks Nominal Rupiah */}
              <text
                x="0"
                y="26"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="11"
                fontWeight="800"
                fontFamily="inherit"
              >
                {formatRupiah(activeItem.total)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Baris Keterangan Nilai Dasar & Maksimum */}
      <div className="flex justify-between items-center text-[11px] text-[#5F7A84] border-t border-[#E8E8E1] pt-2 px-1">
        <span className="font-semibold text-[#5F7A84]">Rp 0</span>
        <span className="font-semibold">
          Maks: <strong className="text-[#234E5C]">{formatRupiah(maxOriginalAmount)}</strong>
        </span>
      </div>
    </div>
  );
}
