"use client";

import { CheckIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { AdminAmenity } from "@/app/features/admin/actions/get-amenities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import messages from "@/lib/messages.json";
import { cn } from "@/lib/utils";

type AmenitySelectorProps = {
  amenities: AdminAmenity[];
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  disabled?: boolean;
};

export function AmenitySelector({
  amenities,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: AmenitySelectorProps) {
  const toggleAmenity = useCallback(
    (amenityId: number) => {
      if (disabled) {
        return;
      }

      const newSelection = selectedIds.includes(amenityId)
        ? selectedIds.filter((id) => id !== amenityId)
        : [...selectedIds, amenityId];

      onSelectionChange(newSelection);
    },
    [selectedIds, onSelectionChange, disabled]
  );

  const allAmenityIds = useMemo(
    () => amenities.map((amenity) => amenity.amenity_id),
    [amenities]
  );

  const allSelected = useMemo(
    () =>
      amenities.length > 0 &&
      allAmenityIds.every((id: number) => selectedIds.includes(id)),
    [amenities.length, allAmenityIds, selectedIds]
  );

  const handleSelectAll = useCallback(() => {
    if (disabled) {
      return;
    }

    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(allAmenityIds);
    }
  }, [allSelected, allAmenityIds, onSelectionChange, disabled]);

  if (amenities.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {messages.admin.meetingRooms.ui.update.amenitiesEmpty}{" "}
        {messages.admin.meetingRooms.ui.create.amenitiesHelper}
      </p>
    );
  }

  return (
    <div className="relative">
      <Button
        className="-top-8.5 absolute right-0 h-auto px-2 py-1 text-xs"
        disabled={disabled}
        onClick={handleSelectAll}
        size="sm"
        type="button"
        variant="ghost"
      >
        {allSelected
          ? messages.common.ui.deselectAll
          : messages.common.ui.selectAll}
      </Button>
      <div className="flex flex-wrap gap-2">
        {amenities.map((amenity) => {
          const isSelected = selectedIds.includes(amenity.amenity_id);

          return (
            <Badge
              asChild
              className={cn(
                "cursor-pointer transition-all",
                disabled ? "cursor-not-allowed opacity-50" : ""
              )}
              key={amenity.amenity_id}
              variant={isSelected ? "default" : "outline"}
            >
              <button
                disabled={disabled}
                onClick={() => toggleAmenity(amenity.amenity_id)}
                type="button"
              >
                {isSelected ? <CheckIcon /> : null}
                {amenity.amenity_name}
                {amenity.amenity_price ? (
                  <span
                    className={`text-muted-foreground ${isSelected ? "text-primary-foreground" : ""}`}
                  >
                    ({amenity.amenity_price} {messages.common.units.dkk})
                  </span>
                ) : null}
              </button>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
