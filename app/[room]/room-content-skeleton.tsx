import { Skeleton } from "@/components/ui/skeleton";

export function RoomContentSkeleton() {
  return (
    <div className="w-full overflow-x-hidden pt-8 pb-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left column skeleton */}
          <div className="col-span-1 space-y-4 md:col-span-5">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          {/* Right column skeleton */}
          <div className="col-span-1 space-y-4 md:col-span-7">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="aspect-video w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
