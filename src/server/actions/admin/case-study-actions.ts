"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { caseStudyAdminRepository } from "@/server/repositories/admin";
import { caseStudyFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { CACHE_TAGS } from "@/lib/cache-tags";

function revalidate() {
  revalidatePath("/admin/case-studies");
  revalidatePath("/projects");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.caseStudies);
}

function toData(d: ReturnType<typeof caseStudyFormSchema.parse>) {
  return {
    slug: d.slug,
    title: d.title,
    scope: d.scope,
    description: d.description || null,
    location: d.location,
    year: d.year,
    metric: d.metric,
    metricLabel: d.metricLabel,
    category: d.category,
    order: d.order,
    published: d.published,
  };
}

export async function createCaseStudy(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(caseStudyFormSchema, input);
  if (!v.success) return v.result;
  try {
    await caseStudyAdminRepository.create(toData(v.data));
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updateCaseStudy(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(caseStudyFormSchema, input);
  if (!v.success) return v.result;
  try {
    await caseStudyAdminRepository.update(id, toData(v.data));
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deleteCaseStudy(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await caseStudyAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
