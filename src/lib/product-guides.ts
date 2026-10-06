/** Reading links based only on the product name; no unverified catalog attributes are inferred. */
export function productGuides(title: string): { href: string; label: string }[] {
  const name = title.toLocaleUpperCase("ru-RU");
  if (/СИП[ -]?3(?!\d)/u.test(name))
    return [{ href: "/blog/kupit-sip-3-kazakhstan", label: "Как подготовить заказ на СИП-3" }];
  if (/СИП[ -]?4(?!\d)/u.test(name))
    return [{ href: "/blog/kupit-sip-4-kazakhstan", label: "Как подготовить заказ на СИП-4" }];
  if (/ВВГНГ/u.test(name))
    return [{ href: "/blog/kupit-vvgng-kazakhstan", label: "Маркировка и заказ кабеля ВВГнг" }];
  if (/МУФТА/u.test(name))
    return [
      { href: "/blog/kupit-kabelnye-mufty-kazakhstan", label: "Подбор и заказ кабельной муфты" },
    ];
  if (/ИЗОЛЯТОР/u.test(name))
    return [
      { href: "/blog/kupit-izolyatory-kazakhstan", label: "Как подобрать изоляторы для линии" },
    ];
  if (/(^|[^А-ЯЁ])КТП($|[^А-ЯЁ])/u.test(name))
    return [{ href: "/blog/kupit-ktp-kazakhstan", label: "Опросный лист для комплектации КТП" }];
  if (/ТРАНСФОРМАТОР/u.test(name))
    return [
      {
        href: "/blog/kupit-silovoy-transformator-kazakhstan",
        label: "Данные для заказа силового трансформатора",
      },
    ];
  return [];
}
