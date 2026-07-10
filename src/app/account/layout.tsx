import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { currentUser, isStaff } from "@/server/auth/session";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login?callbackUrl=/account");

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm text-muted-foreground">Личный кабинет</p>
          <h1 className="font-display text-2xl font-bold text-primary">
            {user.name ?? user.email}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {isStaff(user.role) && (
            <Link
              href="/admin"
              className="inline-flex items-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-primary hover:bg-secondary"
            >
              Панель управления
            </Link>
          )}
          <SignOutButton />
        </div>
      </div>
      {children}
    </div>
  );
}
