import { AdminPageHeader } from "@/components/admin/page-header";
import { UsersManager, type UserListRow } from "@/components/admin/users/users-manager";
import { userAdminRepository } from "@/server/repositories/admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const rows = await userAdminRepository.list();
  const data: UserListRow[] = rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    company: u.company,
    phone: u.phone,
    quoteCount: u._count?.quotes ?? 0,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Пользователи"
        description="Учётные записи клиентов, менеджеров и администраторов."
      />
      <UsersManager rows={data} />
    </div>
  );
}
