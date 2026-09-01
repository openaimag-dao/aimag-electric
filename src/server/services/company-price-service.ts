import "server-only";

import { currentUser } from "@/server/auth/session";
import { companyAdminRepository, companyPriceAdminRepository } from "@/server/repositories/admin";
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
