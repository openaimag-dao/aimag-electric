"use client";

import Link from "next/link";
import { Scale } from "lucide-react";

import { useCompare } from "@/components/compare/compare-provider";

export function CompareBadge() {
  const { count } = useCompare();
  if (count === 0) return null;

  return (
    <Link
      href="/compare"
      aria-label={`Сравнение: ${count} товаров`}
      className="relative inline-flex size-9 items-center justify-center rounded-md text-steel-600 transition-colors hover:bg-secondary hover:text-primary"
    >
      <Scale className="size-5" />
      <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-steel-950">
        {count}
      </span>
    </Link>
  );
}
