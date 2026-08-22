import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Hash, Building2 } from "lucide-react";

import { companyAdminRepository, userAdminRepository } from "@/server/repositories/admin";
import {
  CompanyMembersPanel,
  type CompanyMemberRow,
} from "@/components/admin/companies/company-members-panel";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [company, users] = await Promise.all([
    companyAdminRepository.byId(id),
    userAdminRepository.list(),
  ]);
  if (!company) notFound();

  const members: CompanyMemberRow[] = company.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    user: { name: m.user.name, email: m.user.email },
  }));

  return (
    <div className="space-y-6">
      <Link
        href="/admin/companies"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> К списку компаний
      </Link>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-primary">{company.name}</h1>
        </div>
        <div className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-2">
          {company.bin && (
            <span className="flex items-center gap-1.5">
              <Hash className="size-4" /> БИН {company.bin}
            </span>
          )}
          {company.phone && (
            <a
              href={`tel:${company.phone}`}
              className="flex items-center gap-1.5 hover:text-signal-700"
            >
              <Phone className="size-4" /> {company.phone}
            </a>
          )}
          {company.email && (
            <a
              href={`mailto:${company.email}`}
              className="flex items-center gap-1.5 hover:text-signal-700"
            >
              <Mail className="size-4" /> {company.email}
            </a>
          )}
          {company.legalAddress && (
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> Юр. адрес: {company.legalAddress}
            </span>
          )}
          {company.actualAddress && (
            <span className="flex items-center gap-1.5">
              <Building2 className="size-4" /> Факт. адрес: {company.actualAddress}
            </span>
          )}
        </div>
        {company.notes && (
          <p className="mt-4 rounded-lg border border-border bg-secondary/40 p-3 text-sm text-primary">
            {company.notes}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-primary">
          Сотрудники с доступом в личный кабинет
        </h2>
        <CompanyMembersPanel
          companyId={company.id}
          initialMembers={members}
          users={users.map((u) => ({
            id: u.id,
            label: u.name ? `${u.name} (${u.email})` : u.email,
          }))}
        />
      </div>
    </div>
  );
}
