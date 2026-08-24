"use server";

import { revalidatePath } from "next/cache";

import { projectRepository, ProjectAccessError } from "@/server/repositories/project-repository";
import { companyAdminRepository } from "@/server/repositories/admin";
import { requireUser } from "@/lib/security/rbac";
import {
  projectFormSchema,
  projectItemInputSchema,
  projectStatus,
  saveCartAsProjectSchema,
} from "@/lib/validations/project";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { tengeToTiyn } from "@/lib/money";

/** companyIds this user can see projects for (any role), and can edit projects for (any role except VIEWER). */
async function projectScope(userId: string) {
  const memberships = await companyAdminRepository.membershipsForUser(userId);
  const companyIds = memberships.map((m) => m.companyId);
  const writableCompanyIds = memberships.filter((m) => m.role !== "VIEWER").map((m) => m.companyId);
  return { companyIds, writableCompanyIds };
}

function revalidate(id?: string) {
  revalidatePath("/account/projects");
  if (id) revalidatePath(`/account/projects/${id}`);
}

function handleAccessError(e: unknown): ActionResult<never> {
  if (e instanceof ProjectAccessError) return fail(e.message);
  return fail(prismaError(e));
}

export async function getMyProjects() {
  const user = await requireUser();
  const { companyIds } = await projectScope(user.id);
  return projectRepository.listForUser(user.id, companyIds);
}

export async function getMyProject(id: string) {
  const user = await requireUser();
  const { companyIds } = await projectScope(user.id);
  return projectRepository.getForUser(id, user.id, companyIds);
}

export async function createProject(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const v = validate(projectFormSchema, input);
  if (!v.success) return v.result;
  const { writableCompanyIds } = await projectScope(user.id);
  const companyId = writableCompanyIds.length === 1 ? writableCompanyIds[0] : null;
  try {
    const project = await projectRepository.create({
      title: v.data.title,
      description: v.data.description || null,
      objectName: v.data.objectName || null,
      region: v.data.region || null,
      deadline: v.data.deadline ? new Date(v.data.deadline) : null,
      owner: { connect: { id: user.id } },
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
    });
    revalidate();
    return ok({ id: project.id });
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateProject(id: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(projectFormSchema, input);
  if (!v.success) return v.result;
  const { writableCompanyIds } = await projectScope(user.id);
  try {
    await projectRepository.updateForUser(id, user.id, writableCompanyIds, {
      title: v.data.title,
      description: v.data.description || null,
      objectName: v.data.objectName || null,
      region: v.data.region || null,
      deadline: v.data.deadline ? new Date(v.data.deadline) : null,
    });
    revalidate(id);
    return ok();
  } catch (e) {
    return handleAccessError(e);
  }
}

export async function setProjectStatus(id: string, status: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = projectStatus.safeParse(status);
  if (!parsed.success) return fail("Некорректный статус");
  const { writableCompanyIds } = await projectScope(user.id);
  try {
    await projectRepository.updateForUser(id, user.id, writableCompanyIds, { status: parsed.data });
    revalidate(id);
    return ok();
  } catch (e) {
    return handleAccessError(e);
  }
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const { writableCompanyIds } = await projectScope(user.id);
  try {
    await projectRepository.removeForUser(id, user.id, writableCompanyIds);
    revalidate();
    return ok();
  } catch (e) {
    return handleAccessError(e);
  }
}

export async function addProjectItem(projectId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const v = validate(projectItemInputSchema, input);
  if (!v.success) return v.result;
  const { writableCompanyIds } = await projectScope(user.id);
  try {
    await projectRepository.addItem(projectId, user.id, writableCompanyIds, {
      productId: v.data.productId || null,
      slug: v.data.slug || null,
      sku: v.data.sku || null,
      title: v.data.title,
      qty: v.data.qty,
      unit: v.data.unit || "шт",
      amountTiyn: v.data.priceTenge != null ? tengeToTiyn(v.data.priceTenge) : null,
      note: v.data.note || null,
    });
    revalidate(projectId);
    return ok();
  } catch (e) {
    return handleAccessError(e);
  }
}

export async function updateProjectItemQty(
  projectId: string,
  itemId: string,
  qty: number
): Promise<ActionResult> {
  const user = await requireUser();
  if (!(qty > 0)) return fail("Количество должно быть больше нуля");
  const { writableCompanyIds } = await projectScope(user.id);
  try {
    await projectRepository.updateItemQty(projectId, itemId, user.id, writableCompanyIds, qty);
    revalidate(projectId);
    return ok();
  } catch (e) {
    return handleAccessError(e);
  }
}

export async function removeProjectItem(projectId: string, itemId: string): Promise<ActionResult> {
  const user = await requireUser();
  const { writableCompanyIds } = await projectScope(user.id);
  try {
    await projectRepository.removeItem(projectId, itemId, user.id, writableCompanyIds);
    revalidate(projectId);
    return ok();
  } catch (e) {
    return handleAccessError(e);
  }
}

/** "Сохранить как проект" from the client-side cart — persists the current cart items as a new named Project. */
export async function saveCartAsProject(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const v = validate(saveCartAsProjectSchema, input);
  if (!v.success) return v.result;
  const { writableCompanyIds } = await projectScope(user.id);
  const companyId = writableCompanyIds.length === 1 ? writableCompanyIds[0] : null;
  try {
    const project = await projectRepository.create({
      title: v.data.title,
      owner: { connect: { id: user.id } },
      ...(companyId ? { company: { connect: { id: companyId } } } : {}),
      items: {
        create: v.data.items.map((i, index) => ({
          productId: i.productId,
          slug: i.slug || null,
          sku: i.sku || null,
          title: i.title,
          qty: i.qty,
          unit: i.unit,
          amountTiyn: i.priceTenge !== null ? tengeToTiyn(i.priceTenge) : null,
          note: i.note || null,
          order: index,
        })),
      },
    });
    revalidate();
    return ok({ id: project.id });
  } catch (e) {
    return fail(prismaError(e));
  }
}
