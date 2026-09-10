"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getAuthUserSnapshot, subscribeToAuthUserChanges } from "@/lib/auth/storage";
import { signOutSession, verifyStoredAuthSession } from "@/lib/auth/session";
import { Button } from "@/components/ui";
import { showToast } from "@/lib/ui/toast";
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
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState(0);
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

  const signOut = async () => {
    try { await signOutSession(); }
    catch { showToast({ message: "Unable to sign out. Please retry.", tone: "error" }); }
  };

  useEffect(() => {
    let isActive = true;

    async function verifySession() {
      try {
        const verifiedUser = await verifyStoredAuthSession();

        if (!isActive) {
          return;
        }

        if (!verifiedUser) {
          window.location.replace("/login");
          return;
        }

        setHasVerifiedSession(true);
        setSessionError(null);
      } catch (error) {
        if (isActive) setSessionError(error instanceof Error ? error.message : "Unable to verify session.");
      }
    }

    void verifySession();
    const onFocus = () => { void verifySession(); };
    window.addEventListener("focus", onFocus);

    return () => {
      isActive = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [verificationAttempt]);

  useEffect(() => {
    if (hasVerifiedSession && !user) {
      window.location.replace("/login");
    }
  }, [hasVerifiedSession, user]);

  if (!hasVerifiedSession || !user) {
    if (sessionError) return (
      <div className="grid min-h-screen place-content-center gap-4 p-6 text-center">
        <p role="alert">{sessionError}</p>
        <Button onClick={() => setVerificationAttempt((attempt) => attempt + 1)}>Retry</Button>
      </div>
    );
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
