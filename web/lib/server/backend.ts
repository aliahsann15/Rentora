import "server-only";
import { isIP } from "node:net";

// Enable only for a header overwritten by a trusted ingress that cannot be bypassed.
export function clientAddressHeaders(request: Request): Record<string, string> {
  const header = process.env.BFF_CLIENT_IP_HEADER;
  const address = header ? request.headers.get(header)?.trim() : undefined;
  return address && isIP(address) ? { "X-Forwarded-For": address } : {};
}

export function backendUrl(path: string) {
  const configured = process.env.BACKEND_API_URL || "http://localhost:5000/api";
  const base = new URL(configured.replace(/\/$/, "") + "/");
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error("Invalid BACKEND_API_URL");
  }
  return new URL(path, base);
}

export function fetchBackend(path: string, init: RequestInit = {}) {
  return fetch(backendUrl(path), {
    ...init, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(30_000),
  });
}
