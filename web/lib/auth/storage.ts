import type { AuthUser } from "./types";

export const ACCESS_TOKEN_KEY = "rentora_access_token";
export const REFRESH_TOKEN_KEY = "rentora_refresh_token";
export const AUTH_USER_KEY = "rentora_auth_user";

export function saveAuthSession({
  accessToken,
  refreshToken,
  user,
}: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}
