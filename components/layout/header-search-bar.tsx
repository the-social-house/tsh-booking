"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datepicker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateEndTimeSlots,
  generateTimeSlots,
} from "@/lib/booking-time-slots";
import {
  formatDateKey,
  getDisabledDatesBeforeToday,
} from "@/lib/format-date-time";
import messages from "@/lib/messages.json";
import { cn } from "@/lib/utils";

type HeaderSearchBarProps = Readonly<{
  className?: string;
  onSearch?: () => void;
}>;

export function HeaderSearchBar({ className, onSearch }: HeaderSearchBarProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [numberOfPeople, setNumberOfPeople] = useState<string>("");

  const startTimeSlots = useMemo(() => generateTimeSlots(), []);
  const allEndTimeSlots = useMemo(() => generateEndTimeSlots(), []);

  // Filter end time slots based on selected start time
  const endTimeSlots = useMemo(() => {
    if (!startTime) {
      return allEndTimeSlots;
    }

    // Parse start time to compare
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;

    // Filter to only show times after start time
    return allEndTimeSlots.filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const timeMinutes = hour * 60 + minute;
      return timeMinutes > startMinutes;
    });
  }, [startTime, allEndTimeSlots]);

  // Reset end time if it becomes invalid when start time changes
  useEffect(() => {
    if (startTime && endTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // If end time is before or equal to start time, reset it
      if (endMinutes <= startMinutes) {
        setEndTime("");
      }
    }
  }, [startTime, endTime]);

  // Check if all fields are filled and valid
  const isFormValid = useMemo(() => {
    if (!(date && startTime && endTime && numberOfPeople)) {
      return false;
    }

    // Validate that end time is after start time
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      return false;
    }

    // Validate that numberOfPeople is a positive number
    const peopleCount = Number.parseInt(numberOfPeople, 10);
    if (Number.isNaN(peopleCount) || peopleCount < 1) {
      return false;
    }

    return true;
  }, [date, startTime, endTime, numberOfPeople]);

  function handleSearch() {
    // All validation is done via isFormValid, but double-check here
    if (!(isFormValid && date)) {
      return;
    }

    // Build query parameters
    const params = new URLSearchParams();

    // Format date as YYYY-MM-DD in Danish timezone
    const dateStr = formatDateKey(date);
    params.set("date", dateStr);
    params.set("startTime", startTime);
    params.set("endTime", endTime);
    params.set("people", numberOfPeople);

    // Navigate to /rooms with query parameters
    router.push(`/rooms?${params.toString()}`);
    // Call onSearch callback if provided (e.g., to close mobile sheet)
    onSearch?.();
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 items-center gap-2 md:grid-cols-[repeat(5,auto)]",
        className
      )}
    >
      <DatePicker
        className="w-[140px] max-md:col-span-2 max-md:row-start-1 max-md:w-full"
        date={date}
        disabled={getDisabledDatesBeforeToday()}
        onDateChange={setDate}
        placeholder={messages.header.ui.search.datePlaceholder}
      />
      <Select onValueChange={setStartTime} value={startTime}>
        <SelectTrigger className="w-[120px] border-border max-md:col-start-1 max-md:row-start-2 max-md:w-full">
          <SelectValue
            placeholder={messages.header.ui.search.startTimePlaceholder}
          />
        </SelectTrigger>
        <SelectContent>
          {startTimeSlots.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={setEndTime} value={endTime}>
        <SelectTrigger className="w-[120px] border-border max-md:col-start-2 max-md:row-start-2 max-md:w-full">
          <SelectValue
            placeholder={messages.header.ui.search.endTimePlaceholder}
          />
        </SelectTrigger>
        <SelectContent>
          {endTimeSlots.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="w-[120px] max-md:col-span-2 max-md:row-start-3 max-md:w-full"
        min="1"
        onChange={(e) => setNumberOfPeople(e.target.value)}
        placeholder={messages.header.ui.search.numberOfPeoplePlaceholder}
        required
        type="number"
        value={numberOfPeople}
      />
      <Button
        className="max-md:col-span-2 max-md:row-start-4"
        disabled={!isFormValid}
        onClick={handleSearch}
        size="sm"
        type="button"
      >
        <Search className="mr-2 size-4" />
        {messages.header.ui.search.searchButton}
      </Button>
    </div>
  );
}
