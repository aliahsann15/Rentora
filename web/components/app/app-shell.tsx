"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { clearAuthSession, getAuthUserSnapshot, subscribeToAuthUserChanges } from "@/lib/auth/storage";
import { verifyStoredAuthSession } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";
import { Sidebar } from "./sidebar";
import { ToastProvider } from "./toast-provider";
import { Topbar } from "./topbar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const userSnapshot = useSyncExternalStore(subscribeToAuthUserChanges, getAuthUserSnapshot, () => null);
  const [hasVerifiedSession, setHasVerifiedSession] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = useMemo<AuthUser | null>(() => {
    if (!userSnapshot) {
      return null;
    }

    try {
      return JSON.parse(userSnapshot) as AuthUser;
    } catch {
      return null;
    }
  }, [userSnapshot]);

  const signOut = () => {
    clearAuthSession();
    window.location.assign("/login");
  };

  useEffect(() => {
    let isActive = true;

    async function verifySession() {
      const verifiedUser = await verifyStoredAuthSession();

      if (!isActive) {
        return;
      }

      if (!verifiedUser) {
        window.location.replace("/login");
        return;
      }

      setHasVerifiedSession(true);
    }

    void verifySession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (hasVerifiedSession && !user) {
      window.location.replace("/login");
    }
  }, [hasVerifiedSession, user]);

  if (!hasVerifiedSession || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <ToastProvider />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onSignOut={signOut} />

      <div className="lg:pl-20">
        <Topbar onOpenSidebar={() => setIsSidebarOpen(true)} user={user} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
