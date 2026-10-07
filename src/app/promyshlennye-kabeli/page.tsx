import type { Metadata } from "next";
import Link from "next/link";
import { QuoteDialog } from "@/components/common/quote-dialog";
import { industrialCables, industrialCableRequest } from "@/config/industrial-cables";
import { industrialCablePages } from "@/config/industrial-cable-pages";
import { siteConfig } from "@/config/site";

const title = "Промышленные кабели — АСБл, КВВГ, КГ, силовые и бронированные";
const description =
  "Выберите марку и сечение промышленного кабеля для запроса цены в Казахстане: АСБл-10, АПвБШв, ВВГнг(А)-LS, АВВГ, ВБШв, АВБШв, КВВГ и КГ.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/promyshlennye-kabeli" },
  openGraph: { title, description, type: "website", url: `${siteConfig.url}/promyshlennye-kabeli` },
};

export default function IndustrialCablesPage() {
  return (
    <div className="container py-10">
      <Link href="/catalog" className="text-sm text-steel-700 underline">
        Каталог продукции
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold text-primary">
        Промышленные кабели для предприятий и объектов
      </h1>
      <p className="mt-4 max-w-3xl text-steel-700">
        Выберите марку и комбинацию жил и сечения для расчёта коммерческого предложения. Цена,
        доступность, изготовитель, точное исполнение и срок поставки подтверждаются по каждой
        заявке.
      </p>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        Размеры ниже — стартовая подборка для запроса. Нужное сечение и напряжение определяются
        проектом. Можно запросить другие размеры и марки.
      </p>
      <nav aria-label="Марки промышленных кабелей" className="mt-6 flex flex-wrap gap-3">
        {industrialCables.map((group) => (
          <a
            key={group.id}
            href={`#${group.id}`}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:border-signal"
          >
            {group.mark}
          </a>
        ))}
      </nav>
      <div className="mt-8 space-y-8">
        {industrialCables.map((group) => (
          <section
            key={group.id}
            id={group.id}
            className="scroll-mt-28 rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-display text-xl font-semibold text-primary">Кабель {group.mark}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.execution}. Цена и возможность поставки — по запросу.
            </p>
            {industrialCablePages
              .filter((item) => item.groupId === group.id)
              .map((item) => (
                <Link
                  key={item.slug}
                  href={`/promyshlennye-kabeli/${item.slug}`}
                  className="mt-3 inline-block text-sm underline"
                >
                  Подбор и заказ кабеля {item.name}
                </Link>
              ))}
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {group.sizes.map((size) => (
                <li key={size} className="rounded-lg border border-border p-4">
                  <h3 className="font-semibold text-primary">
                    {group.mark} {size}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">Число жил × сечение, мм²</p>
                  <QuoteDialog
                    triggerLabel={`Запросить цену ${group.mark} ${size}`}
                    variant="outline"
                    className="mt-3 h-auto w-full whitespace-normal"
                    defaultMessage={industrialCableRequest(group.mark, size, group.execution)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <section className="mt-10 rounded-xl border border-border p-5">
        <h2 className="font-display text-xl font-semibold text-primary">
          Комплектация и электромонтаж
        </h2>
        <p className="mt-2 text-sm text-steel-700">
          Укажите метраж по каждой позиции, город и желаемый срок. Если нужны муфты, документы или
          электромонтажные работы, включите их в запрос. Возможность поставки и состав комплекта
          проверим до согласования заказа.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm underline">
          <Link href="/blog/kupit-kabelnye-mufty-kazakhstan">Подбор кабельных муфт</Link>
          <Link href="/blog/komplektaciya-obekta-elektromontazh-pod-klyuch">
            Комплектация кабельной линии
          </Link>
          <Link href="/elektromontazh">Электромонтаж под ключ</Link>
        </div>
        <QuoteDialog
          triggerLabel="Запросить другие марки и сечения"
          className="mt-4"
          defaultMessage="Нужны промышленные кабели по спецификации.\nМарки, сечения и метраж: \nГород доставки: \nЖелаемый срок: "
        />
      </section>
    </div>
  );
}
