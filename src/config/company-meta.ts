/** Display metadata for CompanyRole: labels + badge styles + a short permission summary. */

export const companyRoleMeta: Record<string, { label: string; className: string; hint: string }> = {
  COMPANY_ADMIN: {
    label: "Администратор компании",
    className: "bg-signal/10 text-signal-700",
    hint: "Управляет сотрудниками компании",
  },
  PROCUREMENT: {
    label: "Снабжение",
    className: "bg-blue-50 text-blue-700",
    hint: "Может запрашивать КП",
  },
  ENGINEER: {
    label: "Инженер",
    className: "bg-indigo-50 text-indigo-700",
    hint: "Может создавать проекты",
  },
  VIEWER: {
    label: "Наблюдатель",
    className: "bg-secondary text-muted-foreground",
    hint: "Только просмотр",
  },
};

export const companyRoleOrder = ["COMPANY_ADMIN", "PROCUREMENT", "ENGINEER", "VIEWER"] as const;
