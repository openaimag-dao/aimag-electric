import "server-only";

import { currentUser, isStaff, type SessionUser } from "@/server/auth/session";

/** Role hierarchy for coarse checks. */
export type Role = "ADMIN" | "MANAGER" | "CUSTOMER";

export class AuthorizationError extends Error {
  constructor(message = "Недостаточно прав") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Требуется вход") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/** Throws if not signed in; returns the user otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

/** Throws unless the user is staff (ADMIN or MANAGER). */
export async function requireStaff(): Promise<SessionUser> {
  const user = await requireUser();
  if (!isStaff(user.role)) throw new AuthorizationError();
  return user;
}

/** Throws unless the user is ADMIN. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthorizationError();
  return user;
}

/** Non-throwing guard for conditional UI. */
export async function canAccessAdmin(): Promise<boolean> {
  const user = await currentUser();
  return Boolean(user && isStaff(user.role));
}
