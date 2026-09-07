import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { logger } from "@/lib/logger";

import { prisma } from "@/lib/prisma";

/**
 * Auth scaffold. Credentials provider is included as a starting point for the
 * B2B customer cabinet — add OAuth providers as needed.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "E-mail",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) return null;
        const valid = await compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  events: {
    // Written directly rather than through server/audit.ts's audit() helper:
    // that helper resolves the actor via getServerSession(), which isn't
    // reliably populated yet at the exact moment these events fire — the
    // identity is already right here in the event payload.
    async signIn({ user }) {
      logger.info("auth.login", { userId: user.id, email: user.email });
      try {
        await prisma.auditLog.create({
          data: {
            action: "LOGIN",
            entity: "User",
            entityId: user.id ?? null,
            summary: `Вход: ${user.email}`,
            actorId: user.id ?? null,
            actorEmail: user.email ?? null,
          },
        });
      } catch (e) {
        logger.error("audit.failed", { error: String(e), action: "LOGIN" });
      }
    },
    async signOut({ token }) {
      logger.info("auth.logout", { userId: token?.sub });
      try {
        await prisma.auditLog.create({
          data: {
            action: "LOGOUT",
            entity: "User",
            entityId: token?.sub ?? null,
            summary: `Выход: ${token?.email ?? token?.sub ?? "unknown"}`,
            actorId: token?.sub ?? null,
            actorEmail: (token?.email as string | undefined) ?? null,
          },
        });
      } catch (e) {
        logger.error("audit.failed", { error: String(e), action: "LOGOUT" });
      }
    },
  },
};
