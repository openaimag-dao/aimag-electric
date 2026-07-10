import type { LucideIcon } from "lucide-react";
import {
  Truck,
  BadgePercent,
  Building2,
  HardHat,
  FileCheck2,
} from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const features: Feature[] = [
  {
    title: "Доставка по Казахстану",
    description:
      "Отгрузка со склада и транспортными компаниями в любой регион — от Актобе до Алматы.",
    icon: Truck,
  },
  {
    title: "Оптовые цены",
    description:
      "Прямые контракты с заводами-изготовителями и цены под объём проекта.",
    icon: BadgePercent,
  },
  {
    title: "Работа с юридическими лицами",
    description:
      "Полный пакет документов, НДС, договоры и работа по тендерным закупкам.",
    icon: Building2,
  },
  {
    title: "Помощь инженеров",
    description:
      "Подбор марок кабеля и оборудования по проекту, расчёт сечений и нагрузок.",
    icon: HardHat,
  },
  {
    title: "Сертификаты качества",
    description:
      "Продукция с сертификатами соответствия ТР ТС и паспортами качества.",
    icon: FileCheck2,
  },
];
