"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { User, LogIn } from "lucide-react";

/** Header affordance: "Кабинет" when signed in, otherwise "Вход". */
export function AccountLink() {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-steel-700 transition-colors hover:text-signal-700"
    >
      {signedIn ? <User className="size-4" /> : <LogIn className="size-4" />}
      <span className="hidden sm:inline">{signedIn ? "Кабинет" : "Вход"}</span>
    </Link>
  );
}
