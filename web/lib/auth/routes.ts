import type { UserRole } from "./types";

export function getPostLoginPath(_role: UserRole) {
  void _role;
  return "/app/dashboard";
}
