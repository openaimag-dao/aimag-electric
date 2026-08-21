import type { Metadata } from "next";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminGlobalSearch } from "@/components/admin/admin-global-search";
import { NotificationBell } from "@/components/admin/notification-bell";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

/** Admin shell. Auth is gated at the edge for /admin/* — see src/middleware.ts. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-secondary/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <AdminMobileNav />
          <span className="hidden shrink-0 font-mono text-xs uppercase tracking-wider text-muted-foreground lg:inline">
            AIMAG ELECTRIC
          </span>
          <div className="max-w-md flex-1">
            <AdminGlobalSearch />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
