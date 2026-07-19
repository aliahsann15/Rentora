import type { UserRole } from "./types";

export function getPostLoginPath(role: UserRole) {
  if (role === "TENANT") {
    return "/app/my-requests";
  }

  if (role === "VENDOR") {
    return "/app/assigned-requests";
  }

  return "/app/dashboard";
}
