import { Skeleton } from "@/components/ui/skeleton";

/** Generic route-loading fallback: a title bar plus a few content blocks. */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="container py-8">
      <Skeleton className="h-8 w-56" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
