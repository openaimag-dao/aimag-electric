import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderTree,
  Factory,
  Package,
  Tag,
  Warehouse,
  FileText,
  Users,
  Inbox,
  Upload,
  Contact,
  KanbanSquare,
  SlidersHorizontal,
  ListChecks,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Точное совпадение пути (для Dashboard), иначе — по префиксу. */
  exact?: boolean;
}

export const adminNav: AdminNavItem[] = [
  { label: "Дашборд", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Категории", href: "/admin/categories", icon: FolderTree },
  { label: "Производители", href: "/admin/brands", icon: Factory },
  { label: "Товары", href: "/admin/products", icon: Package },
  { label: "Характеристики", href: "/admin/attributes", icon: SlidersHorizontal },
  { label: "Значения характеристик", href: "/admin/attribute-values", icon: ListChecks },
  { label: "Цены", href: "/admin/prices", icon: Tag },
  { label: "Склады", href: "/admin/warehouses", icon: Warehouse },
  { label: "Документы", href: "/admin/documents", icon: FileText },
  { label: "Пользователи", href: "/admin/users", icon: Users },
  { label: "Заявки", href: "/admin/quotes", icon: Inbox },
  { label: "CRM: клиенты", href: "/admin/crm/customers", icon: Contact },
  { label: "CRM: сделки", href: "/admin/crm/deals", icon: KanbanSquare },
  { label: "Импорт", href: "/admin/import", icon: Upload },
];
