export interface ParsedSkuLine {
  sku: string;
  qty: number;
  raw: string;
}

const MAX_LINES = 200;

// Placeholder used to mask a decimal comma ("2,5") before tokenizing — comma
// is also a valid field separator ("KAB-1001, 10"), so the two would
// otherwise collide. No real SKU or pasted quantity will ever contain this
// literal token, so it's safe as a stand-in.
const DECIMAL_MASK = "@@DEC@@";

/**
 * Parses "Быстрый заказ" free text into SKU + quantity pairs. Accepts one
 * item per line, SKU and an optional quantity separated by whitespace, a
 * semicolon, a tab, or a comma (e.g. "KAB-1001 10", "KAB-1001\t10",
 * "KAB-1001, 10", or just "KAB-1001" for qty 1). A comma between two digits
 * ("2,5") is treated as a Russian decimal point, not a separator.
 */
export function parseSkuLines(text: string): ParsedSkuLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_LINES)
    .map((raw) => {
      const masked = raw.replace(/(\d),(\d)/g, `$1${DECIMAL_MASK}$2`);
      const parts = masked.split(/[\s,;\t]+/).filter(Boolean);
      const last = (parts[parts.length - 1] ?? "").replace(DECIMAL_MASK, ".");
      const lastIsQty = parts.length > 1 && /^\d+(\.\d+)?$/.test(last);
      const qty = lastIsQty ? Number(last) : 1;
      const sku = (lastIsQty ? parts.slice(0, -1) : parts).join(" ").replace(DECIMAL_MASK, ",");
      return { sku, qty: qty > 0 ? qty : 1, raw };
    })
    .filter((l) => l.sku.length > 0);
}
