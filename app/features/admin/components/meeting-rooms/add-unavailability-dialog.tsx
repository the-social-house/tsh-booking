"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { createRoomUnavailability } from "@/app/features/admin/actions/create-room-unavailability";
import type { CreateRoomUnavailabilityInput } from "@/app/features/admin/lib/meeting-room.schema";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type FormState,
  formatErrorForToast,
  parseFieldErrors,
} from "@/lib/form-errors";
import { formatDate, formatDateKey } from "@/lib/format-date-time";
import messages from "@/lib/messages.json";
import { hasData, hasError } from "@/lib/supabase-response";
import { cn } from "@/lib/utils";

type FieldErrors = {
  unavailable_start_date?: boolean;
  unavailable_end_date?: boolean;
  unavailability_reason?: boolean;
};

type UnavailabilityFormState = FormState<FieldErrors>;

type AddUnavailabilityDialogProps = {
  meetingRoomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

function ControlledDateRangePicker({
  dateRange,
  error,
  id,
  onDateRangeChange,
  placeholder,
}: {
  dateRange: DateRange | undefined;
  error?: boolean;
  id: string;
  onDateRangeChange: (range: DateRange | undefined) => void;
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  let displayText = placeholder;
  if (dateRange?.from) {
    if (dateRange.to) {
      displayText = `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    } else {
      displayText = formatDate(dateRange.from);
    }
  }

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-invalid={error}
          className={cn(
            "w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
            error
              ? "border-destructive bg-destructive/10 ring-destructive/20 dark:ring-destructive/40"
              : ""
          )}
          data-empty={!dateRange?.from}
          id={id}
          type="button"
          variant="outline"
        >
          <CalendarIcon className="mr-2 size-4" />
          {dateRange?.from ? (
            <span>{displayText}</span>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          className="rounded-lg border shadow-sm"
          defaultMonth={dateRange?.from}
          mode="range"
          onSelect={onDateRangeChange}
          selected={dateRange}
        />
      </PopoverContent>
    </Popover>
  );
}

export function AddUnavailabilityDialog({
  meetingRoomId,
  onOpenChange,
  onSuccess,
  open,
}: AddUnavailabilityDialogProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Reset dates when dialog opens
  useEffect(() => {
    if (open) {
      setDateRange(undefined);
    }
  }, [open]);

  async function formAction(
    _previousState: UnavailabilityFormState | null,
    formData: FormData
  ): Promise<UnavailabilityFormState> {
    // Format dates as YYYY-MM-DD strings using Danish timezone
    const startDateStr = dateRange?.from
      ? formatDateKey(dateRange.from)
      : undefined;
    // If no end date is selected, use start date as end date (single day)
    let endDateStr: string | undefined;
    if (dateRange?.to) {
      endDateStr = formatDateKey(dateRange.to);
    } else if (dateRange?.from) {
      endDateStr = formatDateKey(dateRange.from);
    }

    const data: CreateRoomUnavailabilityInput = {
      unavailable_start_date: startDateStr || "",
      unavailable_end_date: endDateStr || "",
      unavailability_reason: (formData.get("reason") as string) || null,
    };

    const result = await createRoomUnavailability(meetingRoomId, data);

    if (hasError(result)) {
      toast.error(formatErrorForToast(result.error));
      return {
        error: result.error.message,
        fieldErrors: parseFieldErrors<FieldErrors>(result.error.details),
        success: false,
      };
    }

    if (hasData(result)) {
      toast.success(
        messages.admin.meetingRooms.messages.success.unavailabilityCreate
      );
      router.refresh();
      onSuccess();
      return {
        error: null,
        success: true,
      };
    }

    return {
      error:
        messages.admin.meetingRooms.messages.error.unavailabilityCreate.unknown,
      success: false,
    };
  }

  const [state, formActionHandler, isPending] = useActionState(
    formAction,
    null
  );

  // Reset form on success
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setDateRange(undefined);
    }
  }, [state?.success]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {messages.admin.meetingRooms.ui.availability.dialogTitle}
          </DialogTitle>
          <DialogDescription>
            {messages.admin.meetingRooms.ui.availability.dialogDescription}
          </DialogDescription>
        </DialogHeader>
        <form action={formActionHandler} className="space-y-4" ref={formRef}>
          <Field>
            <FieldLabel htmlFor="date-range">
              {messages.admin.meetingRooms.ui.availability.dateRangeLabel}
            </FieldLabel>
            <ControlledDateRangePicker
              dateRange={dateRange}
              error={
                state?.fieldErrors?.unavailable_start_date ||
                state?.fieldErrors?.unavailable_end_date
              }
              id="date-range"
              onDateRangeChange={setDateRange}
              placeholder={
                messages.admin.meetingRooms.ui.availability.dateRangePlaceholder
              }
            />
            <FieldDescription>
              {messages.admin.meetingRooms.ui.availability.dateRangeHelper}
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="reason">
              {messages.admin.meetingRooms.ui.availability.reasonLabel}
            </FieldLabel>
            <Input
              disabled={isPending}
              error={state?.fieldErrors?.unavailability_reason}
              id="reason"
              name="reason"
              placeholder={
                messages.admin.meetingRooms.ui.availability.reasonPlaceholder
              }
              type="text"
            />
          </Field>
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              {messages.common.buttons.cancel}
            </Button>
            <Button
              disabled={isPending}
              loading={isPending}
              loadingText={
                messages.admin.meetingRooms.ui.availability.submitButtonLoading
              }
              type="submit"
            >
              {messages.admin.meetingRooms.ui.availability.submitButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
