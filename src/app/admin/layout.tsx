import type { Metadata } from "next";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

/**
 * Admin shell. In production, gate this with auth middleware / a server check
 * for role ADMIN|MANAGER (NextAuth session) — the layout is the natural place
 * to redirect unauthenticated users.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-secondary/30">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-8">
          <AdminMobileNav />
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            AIMAG ELECTRIC · Панель управления
          </span>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
