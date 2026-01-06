"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDate } from "@/lib/format-date-time";
import messages from "@/lib/messages.json";

type DatePickerProps = {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  disabled?: ComponentProps<typeof Calendar>["disabled"];
};

export function DatePicker({
  date: controlledDate,
  onDateChange,
  className,
  placeholder,
  disabled,
}: DatePickerProps = {}) {
  const [uncontrolledDate, setUncontrolledDate] = useState<Date | undefined>();

  // Use controlled date if provided, otherwise use internal state
  const date = controlledDate !== undefined ? controlledDate : uncontrolledDate;
  const handleDateChange = (newDate: Date | undefined) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setUncontrolledDate(newDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={`w-[280px] justify-start text-left font-normal data-[empty=true]:text-muted-foreground ${className || ""}`}
          data-empty={!date}
          variant="outline"
        >
          <CalendarIcon />
          {date ? (
            formatDate(date)
          ) : (
            <span>{placeholder || messages.common.messages.pickADate}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          disabled={disabled}
          mode="single"
          onSelect={handleDateChange}
          selected={date}
        />
      </PopoverContent>
    </Popover>
  );
}
