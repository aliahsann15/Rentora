import { API_BASE_URL } from "@/lib/api/config";
import {
  clearAuthSession,
  getRefreshToken,
  updateAccessToken,
} from "@/lib/auth/storage";

type RefreshResponse = {
  accessToken?: string;
};

let pendingRefresh: Promise<string | null> | null = null;

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      body: JSON.stringify({ refreshToken }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const data = await readJson<RefreshResponse>(response);

    if (!response.ok || !data?.accessToken) {
      clearAuthSession();
      return null;
    }

    updateAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

export function refreshStoredAccessToken(): Promise<string | null> {
  if (!pendingRefresh) {
    pendingRefresh = refreshAccessToken().finally(() => {
      pendingRefresh = null;
    });
  }

  return pendingRefresh;
}
