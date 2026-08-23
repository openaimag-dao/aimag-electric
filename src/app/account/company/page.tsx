import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { currentUser } from "@/server/auth/session";
import { companyAdminRepository } from "@/server/repositories/admin";
import { getMyCompanyTeam } from "@/server/actions/company-team-actions";
import { CompanyTeamPanel, type TeamMemberRow } from "@/components/account/company-team-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Компания",
  robots: { index: false, follow: false },
};

export default async function CompanyTeamPage() {
  const user = await currentUser();
  if (!user) return null;

  const membership = await companyAdminRepository.forUser(user.id);
  if (!membership) {
    return (
      <div>
        <Link
          href="/account"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> В кабинет
        </Link>
        <p className="text-sm text-muted-foreground">Вы не состоите ни в одной компании.</p>
      </div>
    );
  }

  const data = await getMyCompanyTeam(membership.companyId);
  if (!data) return null;

  const members: TeamMemberRow[] = data.company.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    user: { name: m.user.name, email: m.user.email },
  }));

  return (
    <div>
      <Link
        href="/account"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> В кабинет
      </Link>
      <h1 className="mb-1 font-display text-2xl font-bold text-primary">{data.company.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Сотрудники с доступом в личный кабинет компании.
      </p>
      <CompanyTeamPanel
        companyId={membership.companyId}
        initialMembers={members}
        canManage={data.myRole === "COMPANY_ADMIN"}
        currentUserId={user.id}
      />
    </div>
  );
}
