"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { postAdminRepository } from "@/server/repositories/admin";
import { postFormSchema } from "@/lib/validations/admin";
import { ok, fail, validate, prismaError, type ActionResult } from "@/server/actions/action-result";
import { requireStaff } from "@/lib/security/rbac";
import { CACHE_TAGS } from "@/lib/cache-tags";

function revalidate() {
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath("/");
  revalidateTag(CACHE_TAGS.posts);
}

function toData(d: ReturnType<typeof postFormSchema.parse>) {
  return {
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt,
    content: d.content,
    category: d.category,
    readingTime: d.readingTime,
    published: d.published,
  };
}

export async function createPost(input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(postFormSchema, input);
  if (!v.success) return v.result;
  try {
    await postAdminRepository.create(toData(v.data));
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function updatePost(id: string, input: unknown): Promise<ActionResult> {
  await requireStaff();
  const v = validate(postFormSchema, input);
  if (!v.success) return v.result;
  try {
    await postAdminRepository.update(id, toData(v.data));
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}

export async function deletePost(id: string): Promise<ActionResult> {
  await requireStaff();
  try {
    await postAdminRepository.remove(id);
    revalidate();
    return ok();
  } catch (e) {
    return fail(prismaError(e));
  }
}
