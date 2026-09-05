import { AdminPageHeader } from "@/components/admin/page-header";
import { PostsManager, type PostListRow } from "@/components/admin/posts/posts-manager";
import { postAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const rows = await postAdminRepository.list();
  const data: PostListRow[] = rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    readingTime: p.readingTime,
    published: p.published,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Блог"
        description="Статьи для /blog и блока «Экспертиза и разборы» на главной."
      />
      <PostsManager rows={data} />
    </div>
  );
}
