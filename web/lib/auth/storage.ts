import type { AuthUser } from "./types";

export const ACCESS_TOKEN_KEY = "rentora_access_token";
export const REFRESH_TOKEN_KEY = "rentora_refresh_token";
export const AUTH_USER_KEY = "rentora_auth_user";

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
}

export function getAccessToken(): string | null {
  return getStoredValue(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const rawUser = getStoredValue(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  removeSessionFrom(window.localStorage);
  removeSessionFrom(window.sessionStorage);
}
