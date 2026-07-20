import type { AuthUser } from "./types";

export const ACCESS_TOKEN_KEY = "rentora_access_token";
export const REFRESH_TOKEN_KEY = "rentora_refresh_token";
export const AUTH_USER_KEY = "rentora_auth_user";
export const AUTH_USER_CHANGED_EVENT = "rentora-auth-user-changed";

type AuthStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function getStorage(rememberMe: boolean): AuthStorage {
  return rememberMe ? window.localStorage : window.sessionStorage;
}

function removeSessionFrom(storage: AuthStorage) {
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(AUTH_USER_KEY);
}

function getStoredValue(key: string): string | null {
  return window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
}

function getSessionStorageForKey(key: string): AuthStorage | null {
  if (window.localStorage.getItem(key)) {
    return window.localStorage;
  }

  if (window.sessionStorage.getItem(key)) {
    return window.sessionStorage;
  }

  return null;
}

function notifyAuthUserChanged() {
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}

export function saveAuthSession({
  accessToken,
  rememberMe = true,
  refreshToken,
  user,
}: {
  accessToken: string;
  rememberMe?: boolean;
  refreshToken: string;
  user: AuthUser;
}) {
  removeSessionFrom(window.localStorage);
  removeSessionFrom(window.sessionStorage);

  const storage = getStorage(rememberMe);
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifyAuthUserChanged();
}

export function getAccessToken(): string | null {
  return getStoredValue(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getStoredValue(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const rawUser = getAuthUserSnapshot();

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function getAuthUserSnapshot(): string | null {
  return getStoredValue(AUTH_USER_KEY);
}

export function subscribeToAuthUserChanges(onStoreChange: () => void) {
  const handleStorageChange = (event: StorageEvent) => {
    if ([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, AUTH_USER_KEY].includes(event.key || "")) {
      onStoreChange();
    }
  };

  window.addEventListener(AUTH_USER_CHANGED_EVENT, onStoreChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(AUTH_USER_CHANGED_EVENT, onStoreChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

export function updateAuthUserSession(updates: Partial<AuthUser>) {
  const currentUser = getAuthUser();
  const storage = getSessionStorageForKey(AUTH_USER_KEY);

  if (!currentUser || !storage) {
    return;
  }

  storage.setItem(AUTH_USER_KEY, JSON.stringify({ ...currentUser, ...updates }));
  notifyAuthUserChanged();
}

export function clearAuthSession() {
  removeSessionFrom(window.localStorage);
  removeSessionFrom(window.sessionStorage);
  notifyAuthUserChanged();
}
