import { Card, CardContent } from "@/components/ui/card";

export function RoomsContentSkeleton() {
  return (
    <div className="container mx-auto">
      <div className="mb-8 h-10 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => `skeleton-${i}`).map((key) => (
          <Card key={key}>
            <CardContent className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                <div className="h-full w-full animate-pulse rounded bg-muted" />
              </div>
              <div className="space-y-4">
                <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
