"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { clearAuthSession, getAuthUser } from "@/lib/auth/storage";
import type { AuthUser } from "@/lib/auth/types";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const [user] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getAuthUser();
  });

  const signOut = () => {
    clearAuthSession();
    window.location.assign("/");
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Sidebar onSignOut={signOut} />

      <div className="lg:pl-20">
        <Topbar user={user} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
