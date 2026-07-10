"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { adminNav } from "@/config/admin-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/common/logo";

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Меню">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-72 bg-steel-950 p-0 text-white">
        <div className="flex h-16 items-center border-b border-steel-800 px-6">
          <Logo variant="light" />
        </div>
        <nav className="space-y-1 p-3">
          {adminNav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <SheetClose asChild key={item.href}>
                <Link
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
              </SheetClose>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
