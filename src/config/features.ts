import type { LucideIcon } from "lucide-react";
import { Truck, BadgePercent, Building2, HardHat, FileCheck2 } from "lucide-react";

export interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const features: Feature[] = [
  {
    title: "Доставка по Казахстану",
    description: "Стоимость и сроки доставки транспортной компанией уточняем для каждого заказа.",
    icon: Truck,
  },
  {
    title: "Оптовые цены",
    description: "Подготовим стоимость под перечень товаров и объём вашего проекта.",
    icon: BadgePercent,
  },
  {
    title: "Работа с юридическими лицами",
    description: "Условия оплаты и состав документов согласуем при оформлении заказа.",
    icon: Building2,
  },
  {
    title: "Помощь инженеров",
    description: "Пришлите спецификацию — поможем найти нужные позиции и подходящие аналоги.",
    icon: HardHat,
  },
  {
    title: "Документы на продукцию",
    description: "Паспорта и сертификаты на конкретную позицию уточняйте перед заказом.",
    icon: FileCheck2,
  },
];
