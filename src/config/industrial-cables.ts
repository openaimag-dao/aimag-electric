/** Initial procurement selection, not warehouse stock or a measured sales ranking. */
export const industrialCables = [
  { id: "asbl", mark: "АСБл", execution: "10 кВ", sizes: ["3×95", "3×120", "3×185", "3×240"] },
  {
    id: "spe",
    mark: "АПвБШв",
    execution: "Напряжение и исполнение по проекту",
    sizes: ["3×95", "3×120", "3×185", "3×240"],
  },
  {
    id: "vvg",
    mark: "ВВГнг(А)-LS",
    execution: "Напряжение по проекту",
    sizes: ["3×2,5", "5×6", "5×10", "5×16"],
  },
  {
    id: "avvg",
    mark: "АВВГ",
    execution: "Напряжение по проекту",
    sizes: ["4×16", "4×25", "4×35", "4×50"],
  },
  {
    id: "vbshv",
    mark: "ВБШв",
    execution: "Напряжение и исполнение по проекту",
    sizes: ["4×16", "4×25", "4×35", "4×50"],
  },
  {
    id: "avbshv",
    mark: "АВБШв",
    execution: "Напряжение и исполнение по проекту",
    sizes: ["4×25", "4×35", "4×50", "4×70"],
  },
  {
    id: "kvvg",
    mark: "КВВГ",
    execution: "Исполнение по проекту",
    sizes: ["7×1,5", "10×1,5", "14×1,5", "19×1,5"],
  },
  {
    id: "kg",
    mark: "КГ",
    execution: "Напряжение и климатическое исполнение по проекту",
    sizes: ["3×2,5", "3×4", "4×6", "4×10"],
  },
];

export function industrialCableRequest(mark: string, size: string, execution: string) {
  return `Прошу рассчитать поставку кабеля ${mark} ${size} мм².\nИсполнение: ${execution}.\nДлина, м: \nГород доставки: \nЖелаемый срок: \nНеобходимые муфты и монтаж: `;
}
