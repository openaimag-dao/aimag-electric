import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Вход в личный кабинет",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-steel-950 text-signal">
            <Zap className="size-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary">Личный кабинет</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Войдите, чтобы видеть свои заявки, сделки и документы.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Нет доступа?{" "}
          <Link href="/#quote" className="text-signal-700 hover:underline">
            Оставьте заявку
          </Link>{" "}
          — менеджер {siteConfig.shortName} создаст вам аккаунт.
        </p>
      </div>
    </div>
  );
}
