import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SpecImportWizard } from "@/components/account/spec-import-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Загрузить ТЗ",
  robots: { index: false, follow: false },
};

export default function SpecImportPage() {
  return (
    <div>
      <Link
        href="/account/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> К проектам
      </Link>
      <h1 className="mb-2 font-display text-2xl font-bold text-primary">Загрузить ТЗ</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Загрузите таблицу (.xlsx, .xls или .csv) со списком позиций — мы сопоставим их с реальными
        товарами каталога по артикулу и названию. Ничего не добавляется в проект, пока вы сами не
        подтвердите совпадения.
      </p>
      <SpecImportWizard />
    </div>
  );
}
