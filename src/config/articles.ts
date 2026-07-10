export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
}

export const articles: Article[] = [
  {
    slug: "kak-vybrat-sechenie-kabelya",
    title: "Как выбрать сечение кабеля под нагрузку: методика и таблицы",
    excerpt:
      "Разбираем расчёт по току, потерям напряжения и способу прокладки — с примерами для промышленных объектов.",
    category: "Инженерам",
    date: "2026-01-14",
    readingTime: "8 мин",
  },
  {
    slug: "sip-vs-golyj-provod",
    title: "СИП против голого провода: когда переход окупается",
    excerpt:
      "Сравниваем потери, надёжность и стоимость эксплуатации ВЛИ на СИП для распределительных сетей 0,4 кВ.",
    category: "Аналитика",
    date: "2026-01-06",
    readingTime: "6 мин",
  },
  {
    slug: "zakupki-samruk-kazyna",
    title: "Электротехника в закупках Samruk-Kazyna: чек-лист поставщика",
    excerpt:
      "Что проверить в спецификации и документах, чтобы пройти тендер и не попасть в реестр ненадёжных поставщиков.",
    category: "Закупки",
    date: "2025-12-19",
    readingTime: "10 мин",
  },
];
