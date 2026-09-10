import { API_BASE_URL } from "@/lib/api/config";
import type { AuthUser } from "./types";
import { clearAuthSession, removeLegacyCredentials, saveAuthSession } from "./storage";

let pendingVerification: Promise<AuthUser | null> | null = null;

async function verifySession(): Promise<AuthUser | null> {
  removeLegacyCredentials();
  const response = await fetch(`${API_BASE_URL}/auth/me`, { cache: "no-store", credentials: "same-origin" });
  if (response.status === 401) { clearAuthSession(); return null; }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.user) throw new Error(data?.message || "Unable to verify your session. Please retry.");
  saveAuthSession({ user: data.user });
  return data.user;
}

export function verifyStoredAuthSession(): Promise<AuthUser | null> {
  if (!pendingVerification) pendingVerification = verifySession().finally(() => { pendingVerification = null; });
  return pendingVerification;
}

export async function signOutSession() {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST", credentials: "same-origin", headers: { "X-Rentora-Request": "1" },
  });
  if (!response.ok) throw new Error("Unable to sign out. Please retry.");
  clearAuthSession();
  window.location.assign("/login");
}
