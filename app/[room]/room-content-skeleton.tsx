import { TwoColumnSkeleton } from "@/components/ui/two-column-skeleton";

export function RoomContentSkeleton() {
  return (
    <TwoColumnSkeleton leftClassName="md:sticky md:top-[calc(var(--header-height)+calc(var(--spacing)*4))] md:self-start" />
  );
}
