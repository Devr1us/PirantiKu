"use client";

import * as React from "react";
import {
  format,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import { id } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTodayWIB, formatDateIndo } from "@/lib/format";
import { calculateRentalDays } from "@/lib/pricing";
import { toast } from "sonner";

interface RentalDatePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  disabledDates?: string[]; // array YYYY-MM-DD dari tanggal_penuh
  className?: string;
  activeStep?: "start" | "end";
  onStepChange?: (step: "start" | "end") => void;
}

export function RentalDatePicker({
  startDate,
  endDate,
  onChange,
  disabledDates = [],
  className,
  activeStep,
  onStepChange,
}: RentalDatePickerProps) {
  const today = React.useMemo(() => parseISO(getTodayWIB()), []);
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startDate ? parseISO(startDate) : today
  );

  const [internalStep, setInternalStep] = React.useState<"start" | "end">(
    activeStep || "start"
  );
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (activeStep) {
      setInternalStep(activeStep);
    }
  }, [activeStep]);

  const step = activeStep !== undefined ? activeStep : internalStep;

  const setStep = (newStep: "start" | "end") => {
    setInternalStep(newStep);
    onStepChange?.(newStep);
  };

  const disabledSet = React.useMemo(() => {
    return new Set(disabledDates);
  }, [disabledDates]);

  const selectedStart = React.useMemo(
    () => (startDate ? parseISO(startDate) : null),
    [startDate]
  );
  const selectedEnd = React.useMemo(
    () => (endDate ? parseISO(endDate) : null),
    [endDate]
  );

  const currentDuration = React.useMemo(() => {
    if (!startDate || !endDate) return 1;
    return calculateRentalDays(startDate, endDate);
  }, [startDate, endDate]);

  const handleDateClick = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");

    if (isBefore(day, today) || disabledSet.has(formatted)) {
      return;
    }

    if (step === "start") {
      let newEnd = formatted;

      // Jika sebelumnya sudah ada tanggal selesai dan posisinya di hari ini atau setelahnya
      if (selectedEnd && !isBefore(selectedEnd, day)) {
        const daysInRange = eachDayOfInterval({ start: day, end: selectedEnd });
        const hasDisabled = daysInRange.some((d) =>
          disabledSet.has(format(d, "yyyy-MM-dd"))
        );
        if (!hasDisabled) {
          newEnd = format(selectedEnd, "yyyy-MM-dd");
        }
      }

      onChange(formatted, newEnd);
      // Pindahkan fokus otomatis ke pemilihan tanggal selesai
      setStep("end");
    } else {
      // step === "end"
      if (!selectedStart || isBefore(day, selectedStart)) {
        // User klik tanggal yang lebih awal dari tanggal mulai: jadikan ini mulai baru
        onChange(formatted, formatted);
        setStep("end");
      } else {
        const daysInRange = eachDayOfInterval({ start: selectedStart, end: day });
        const hasDisabled = daysInRange.some((d) =>
          disabledSet.has(format(d, "yyyy-MM-dd"))
        );

        if (hasDisabled) {
          toast.error(
            "Terdapat tanggal dengan ketersediaan penuh di dalam rentang yang Anda pilih."
          );
          return;
        }

        onChange(format(selectedStart, "yyyy-MM-dd"), formatted);
        // Selesai memilih rentang, kembali ke mode start untuk klik selanjutnya
        setStep("start");
      }
    }
  };

  const handleQuickDuration = (days: number) => {
    const start = selectedStart || today;
    const end = addDays(start, Math.max(0, days - 1));

    const daysInRange = eachDayOfInterval({ start, end });
    const hasDisabled = daysInRange.some((d) =>
      disabledSet.has(format(d, "yyyy-MM-dd"))
    );

    if (hasDisabled) {
      toast.error(
        `Tidak dapat memilih durasi ${days} hari karena ada tanggal dengan stok penuh di rentang tersebut.`
      );
      return;
    }

    onChange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
    setStep("start");
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div
      className={cn(
        "rounded-xl border border-[#E8E8E1] bg-white p-4 sm:p-5 shadow-sm space-y-4 text-[#234E5C]",
        className
      )}
    >
      {/* Tab Pemilihan: Mulai Booking vs Selesai Booking */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAFAF8] rounded-xl border border-[#E8E8E1]">
        <button
          type="button"
          onClick={() => setStep("start")}
          className={cn(
            "flex flex-col text-left p-2.5 rounded-lg transition-all border cursor-pointer",
            step === "start"
              ? "bg-[#234E5C] text-white border-[#234E5C] shadow-xs"
              : "border-transparent bg-transparent text-[#234E5C] hover:bg-white"
          )}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                step === "start"
                  ? "bg-[#F59E0B] ring-2 ring-[#F59E0B]/30"
                  : "bg-[#5F7A84]"
              )}
            />
            <span
              className={cn(
                "text-[10px] uppercase font-bold",
                step === "start" ? "text-[#FCD34D]" : "text-[#5F7A84]"
              )}
            >
              1. Mulai Booking
            </span>
          </div>
          <span className="text-xs font-bold mt-0.5 truncate">
            {startDate
              ? formatDateIndo(startDate, "d MMM yyyy")
              : "Pilih Tanggal"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStep("end")}
          className={cn(
            "flex flex-col text-left p-2.5 rounded-lg transition-all border cursor-pointer",
            step === "end"
              ? "bg-[#234E5C] text-white border-[#234E5C] shadow-xs"
              : "border-transparent bg-transparent text-[#234E5C] hover:bg-white"
          )}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                step === "end"
                  ? "bg-[#F59E0B] ring-2 ring-[#F59E0B]/30"
                  : "bg-[#5F7A84]"
              )}
            />
            <span
              className={cn(
                "text-[10px] uppercase font-bold",
                step === "end" ? "text-[#FCD34D]" : "text-[#5F7A84]"
              )}
            >
              2. Selesai Booking
            </span>
          </div>
          <span className="text-xs font-bold mt-0.5 truncate">
            {endDate ? formatDateIndo(endDate, "d MMM yyyy") : "Pilih Tanggal"}
          </span>
        </button>
      </div>

      {/* Helper Prompt Berdasarkan Mode Aktif */}
      <div className="text-[11px] px-3 py-1.5 rounded-lg bg-[#F0FDF4] border border-[#DCFCE7] text-[#166534] flex items-center justify-between">
        <span className="font-medium">
          {step === "start"
            ? "👉 Klik tanggal mulai booking di kalender"
            : "👉 Klik tanggal selesai booking di kalender (bebas custom durasi)"}
        </span>
        <span className="font-bold text-[#A0630F]">
          {currentDuration} Hari Booking
        </span>
      </div>

      {/* Header Bulan & Navigasi */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E8E8E1]">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[#234E5C]" />
          <h4 className="text-sm font-bold text-[#234E5C] capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            disabled={isBefore(startOfMonth(currentMonth), startOfMonth(today))}
            className="h-8 w-8 rounded-full cursor-pointer"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8 rounded-full cursor-pointer"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Kalender */}
      <div
        className="grid grid-cols-7 gap-1 text-center"
        onMouseLeave={() => setHoverDate(null)}
      >
        {weekDayNames.map((name) => (
          <div
            key={name}
            className="text-[11px] font-bold text-[#5F7A84] py-1"
          >
            {name}
          </div>
        ))}

        {calendarDays.map((day) => {
          const formatted = format(day, "yyyy-MM-dd");
          const isPast = isBefore(day, today);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isDisabled = isPast || disabledSet.has(formatted);
          const isStart = Boolean(selectedStart && isSameDay(day, selectedStart));
          const isEnd = Boolean(selectedEnd && isSameDay(day, selectedEnd));
          const isInRange = Boolean(
            selectedStart &&
              selectedEnd &&
              isAfter(day, selectedStart) &&
              isBefore(day, selectedEnd)
          );
          const isHoverPreview = Boolean(
            step === "end" &&
              selectedStart &&
              hoverDate &&
              isAfter(hoverDate, selectedStart) &&
              isAfter(day, selectedStart) &&
              !isAfter(day, hoverDate) &&
              !isDisabled
          );

          return (
            <button
              key={formatted}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => setHoverDate(day)}
              className={cn(
                "h-8 w-full text-xs font-semibold transition-all relative flex flex-col items-center justify-center select-none cursor-pointer",
                !isCurrentMonth && "opacity-25",
                isDisabled &&
                  "opacity-30 cursor-not-allowed line-through text-[#5F7A84] hover:bg-transparent",
                disabledSet.has(formatted) &&
                  "bg-[#FEE2E2] text-[#991B1B] line-through font-normal",
                !isDisabled && "hover:bg-[#F3F3EF] text-[#234E5C]",
                isHoverPreview && "bg-[#E6FFFA]/70 text-[#234E5C] rounded-none",
                isInRange && "bg-[#E6FFFA] text-[#234E5C] rounded-none",
                isStart && !isEnd && "bg-[#234E5C] text-white font-bold rounded-l-lg",
                isEnd && !isStart && "bg-[#234E5C] text-white font-bold rounded-r-lg",
                isStart && isEnd && "bg-[#234E5C] text-white font-bold rounded-lg"
              )}
            >
              <span>{format(day, "d")}</span>
              {disabledSet.has(formatted) && (
                <span className="text-[7px] leading-none text-[#991B1B] font-normal">
                  Penuh
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Durasi Cepat & Durasi Custom */}
      <div className="pt-2 border-t border-[#E8E8E1]">
        <div className="flex items-center justify-between text-xs text-[#5F7A84] mb-2">
          <span className="font-semibold text-[#234E5C]">
            Pilihan Durasi Cepat:
          </span>
          <span className="text-[#A0630F] font-bold">
            {currentDuration <= 1
              ? "1 Hari Booking"
              : `${currentDuration} Hari Booking`}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "1 Hari", days: 1 },
            { label: "3 Hari", days: 3 },
            { label: "7 Hari", days: 7 },
            { label: "14 Hari", days: 14 },
          ].map((item) => {
            const isActive = currentDuration === item.days;
            return (
              <button
                key={item.days}
                type="button"
                onClick={() => handleQuickDuration(item.days)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                  isActive
                    ? "bg-[#234E5C] text-white border-[#234E5C] shadow-xs"
                    : "border-[#E8E8E1] bg-[#FAFAF8] text-[#234E5C] hover:bg-[#234E5C] hover:text-white"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Durasi Custom Bebas */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-[#E8E8E1]/60 text-xs">
          <span className="text-[#5F7A84] font-medium">
            Atau atur durasi bebas (hari):
          </span>
          <div className="flex items-center border border-[#E8E8E1] rounded-lg bg-[#FAFAF8] p-0.5 shadow-2xs">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md hover:bg-white text-[#234E5C] cursor-pointer"
              onClick={() =>
                handleQuickDuration(Math.max(1, currentDuration - 1))
              }
              disabled={currentDuration <= 1}
              aria-label="Kurangi durasi 1 hari"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="px-2.5 text-xs font-bold text-[#234E5C] min-w-[55px] text-center select-none">
              {currentDuration} Hari
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md hover:bg-white text-[#234E5C] cursor-pointer"
              onClick={() => handleQuickDuration(currentDuration + 1)}
              aria-label="Tambah durasi 1 hari"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Keterangan Indikator */}
      <div className="flex items-center gap-4 pt-1 text-[11px] text-[#5F7A84]">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#234E5C]" />
          <span>Dipilih</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FEE2E2] border border-[#FECACA]" />
          <span>Stok Penuh</span>
        </div>
      </div>
    </div>
  );
}
