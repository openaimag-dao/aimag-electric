import type { SpecGroup } from "@/types/product-detail";

/** Technical specifications rendered as grouped definition rows. */
export function SpecTable({ groups }: { groups: SpecGroup[] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="font-display text-base font-semibold text-primary">{group.title}</h3>
          <dl className="mt-3 overflow-hidden rounded-xl border border-border">
            {group.rows.map((row, i) => (
              <div
                key={row.label}
                className={`flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${
                  i % 2 === 0 ? "bg-card" : "bg-secondary/40"
                }`}
              >
                <dt className="w-full text-sm text-muted-foreground sm:w-1/2">{row.label}</dt>
                <dd className="w-full text-sm font-medium text-primary sm:w-1/2">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
