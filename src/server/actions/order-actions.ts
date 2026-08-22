"use server";

import { orderRepository } from "@/server/repositories/order-repository";
import { companyAdminRepository } from "@/server/repositories/admin";
import { requireUser } from "@/lib/security/rbac";

async function myCompanyIds(userId: string): Promise<string[]> {
  const memberships = await companyAdminRepository.membershipsForUser(userId);
  return memberships.map((m) => m.companyId);
}

export async function getMyOrders() {
  const user = await requireUser();
  const companyIds = await myCompanyIds(user.id);
  return orderRepository.listForUser(user.id, companyIds);
}

export async function getMyOrder(id: string) {
  const user = await requireUser();
  const companyIds = await myCompanyIds(user.id);
  return orderRepository.getForUser(id, user.id, companyIds);
}
