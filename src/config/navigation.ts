export interface NavItem {
  label: string;
  href: string;
}

// Main nav labels/hrefs now live in i18n/dictionaries/{ru,kk}.ts (dict.nav) —
// see Header/MobileNav — so they can be localized. footerNav/legalNav below
// aren't localized yet (Block 9 is chrome-only for now), so they stay here.

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Продукция",
    items: [
      { label: "Кабели", href: "/catalog?cat=kabeli" },
      { label: "Провода", href: "/catalog?cat=provoda" },
      { label: "Арматура СИП", href: "/catalog?cat=armatura-sip" },
      { label: "Высоковольтное оборудование", href: "/catalog?cat=vysokovoltnoe" },
    ],
  },
  {
    title: "Покупателям",
    items: [
      { label: "Доставка", href: "/dostavka" },
      { label: "Оплата и реквизиты", href: "/oplata" },
      { label: "Гарантия", href: "/garantiya" },
      { label: "Возврат товара", href: "/vozvrat" },
      { label: "Вопросы и ответы", href: "/faq" },
    ],
  },
  {
    title: "Компания",
    items: [
      { label: "О компании", href: "/o-kompanii" },
      { label: "Контакты", href: "/kontakty" },
    ],
  },
];

/** Правовые ссылки — выводятся мелкой строкой в нижней полосе футера. */
export const legalNav: NavItem[] = [
  { label: "Политика конфиденциальности", href: "/privacy" },
  { label: "Пользовательское соглашение", href: "/terms" },
];
