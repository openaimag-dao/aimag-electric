"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { adminNav } from "@/config/admin-nav";
import { Logo } from "@/components/common/logo";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-steel-800 bg-steel-950 lg:flex">
      <div className="flex h-16 items-center border-b border-steel-800 px-6">
        <Logo variant="light" />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {adminNav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-signal text-steel-950"
                  : "text-steel-300 hover:bg-steel-900 hover:text-white"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-steel-800 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-steel-400 transition-colors hover:bg-steel-900 hover:text-white"
        >
          ← На сайт
        </Link>
      </div>
    </aside>
  );
}
