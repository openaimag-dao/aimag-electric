import type { LucideIcon } from "lucide-react";
import { FileSearch, Calculator, FileSignature, PackageCheck } from "lucide-react";

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
  /** Stage description; actual deadlines are agreed for each request. */
  duration: string;
  icon: LucideIcon;
}

export const processSteps: ProcessStep[] = [
  {
    step: 1,
    title: "Заявка и спецификация",
    description:
      "Присылаете перечень позиций, проект или задачу. Инженер уточняет марки, сечения и объёмы.",
    duration: "Начало работы",
    icon: FileSearch,
  },
  {
    step: 2,
    title: "Расчёт и КП",
    description:
      "Подбираем номенклатуру, проверяем наличие на складах и готовим коммерческое предложение с ценами и сроками.",
    duration: "После уточнения позиций",
    icon: Calculator,
  },
  {
    step: 3,
    title: "Договор и оплата",
    description:
      "Заключаем договор, выставляем счёт с НДС. Работаем по тендерным и прямым закупкам с юрлицами.",
    duration: "После согласования",
    icon: FileSignature,
  },
  {
    step: 4,
    title: "Отгрузка и доставка",
    description:
      "Комплектуем заказ, отгружаем со склада и доставляем транспортными компаниями в любой регион РК.",
    duration: "Срок по маршруту",
    icon: PackageCheck,
  },
];
