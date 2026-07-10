"use client";

import {
  Package,
  FolderTree,
  Factory,
  Tag,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import type { ImportKind } from "@/types/import";

const CARDS: {
  kind: ImportKind;
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    kind: "products",
    title: "Товары",
    description: "Создание и обновление товаров с ценой, остатком и фото по URL.",
    icon: Package,
  },
  {
    kind: "categories",
    title: "Категории",
    description: "Разделы каталога: slug, название, описание, иконка.",
    icon: FolderTree,
  },
  {
    kind: "brands",
    title: "Производители",
    description: "Бренды: slug, название, происхождение.",
    icon: Factory,
  },
  {
    kind: "prices",
    title: "Цены",
    description: "Массовое обновление цен по артикулу: base / опт / акция.",
    icon: Tag,
  },
  {
    kind: "stock",
    title: "Остатки",
    description: "Обновление количества на складах по артикулу.",
    icon: Warehouse,
  },
];

export function ImportKindPicker({ onPick }: { onPick: (k: ImportKind) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.kind}
            onClick={() => onPick(c.kind)}
            className="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-md"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-steel-950 text-signal transition-colors group-hover:bg-signal group-hover:text-steel-950">
              <Icon className="size-6" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-primary">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
