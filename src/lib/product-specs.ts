import type { SpecRow } from "@/types/product-detail";

interface ProductAttributeValue {
  valueString: string | null;
  valueNumber: number | null;
  valueBool: boolean | null;
  attribute: { key: string; name: string; unit: string | null; order: number };
}

/** Detail pages show every populated attribute, including non-filterable ones. */
export function productSpecRows(values: ProductAttributeValue[]): SpecRow[] {
  return [...values]
    .sort(
      (a, b) =>
        a.attribute.order - b.attribute.order || a.attribute.key.localeCompare(b.attribute.key)
    )
    .flatMap(({ attribute, valueNumber, valueBool, valueString }) => {
      const value = valueNumber ?? valueBool ?? valueString?.trim();
      if (value === null || value === undefined || value === "") return [];
      const text = typeof value === "boolean" ? (value ? "Да" : "Нет") : String(value);
      const unit = typeof value === "boolean" ? "" : attribute.unit?.trim();
      return [{ label: attribute.name, value: unit ? `${text} ${unit}` : text }];
    });
}
