"use client";

import * as React from "react";
import {
  format,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
  startOfToday,
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RentalDatePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  disabledDates?: string[]; // array YYYY-MM-DD dari tanggal_penuh
  className?: string;
}

export function RentalDatePicker({
  startDate,
  endDate,
  onChange,
  disabledDates = [],
  className,
}: RentalDatePickerProps) {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    startDate ? parseISO(startDate) : today
  );

  // Set disabled dates lookup
  const disabledSet = React.useMemo(() => {
    return new Set(disabledDates);
  }, [disabledDates]);

  const selectedStart = startDate ? parseISO(startDate) : null;
  const selectedEnd = endDate ? parseISO(endDate) : null;

  const handleDateClick = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");

    // Jika tanggal disabled (stok habis) atau masa lalu, abaikan
    if (isBefore(day, today) || disabledSet.has(formatted)) {
      return;
    }

    if (!selectedStart || (selectedStart && selectedEnd)) {
      // Mulai pilihan baru
      onChange(formatted, formatted);
    } else {
      // Pilihan kedua (end date)
      if (isBefore(day, selectedStart)) {
        onChange(formatted, formatted);
      } else {
        // Cek apakah ada tanggal disabled di antara start dan end
        let hasDisabledInRange = false;
        const daysInRange = eachDayOfInterval({ start: selectedStart, end: day });
        for (const d of daysInRange) {
          if (disabledSet.has(format(d, "yyyy-MM-dd"))) {
            hasDisabledInRange = true;
            break;
          }
        }

        if (hasDisabledInRange) {
          // Jika ada tanggal penuh di tengah, jadikan ini tanggal mulai baru
          onChange(formatted, formatted);
        } else {
          onChange(format(selectedStart, "yyyy-MM-dd"), formatted);
        }
      }
    }
  };

  const handleQuickDuration = (days: number) => {
    const start = selectedStart || today;
    const end = addDays(start, days - 1);

    // Pastikan tidak ada tanggal penuh
    const daysInRange = eachDayOfInterval({ start, end });
    const hasDisabled = daysInRange.some((d) =>
      disabledSet.has(format(d, "yyyy-MM-dd"))
    );

    if (!hasDisabled) {
      onChange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
    }
  };

  // Generate hari dalam bulan
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
        "rounded-3xl border border-border bg-card p-5 shadow-sm space-y-4",
        className
      )}
    >
      {/* Header Bulan & Navigasi */}
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-bold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: id })}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            disabled={isBefore(currentMonth, today)}
            className="h-8 w-8 rounded-xl"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8 rounded-xl"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grid Kalender */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDayNames.map((name) => (
          <div
            key={name}
            className="text-[11px] font-bold text-muted-foreground py-1"
          >
            {name}
          </div>
        ))}

        {calendarDays.map((day) => {
          const formatted = format(day, "yyyy-MM-dd");
          const isPast = isBefore(day, today);
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isDisabled = isPast || disabledSet.has(formatted);
          const isStart = selectedStart && isSameDay(day, selectedStart);
          const isEnd = selectedEnd && isSameDay(day, selectedEnd);
          const isInRange =
            selectedStart &&
            selectedEnd &&
            isAfter(day, selectedStart) &&
            isBefore(day, selectedEnd);

          return (
            <button
              key={formatted}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-9 w-full rounded-xl text-xs font-semibold transition-all relative flex flex-col items-center justify-center select-none cursor-pointer",
                !isCurrentMonth && "opacity-30",
                isDisabled &&
                  "opacity-35 cursor-not-allowed line-through text-muted-foreground hover:bg-transparent",
                disabledSet.has(formatted) &&
                  "bg-rose-500/10 text-rose-500 line-through font-normal",
                !isDisabled && "hover:bg-muted/80 text-foreground",
                isInRange && "bg-primary/15 text-primary rounded-none",
                isStart &&
                  "bg-primary text-primary-foreground font-bold shadow-sm rounded-l-xl",
                isEnd &&
                  "bg-primary text-primary-foreground font-bold shadow-sm rounded-r-xl",
                isStart && isEnd && "rounded-xl"
              )}
            >
              <span>{format(day, "d")}</span>
              {disabledSet.has(formatted) && (
                <span className="text-[8px] leading-none text-rose-500 font-normal">
                  Penuh
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Durasi Cepat */}
      <div className="pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-accent-warm" />
            Pilihan Durasi Cepat:
          </span>
          {startDate && endDate && (
            <span className="text-primary font-bold">
              {startDate === endDate ? "1 Hari Sewa" : `${startDate} s.d ${endDate}`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "1 Hari", days: 1 },
            { label: "3 Hari (Weekend)", days: 3 },
            { label: "7 Hari (Mingguan)", days: 7 },
            { label: "14 Hari (2 Minggu)", days: 14 },
          ].map((item) => (
            <button
              key={item.days}
              type="button"
              onClick={() => handleQuickDuration(item.days)}
              className="px-2.5 py-1 text-xs font-medium rounded-xl border border-border bg-muted/40 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keterangan Indikator */}
      <div className="flex items-center gap-4 pt-1 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span>Dipilih</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500/30 border border-rose-500/50" />
          <span>Stok Habis</span>
        </div>
      </div>
    </div>
  );
}
