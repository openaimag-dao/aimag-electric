import "server-only";

import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth/options";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
}

/** Returns the current session (or null) on the server. */
export function auth() {
  return getServerSession(authOptions);
}

/** Returns the current user with role, or null if not signed in. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as { id?: string; email?: string; name?: string | null; role?: string };
  return {
    id: u.id ?? "",
    email: u.email ?? "",
    name: u.name,
    role: u.role ?? "CUSTOMER",
  };
}

/** True if the user holds a staff role (admin or manager). */
export function isStaff(role: string | undefined): boolean {
  return role === "ADMIN" || role === "MANAGER";
}
