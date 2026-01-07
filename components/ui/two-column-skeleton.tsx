import { TwoColumnLayout } from "@/components/layout/two-column-layout";
import { Skeleton } from "@/components/ui/skeleton";

type TwoColumnSkeletonProps = {
  leftClassName?: string;
  rightContent?: React.ReactNode;
};

export function TwoColumnSkeleton({
  leftClassName,
  rightContent,
}: TwoColumnSkeletonProps = {}) {
  const defaultRightContent = (
    <div className="pb-20">
      <Skeleton className="aspect-video w-full rounded-lg" />
    </div>
  );

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
      leftClassName={leftClassName}
      right={rightContent ?? defaultRightContent}
      variant="left-narrow"
    />
  );
}
