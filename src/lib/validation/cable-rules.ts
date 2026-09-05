/**
 * Deterministic GOST-standard facts about common cable/wire markings — the
 * conductor material and voltage class are dictated by the marking itself,
 * not a matter of catalog data entry (e.g. "СИП" cannot be copper; "АВВГ"
 * cannot be rated 10 kV). Used to flag catalog rows whose stored
 * material/voltage contradicts what the product's own title marking
 * requires.
 *
 * Scope: only markings with an unambiguous, single-value GOST rule are
 * listed here. Markings that legitimately vary by product line (izolyatory,
 * high-voltage switchgear, sleeves rated up to 35 kV, circuit breakers) are
 * deliberately left out rather than guessing — validateCableProduct simply
 * reports no findings for those.
 */

export interface CableRule {
  /** Human label for report output. */
  marking: string;
  /** Matches if the title contains this marking, as written in the catalog. */
  pattern: RegExp;
  allowedMaterials?: string[];
  /** Voltage class in kV. */
  allowedVoltages?: number[];
  note: string;
}

export const CABLE_RULES: CableRule[] = [
  {
    marking: "СИП",
    pattern: /СИП-?\d*/,
    allowedMaterials: ["Алюминий"],
    note: "СИП (самонесущий изолированный провод) — токопроводящая жила только алюминиевая, ГОСТ Р 52373.",
  },
  {
    marking: "ПВ-3",
    pattern: /ПВ-3/,
    allowedMaterials: ["Медь"],
    note: "ПВ-3 — гибкая медная жила, ГОСТ 31947. Алюминиевого исполнения не существует.",
  },
  {
    marking: "ПуГВ",
    pattern: /ПуГВ/,
    allowedMaterials: ["Медь"],
    note: "ПуГВ — медный установочный провод, ГОСТ 31947.",
  },
  {
    marking: "ПВС",
    pattern: /ПВС/,
    allowedMaterials: ["Медь"],
    note: "ПВС — медный гибкий шнур, ГОСТ 7399.",
  },
  {
    marking: "АВВГ",
    pattern: /АВВГ/,
    allowedMaterials: ["Алюминий"],
    allowedVoltages: [0.66, 1],
    note: "АВВГ — алюминиевая жила (префикс «А»), класс напряжения 0,66/1 кВ, ГОСТ 16442.",
  },
  {
    marking: "ВВГ",
    // Negative lookbehind so "АВВГ" (handled by its own rule above) doesn't
    // also match the plain-copper ВВГ rule.
    pattern: /(?<!А)ВВГ/,
    allowedMaterials: ["Медь"],
    allowedVoltages: [0.66, 1],
    note: "ВВГ (без префикса «А») — медная жила, класс напряжения 0,66/1 кВ, ГОСТ 31996.",
  },
];

export interface CableRuleViolation {
  rule: string;
  field: "material" | "voltage";
  expected: string;
  actual: string;
  note: string;
}

export interface ProductForValidation {
  title: string;
  material: string | null;
  voltage: number | null;
}

/** Checks a single product's title/material/voltage against CABLE_RULES. */
export function validateCableProduct(product: ProductForValidation): CableRuleViolation[] {
  const violations: CableRuleViolation[] = [];
  for (const rule of CABLE_RULES) {
    if (!rule.pattern.test(product.title)) continue;

    if (
      rule.allowedMaterials &&
      product.material &&
      !rule.allowedMaterials.includes(product.material)
    ) {
      violations.push({
        rule: rule.marking,
        field: "material",
        expected: rule.allowedMaterials.join(" / "),
        actual: product.material,
        note: rule.note,
      });
    }

    if (
      rule.allowedVoltages &&
      product.voltage !== null &&
      !rule.allowedVoltages.includes(product.voltage)
    ) {
      violations.push({
        rule: rule.marking,
        field: "voltage",
        expected: rule.allowedVoltages.map((v) => `${v} кВ`).join(" / "),
        actual: `${product.voltage} кВ`,
        note: rule.note,
      });
    }
  }
  return violations;
}
