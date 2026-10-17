/**
 * Cities explicitly named on /dostavka as real delivery destinations
 * (shipped by transport company from the Shymkent warehouse). Used to
 * generate one SEO landing page per city — real, already-stated facts,
 * not a new claim, so no city here should be added without first adding
 * it to the list on /dostavka itself.
 */
export interface DeliveryCity {
  slug: string;
  name: string;
  /** Prepositional case ("в Алматы", "в Актобе") — Kazakh/Russian city names decline irregularly, so this is spelled out per city rather than derived. */
  nameIn: string;
  region: string;
}

export const DELIVERY_CITIES: DeliveryCity[] = [
  { slug: "almaty", name: "Алматы", nameIn: "Алматы", region: "город республиканского значения" },
  { slug: "astana", name: "Астана", nameIn: "Астану", region: "столица Казахстана" },
  { slug: "karaganda", name: "Караганда", nameIn: "Караганду", region: "Карагандинская область" },
  { slug: "atyrau", name: "Атырау", nameIn: "Атырау", region: "Атырауская область" },
  { slug: "aktau", name: "Актау", nameIn: "Актау", region: "Мангистауская область" },
  { slug: "aktobe", name: "Актобе", nameIn: "Актобе", region: "Актюбинская область" },
  { slug: "taraz", name: "Тараз", nameIn: "Тараз", region: "Жамбылская область" },
  { slug: "turkestan", name: "Туркестан", nameIn: "Туркестан", region: "Туркестанская область" },
  { slug: "kyzylorda", name: "Кызылорда", nameIn: "Кызылорду", region: "Кызылординская область" },
  { slug: "pavlodar", name: "Павлодар", nameIn: "Павлодар", region: "Павлодарская область" },
  {
    slug: "ust-kamenogorsk",
    name: "Усть-Каменогорск",
    nameIn: "Усть-Каменогорск",
    region: "Восточно-Казахстанская область",
  },
  { slug: "kostanay", name: "Костанай", nameIn: "Костанай", region: "Костанайская область" },
];
