import "server-only";

import { currentUser } from "@/server/auth/session";
import { companyAdminRepository, companyPriceAdminRepository } from "@/server/repositories/admin";
import { productService } from "@/server/services/product-service";
import { tiynToTenge } from "@/lib/money";

/**
 * The current viewer's negotiated company price per product id (tenge),
 * for whichever of the given ids have one set — empty map for an
 * anonymous visitor or one on no company. Shared by anything that needs
 * to show or apply a company's negotiated price instead of, or alongside,
 * the catalog price.
 */
export async function companyPricesForCurrentUser(
  productIds: string[]
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();
  const user = await currentUser();
  const membership = user ? await companyAdminRepository.forUser(user.id) : null;
  if (!membership) return new Map();

  const companyPrices = await companyPriceAdminRepository.forCompaniesAndProducts(
    [membership.companyId],
    productIds
  );
  return new Map(companyPrices.map((cp) => [cp.productId, tiynToTenge(cp.amountTiyn)]));
}

/**
 * Authoritative price per product id — the viewer's negotiated company
 * price when one is set, else the current catalog price — for whichever
 * of the given ids are real, published products. Never the client-sent
 * price: used wherever a line item names a real productId and the price
 * ends up somewhere staff or a customer will see as authoritative (a
 * project, a quote). An id that doesn't resolve to a product is simply
 * absent from the result (caller treats that as "по запросу").
 */
export async function resolveCatalogPrices(
  productIds: string[]
): Promise<Map<string, number | null>> {
  const unique = Array.from(new Set(productIds));
  if (unique.length === 0) return new Map();
  const [products, companyPrices] = await Promise.all([
    productService.getByIds(unique),
    companyPricesForCurrentUser(unique),
  ]);
  return new Map(products.map((p) => [p.id, companyPrices.get(p.id) ?? p.price]));
}
