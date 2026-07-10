export interface NavItem {
  label: string;
  href: string;
}

export const mainNav: NavItem[] = [
  { label: "Каталог", href: "/catalog" },
  { label: "Категории", href: "/#categories" },
  { label: "О компании", href: "/about" },
  { label: "Доставка", href: "/delivery" },
  { label: "Контакты", href: "/contacts" },
];

export const footerNav: { title: string; items: NavItem[] }[] = [
  {
    title: "Продукция",
    items: [
      { label: "Кабели", href: "/catalog/kabeli" },
      { label: "Провода", href: "/catalog/provoda" },
      { label: "Арматура СИП", href: "/catalog/armatura-sip" },
      { label: "Высоковольтное оборудование", href: "/catalog/vysokovoltnoe" },
    ],
  },
  {
    title: "Компания",
    items: [
      { label: "О нас", href: "/about" },
      { label: "Сертификаты", href: "/certificates" },
      { label: "Доставка и оплата", href: "/delivery" },
      { label: "Контакты", href: "/contacts" },
    ],
  },
  {
    title: "Клиентам",
    items: [
      { label: "Получить КП", href: "/quote" },
      { label: "Реквизиты", href: "/requisites" },
      { label: "Работа с юрлицами", href: "/b2b" },
      { label: "Публичная оферта", href: "/offer" },
    ],
  },
];
