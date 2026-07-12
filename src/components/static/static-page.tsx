import type { ReactNode } from "react";

export function StaticPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">{title}</h1>
      {subtitle && <p className="mb-8 text-gray-500">{subtitle}</p>}
      <div className="prose prose-neutral max-w-none space-y-6 text-[15px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

/** Единый блок реквизитов — используется на страницах «Оплата» и «Контакты». */
export function CompanyRequisites() {
  return (
    <div className="rounded-lg border bg-gray-50 p-5 text-sm">
      <h3 className="mb-3 font-semibold">Реквизиты</h3>
      <dl className="grid gap-1.5">
        <div className="flex gap-2">
          <dt className="w-40 shrink-0 text-gray-500">Наименование</dt>
          <dd>ИП ОРАЗБАЕВ ЕРЛАН ОЖАНОВИЧ (торговая марка AIMAG ELECTRIC)</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 shrink-0 text-gray-500">ИИН</dt>
          <dd>890922301639</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 shrink-0 text-gray-500">Адрес</dt>
          <dd>г. Шымкент, ул. Байтерекова, 202</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 shrink-0 text-gray-500">Банк</dt>
          <dd>АО «Банк ЦентрКредит»</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 shrink-0 text-gray-500">БИК</dt>
          <dd>KCJBKZKX</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 shrink-0 text-gray-500">ИИК</dt>
          <dd>KZ248562204135637519</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-40 shrink-0 text-gray-500">Телефон</dt>
          <dd>
            <a href="tel:+77056151717" className="underline">
              +7 (705) 615-17-17
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
