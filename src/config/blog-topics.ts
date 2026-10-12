export const blogTopics = [
  {
    id: "cables",
    title: "Кабели и провода",
    description: "Маркировка, сечения, муфты и данные для заказа кабельной линии.",
    catalog: { href: "/promyshlennye-kabeli", label: "Выбрать промышленный кабель" },
    slugs: [
      "komplektaciya-bronirovannoy-kabelnoy-linii",
      "kupit-sip-3-kazakhstan",
      "kupit-sip-4-kazakhstan",
      "kupit-vvgng-kazakhstan",
      "kupit-kabelnye-mufty-kazakhstan",
      "kak-vybrat-sechenie-kabelya",
      "sip-vs-golyj-provod",
      "vvg-vs-vvgng-ls",
      "kabelnye-mufty-kak-vybrat",
      "khranenie-i-uchet-kabelnoy-produktsii",
      "gofra-metallorukav-kabel-kanal",
    ],
  },
  {
    id: "equipment",
    title: "Оборудование и защита",
    description: "Изоляторы, трансформаторы, КТП и защитные аппараты для объекта.",
    catalog: { href: "/catalog", label: "Перейти в каталог оборудования" },
    slugs: [
      "kupit-izolyatory-kazakhstan",
      "kupit-silovoy-transformator-kazakhstan",
      "kupit-ktp-kazakhstan",
      "izolyatory-vl-shtyrevye-i-podvesnye",
      "uzo-vs-difavtomat",
      "avtomaticheskie-vyklyuchateli-b-c-d",
    ],
  },
  {
    id: "procurement",
    title: "Закупка и монтаж",
    description: "Подготовка спецификации и общего запроса на материалы и работы.",
    catalog: { href: "/elektromontazh", label: "Обсудить электромонтаж под ключ" },
    slugs: ["komplektaciya-obekta-elektromontazh-pod-klyuch", "zakupki-samruk-kazyna"],
  },
];

export function findBlogTopic(slug: string) {
  return blogTopics.find((topic) => topic.slugs.includes(slug));
}
