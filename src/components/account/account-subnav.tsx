"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { label: "Обзор", href: "/account", icon: LayoutDashboard, exact: true },
  { label: "Проекты", href: "/account/projects", icon: Briefcase, exact: false },
];

export function AccountSubnav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 border-b border-border">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-signal text-primary"
                : "border-transparent text-muted-foreground hover:text-primary"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
