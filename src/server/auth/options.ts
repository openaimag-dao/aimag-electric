import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { logger } from "@/lib/logger";

import { prisma } from "@/lib/prisma";

/**
 * Auth scaffold. Credentials provider is included as a starting point for the
 * B2B customer cabinet; swap the password check for a real hash comparison
 * (e.g. bcrypt) before production, and add OAuth providers as needed.
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
    async signIn({ user }) {
      logger.info("auth.login", { userId: user.id, email: user.email });
    },
    async signOut({ token }) {
      logger.info("auth.logout", { userId: token?.sub });
    },
  },
};
