import { Skeleton } from "@/components/ui/skeleton";

/** Loading fallback matching the catalog layout while search params resolve. */
export function CatalogSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <Skeleton className="h-[560px] w-full rounded-xl" />
      </div>
      <div className="min-w-0">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-[340px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
