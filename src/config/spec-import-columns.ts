import type { ColumnSpec } from "@/types/import";

/**
 * Column schema for the customer-facing "Загрузить ТЗ" upload — separate
 * from IMPORT_COLUMNS (admin catalog import) since this never writes to the
 * catalog, only matches against it. Shares the same parser (parseSheet) and
 * alias-matching technique, just a different schema.
 */
export const SPEC_IMPORT_COLUMNS: ColumnSpec[] = [
  { key: "sku", label: "Артикул", required: false, aliases: ["sku", "артикул", "код"] },
  {
    key: "title",
    label: "Наименование",
    required: true,
    aliases: ["title", "название", "наименование", "позиция", "товар"],
  },
  {
    key: "quantity",
    label: "Количество",
    required: false,
    hint: "по умолчанию 1",
    aliases: ["quantity", "количество", "кол-во", "объём"],
  },
  { key: "unit", label: "Единица", required: false, aliases: ["unit", "единица", "ед", "ед.изм"] },
  {
    key: "manufacturer",
    label: "Производитель",
    required: false,
    aliases: ["manufacturer", "производитель", "бренд"],
  },
  {
    key: "voltage",
    label: "Напряжение",
    required: false,
    hint: "кВ, опционально — сверим с товаром в каталоге",
    aliases: ["voltage", "напряжение", "напряжение, кв", "u", "uном"],
  },
];
