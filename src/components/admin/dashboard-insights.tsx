import Link from "next/link";
import {
  ImageOff,
  FileWarning,
  FileX,
  PackageX,
  Activity,
  Upload,
  Tag,
  ListChecks,
} from "lucide-react";

import { adminService } from "@/server/services/admin-service";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const actionLabels: Record<string, string> = {
  CREATE: "Создание",
  UPDATE: "Изменение",
  DELETE: "Удаление",
  IMPORT: "Импорт",
  EXPORT: "Экспорт",
  LOGIN: "Вход",
  LOGOUT: "Выход",
};

/** Server component: data-quality + operations widgets for the dashboard. */
export async function DashboardInsights() {
  const { quality, lowStock, recentAudit, recentImports } = await adminService.dashboardInsights();

  return (
    <div className="space-y-6">
      {/* Data quality */}
      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-primary">Качество каталога</h2>
          <span className="text-sm text-muted-foreground">
            Catalog Health:{" "}
            <span
              className={cn(
                "font-display text-base font-bold",
                quality.healthScore >= 80
                  ? "text-emerald-600"
                  : quality.healthScore >= 50
                    ? "text-amber-600"
                    : "text-red-600"
              )}
            >
              {quality.healthScore}%
            </span>
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <QualityCard
            icon={ImageOff}
            label="Без фото"
            value={quality.noImages}
            href="/admin/products?quality=no-image"
          />
          <QualityCard
            icon={Tag}
            label="Без цены"
            value={quality.noPrice}
            href="/admin/products?quality=no-price"
          />
          <QualityCard
            icon={ListChecks}
            label="Без характеристик"
            value={quality.noSpecs}
            href="/admin/products?quality=no-specs"
          />
          <QualityCard
            icon={FileWarning}
            label="Без описания (SEO)"
            value={quality.noDescription}
            href="/admin/products?quality=no-description"
          />
          <QualityCard
            icon={FileX}
            label="Без документов"
            value={quality.noDocuments}
            href="/admin/products?quality=no-documents"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low stock */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <PackageX className="size-4 text-amber-600" />
            <h3 className="font-display font-semibold text-primary">Заканчивающиеся остатки</h3>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Все позиции в достатке.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((s, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-primary">{s.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{s.warehouse}</span>
                    <span
                      className={`font-mono font-semibold ${s.quantity <= 0 ? "text-red-600" : "text-amber-600"}`}
                    >
                      {s.quantity}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity (audit) */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="size-4 text-signal-700" />
            <h3 className="font-display font-semibold text-primary">Последние действия</h3>
          </div>
          {recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Журнал пуст.</p>
          ) : (
            <ul className="space-y-2">
              {recentAudit.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {actionLabels[a.action] ?? a.action}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-primary">{a.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.actor ?? "система"} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent imports */}
      {recentImports.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Upload className="size-4 text-signal-700" />
            <h3 className="font-display font-semibold text-primary">Последние импорты</h3>
          </div>
          <ul className="divide-y divide-border">
            {recentImports.map((imp) => (
              <li key={imp.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-primary">{imp.summary}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(imp.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function QualityCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof ImageOff;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-signal/50"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div
        className={`mt-2 font-display text-2xl font-bold ${value > 0 ? "text-amber-600" : "text-emerald-600"}`}
      >
        {value}
      </div>
    </Link>
  );
}
