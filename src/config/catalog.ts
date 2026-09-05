import type { LucideIcon } from "lucide-react";
import { Cable, Zap, Shield, Link2, Combine, ToggleRight, Factory } from "lucide-react";

export interface Category {
  slug: string;
  title: string;
  description: string;
  /** Short technical tag shown as an eyebrow on the card. */
  spec: string;
  icon: LucideIcon;
}

export const categories: Category[] = [
  {
    slug: "kabeli",
    title: "Кабели",
    description:
      "Силовые, контрольные и бронированные кабели ВВГ, АВВГ, ВБбШв, КГ и специальные марки.",
    spec: "0,66–35 кВ",
    icon: Cable,
  },
  {
    slug: "provoda",
    title: "Провода",
    description: "Установочные и монтажные провода ПВ, ПуГВ, ПВС, СИП для распределительных сетей.",
    spec: "Cu / Al",
    icon: Zap,
  },
  {
    slug: "izolyatory",
    title: "Изоляторы",
    description: "Штыревые, подвесные, опорные и проходные изоляторы для ВЛ и распредустройств.",
    spec: "Фарфор / стекло",
    icon: Shield,
  },
  {
    slug: "armatura-sip",
    title: "Арматура СИП",
    description: "Анкерные, поддерживающие и соединительные зажимы, прокалывающие ответвители.",
    spec: "0,4 кВ ВЛИ",
    icon: Link2,
  },
  {
    slug: "mufty",
    title: "Муфты",
    description: "Термоусаживаемые и холодной усадки муфты — соединительные и концевые.",
    spec: "1–35 кВ",
    icon: Combine,
  },
  {
    slug: "avtomaty",
    title: "Автоматы",
    description: "Модульные автоматические выключатели, УЗО, дифавтоматы и щитовое оборудование.",
    spec: "6–630 А",
    icon: ToggleRight,
  },
  {
    slug: "vysokovoltnoe",
    title: "Высоковольтное оборудование",
    description: "Разъединители, выключатели нагрузки, трансформаторы и КРУ для подстанций.",
    spec: "до 110 кВ",
    icon: Factory,
  },
];
