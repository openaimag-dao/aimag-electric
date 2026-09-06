import type { Metadata } from "next";
import { StaticPage, CompanyRequisites } from "@/components/static/static-page";

export const metadata: Metadata = {
  title: "Контакты — AIMAG ELECTRIC",
  description:
    "Контакты AIMAG ELECTRIC: г. Шымкент, ул. Байтерекова, 202. Телефон +7 (705) 615-17-17. Поставки электротехнической продукции по всему Казахстану.",
};

export default function ContactsPage() {
  return (
    <StaticPage title="Контакты" subtitle="Свяжитесь с нами любым удобным способом">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-5">
          <h3 className="mb-1 font-semibold">Телефон</h3>
          <a href="tel:+77056151717" className="text-lg underline">
            +7 (705) 615-17-17
          </a>
          <p className="mt-1 text-sm text-gray-500">
            Звонки, WhatsApp — по вопросам заказа, доставки и подбора продукции.
          </p>
        </div>
        <div className="rounded-lg border p-5">
          <h3 className="mb-1 font-semibold">Адрес</h3>
          <p>г. Шымкент, ул. Байтерекова, 202</p>
          <p className="mt-1 text-sm text-gray-500">
            Самовывоз — по предварительному согласованию.
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold">Для юридических лиц</h2>
      <p>
        Отправьте нам спецификацию или список закупки — подготовим коммерческое предложение и счёт.
        Заявки принимаем по телефону и через форму запроса КП на сайте.
      </p>

      <CompanyRequisites />
    </StaticPage>
  );
}
