import {
  Cable,
  Zap,
  Shield,
  Link2,
  Combine,
  ToggleRight,
  Factory,
  Package,
  type LucideIcon,
} from "lucide-react";

/**
 * Maps the icon *name* stored on Category (a string, DB-safe) to a Lucide
 * component. Keeps icons out of the data layer so category records can cross
 * the server/client boundary and live in Postgres.
 */
const ICONS: Record<string, LucideIcon> = {
  Cable,
  Zap,
  Shield,
  Link2,
  Combine,
  ToggleRight,
  Factory,
};

export function resolveCategoryIcon(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || Package;
}
