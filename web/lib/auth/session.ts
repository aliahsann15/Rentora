import { API_BASE_URL } from "@/lib/api/config";
import type { AuthUser } from "@/lib/auth/types";
import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
  updateAuthUserSession,
} from "@/lib/auth/storage";
import { refreshStoredAccessToken } from "@/lib/auth/refresh";

type MeResponse = {
  user?: AuthUser;
};

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

async function fetchCurrentUser(accessToken: string): Promise<AuthUser | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await readJson<MeResponse>(response);

  return response.ok ? data?.user || null : null;
}

export async function verifyStoredAuthSession(): Promise<AuthUser | null> {
  const accessToken = getAccessToken();
  const cachedUser = getAuthUser();

  if (!accessToken || !cachedUser) {
    clearAuthSession();
    return null;
  }

  try {
    let user = await fetchCurrentUser(accessToken);

    if (!user) {
      const refreshedAccessToken = await refreshStoredAccessToken();

      if (!refreshedAccessToken) {
        clearAuthSession();
        return null;
      }

      user = await fetchCurrentUser(refreshedAccessToken);
    }

    if (!user) {
      clearAuthSession();
      return null;
    }

    updateAuthUserSession(user);
    return user;
  } catch {
    clearAuthSession();
    return null;
  }
}
