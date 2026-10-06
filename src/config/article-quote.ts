const requirements: Record<string, string[]> = {
  "kupit-sip-3-kazakhstan": ["Маркировка, сечение и напряжение", "Длина по каждой позиции, м"],
  "kupit-sip-4-kazakhstan": ["Маркировка, число жил и сечение", "Длина, м; необходимая арматура"],
  "kupit-vvgng-kazakhstan": [
    "Полная маркировка, число жил, сечение и напряжение",
    "Длина по каждой позиции, м",
  ],
  "kupit-izolyatory-kazakhstan": [
    "Модель изолятора и количество, шт.",
    "Данные линии и требования проекта",
  ],
  "kupit-silovoy-transformator-kazakhstan": [
    "Мощность и напряжения ВН/НН",
    "Количество, исполнение и требования проекта",
  ],
  "kupit-ktp-kazakhstan": [
    "Мощность, напряжения и исполнение КТП",
    "Состав комплекта по проекту или опросному листу",
  ],
  "komplektaciya-obekta-elektromontazh-pod-klyuch": [
    "Объект и перечень товаров с количеством",
    "Какие электромонтажные работы нужны",
    "Имеется ли проект или спецификация",
  ],
};

export function articleQuote(slug: string, title: string) {
  const fields = requirements[slug] ?? ["Товары и количество"];
  const checklist = [...fields, "Город доставки", "Желаемый срок поставки"];
  return {
    checklist,
    message: `Нужен подбор по теме «${title}».\n${checklist.map((field) => `${field}: `).join("\n")}`,
  };
}
