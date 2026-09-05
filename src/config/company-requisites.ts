/**
 * Real AIMAG ELECTRIC requisites — single source of truth, used by both the
 * "Оплата"/"Контакты" static pages and the cart spec PDF export. The entity
 * is a sole proprietor (ИП), not a ТОО, so the correct labels are ИИН/ИИК,
 * not БИН/IBAN.
 */
export const companyRequisites = {
  legalName: "ИП ОРАЗБАЕВ ЕРЛАН ОЖАНОВИЧ (торговая марка AIMAG ELECTRIC)",
  iin: "890922301639",
  address: "г. Шымкент, ул. Байтерекова, 202",
  bank: "АО «Банк ЦентрКредит»",
  bik: "KCJBKZKX",
  iik: "KZ248562204135637519",
  phone: "+7 (705) 615-17-17",
  phoneHref: "tel:+77056151717",
} as const;
