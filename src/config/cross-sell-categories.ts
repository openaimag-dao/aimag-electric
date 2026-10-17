/**
 * Which category a product's category is typically bought alongside, for
 * the "С этим покупают" section on the product page. Deliberately
 * rule-based rather than mined from order history — order volume so far is
 * too small for co-occurrence stats to be reliable, and a wrong statistical
 * pairing is worse than a conservative, explainable one. Only pairs with a
 * clear, real installation relationship (e.g. cable needs lugs/clips) are
 * listed; see category-seo.ts for what each slug actually covers.
 */
export const CROSS_SELL_CATEGORIES: Record<string, string[]> = {
  "kabel-provod": ["kabelnaya-armatura", "krepezh", "zashchita"],
  "kabelnaya-armatura": ["kabel-provod"],
  "armatura-sip": ["kabel-provod"],
  "izolyatory-armatura": ["vysokovoltnoe"],
  avtomaty: ["shchity-korpusa", "krepezh", "shiny-metall"],
  "shchity-korpusa": ["avtomaty", "shiny-metall", "kommutatsiya", "kip", "zashchita"],
  "shiny-metall": ["shchity-korpusa", "avtomaty"],
  vysokovoltnoe: ["transformatory", "izolyatory-armatura"],
  transformatory: ["vysokovoltnoe", "kip"],
  kommutatsiya: ["shchity-korpusa", "krepezh"],
  instrument: ["krepezh"],
  krepezh: ["kabel-provod", "avtomaty"],
  zashchita: ["avtomaty", "shchity-korpusa"],
  kip: ["shchity-korpusa", "transformatory"],
  elektroustanovochnye: ["osveshchenie", "kabel-provod"],
  osveshchenie: ["elektroustanovochnye"],
  "szi-gsm": ["avtomaty", "shchity-korpusa"],
};
