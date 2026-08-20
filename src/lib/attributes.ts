export type AttributeValueType = "STRING" | "NUMBER" | "BOOLEAN";

const TRUTHY = new Set(["1", "true", "да", "yes"]);

/**
 * Coerce a raw string (from a form field or an import spreadsheet cell) into
 * the AttributeValue column that matches the attribute's declared type.
 * Returns null when a NUMBER value doesn't parse — callers decide whether
 * that's a hard error (admin form) or a skip-with-warning (bulk import).
 */
export function coerceAttributeValue(
  type: AttributeValueType,
  raw: string
): { valueString: string | null; valueNumber: number | null; valueBool: boolean | null } | null {
  if (type === "NUMBER") {
    const n = Number(String(raw).trim().replace(",", "."));
    if (Number.isNaN(n)) return null;
    return { valueString: null, valueNumber: n, valueBool: null };
  }
  if (type === "BOOLEAN") {
    return {
      valueString: null,
      valueNumber: null,
      valueBool: TRUTHY.has(raw.trim().toLowerCase()),
    };
  }
  return { valueString: raw, valueNumber: null, valueBool: null };
}
