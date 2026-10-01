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

  const disabledSet = React.useMemo(() => {
    return new Set(disabledDates);
  }, [disabledDates]);

  const selectedStart = startDate ? parseISO(startDate) : null;
  const selectedEnd = endDate ? parseISO(endDate) : null;

  const handleDateClick = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");

    if (isBefore(day, today) || disabledSet.has(formatted)) {
      return;
    }

    if (!selectedStart || (selectedStart && selectedEnd)) {
      onChange(formatted, formatted);
    } else {
      if (isBefore(day, selectedStart)) {
        onChange(formatted, formatted);
      } else {
        let hasDisabledInRange = false;
        const daysInRange = eachDayOfInterval({ start: selectedStart, end: day });
        for (const d of daysInRange) {
          if (disabledSet.has(format(d, "yyyy-MM-dd"))) {
            hasDisabledInRange = true;
            break;
          }
        }

        if (hasDisabledInRange) {
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

    const daysInRange = eachDayOfInterval({ start, end });
    const hasDisabled = daysInRange.some((d) =>
      disabledSet.has(format(d, "yyyy-MM-dd"))
    );

    if (!hasDisabled) {
      onChange(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
    }
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
        "rounded-xl border border-[#E8E8E1] bg-white p-5 shadow-sm space-y-4 text-[#234E5C]",
        className
      )}
    >
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
            disabled={isBefore(currentMonth, today)}
            className="h-8 w-8 rounded-full"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8 rounded-full"
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
                "h-8 w-full rounded-lg text-xs font-semibold transition-all relative flex flex-col items-center justify-center select-none cursor-pointer",
                !isCurrentMonth && "opacity-25",
                isDisabled &&
                  "opacity-30 cursor-not-allowed line-through text-[#5F7A84] hover:bg-transparent",
                disabledSet.has(formatted) &&
                  "bg-[#FEE2E2] text-[#991B1B] line-through font-normal",
                !isDisabled && "hover:bg-[#F3F3EF] text-[#234E5C]",
                isInRange && "bg-[#E6FFFA] text-[#234E5C] rounded-none",
                isStart &&
                  "bg-[#234E5C] text-white font-bold rounded-l-lg",
                isEnd &&
                  "bg-[#234E5C] text-white font-bold rounded-r-lg",
                isStart && isEnd && "rounded-lg"
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

      {/* Durasi Cepat */}
      <div className="pt-2 border-t border-[#E8E8E1]">
        <div className="flex items-center justify-between text-xs text-[#5F7A84] mb-2">
          <span className="font-semibold text-[#234E5C]">
            Pilihan Durasi Cepat:
          </span>
          {startDate && endDate && (
            <span className="text-[#A0630F] font-bold">
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
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-[#E8E8E1] bg-[#FAFAF8] hover:bg-[#234E5C] hover:text-white transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
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
