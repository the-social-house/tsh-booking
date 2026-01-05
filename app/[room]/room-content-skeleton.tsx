import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import { Skeleton } from "@/components/ui/skeleton";

export function RoomContentSkeleton() {
  return (
    <TwoColumnLayout
      left={
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      }
      leftClassName="md:sticky md:top-[calc(var(--header-height)+calc(var(--spacing)*4))] md:self-start"
      right={
        <div className="space-y-4 pb-20">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <Skeleton className="aspect-video w-full rounded-lg" />
        </div>
      }
      variant="left-narrow"
    />
  );
}
