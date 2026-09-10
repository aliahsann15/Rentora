import type { AuthUser } from "./types";

export const AUTH_USER_CHANGED_EVENT = "rentora-auth-user-changed";
let userSnapshot: string | null = null;

// This cache drives rendering only. The BFF cookie is the sole session credential.
export function saveAuthSession({ user }: { user: AuthUser }) {
  removeLegacyCredentials();
  userSnapshot = JSON.stringify(user);
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}

export function removeLegacyCredentials() {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try {
      for (const key of ["rentora_access_token", "rentora_refresh_token", "rentora_auth_user"]) {
        window[name].removeItem(key);
      }
    } catch { /* Storage may be disabled; cookie sessions still work. */ }
  }
}

export function getAuthUser(): AuthUser | null {
  return userSnapshot ? JSON.parse(userSnapshot) as AuthUser : null;
}

export function getAuthUserSnapshot(): string | null { return userSnapshot; }

export function subscribeToAuthUserChanges(onStoreChange: () => void) {
  window.addEventListener(AUTH_USER_CHANGED_EVENT, onStoreChange);
  return () => window.removeEventListener(AUTH_USER_CHANGED_EVENT, onStoreChange);
}

export function updateAuthUserSession(updates: Partial<AuthUser>) {
  const user = getAuthUser();
  if (user) saveAuthSession({ user: { ...user, ...updates } });
}

export function clearAuthSession() {
  removeLegacyCredentials();
  userSnapshot = null;
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}
