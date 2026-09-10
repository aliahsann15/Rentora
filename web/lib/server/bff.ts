import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { clientAddressHeaders, fetchBackend } from "./backend";
import { createSession, readSession, sessionCookieName, writeSession, type WebSession } from "./session";

const routes: [RegExp, string[]][] = [
  [/^auth\/(login|register|forgot-password|reset-password|logout|change-password)$/, ["POST"]],
  [/^auth\/(me|profile|me-assignment)$/, ["GET"]],
  [/^auth\/profile$/, ["PATCH"]],
  [/^auth\/account$/, ["DELETE"]],
  [/^invites\/validate\/[^/]+$/, ["GET"]],
  [/^invites\/accept$/, ["POST"]],
  [/^invites$/, ["GET", "POST"]],
  [/^(properties|units|vendors|requests)$/, ["GET", "POST"]],
  [/^(properties|users|requests)\/[a-f0-9]{24}$/i, ["GET", "DELETE"]],
  [/^(properties|units|vendors|users)\/[a-f0-9]{24}$/i, ["PATCH", "DELETE"]],
  [/^users$/, ["GET"]],
  [/^users\/tenant$/, ["POST"]],
  [/^requests\/[a-f0-9]{24}\/(status|images|assign|verify)$/i, ["PATCH"]],
  [/^organizations\/me$/, ["GET"]],
  [/^organizations$/, ["PATCH"]],
  [/^notifications$/, ["GET"]],
  [/^notifications\/register-token$/, ["POST"]],
  [/^notifications\/[a-f0-9]{24}\/read$/i, ["PATCH"]],
  [/^subscriptions\/status$/, ["GET"]],
  [/^subscriptions\/create-checkout$/, ["POST"]],
  [/^vendor-services\/me$/, ["GET", "PUT", "POST"]],
  [/^vendor-services\/me\/[^/]+$/, ["DELETE"]],
];
const publicRoutes = new Set([
  "auth/login", "auth/register", "auth/forgot-password", "auth/reset-password", "invites/accept",
]);
const authenticationRoutes = new Set(["auth/login", "auth/register", "invites/accept"]);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", "Vary": "Cookie" } });
}

// Never relay debug errors or credentials in upstream JSON to the browser.
function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).filter(([key]) =>
      !["accessToken", "refreshToken", "passwordHash", "error", "stack"].includes(key)
    ).map(([key, entry]) => [key, sanitize(entry)]));
  }
  return value;
}

async function readBody(request: NextRequest): Promise<ArrayBuffer | undefined> {
  if (["GET", "HEAD"].includes(request.method)) return undefined;
  const limit = 3 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > limit) throw new RangeError("Request too large");
  const reader = request.body?.getReader();
  if (!reader) return undefined;
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > limit) { await reader.cancel(); throw new RangeError("Request too large"); }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body.buffer;
}

const refreshes = new Map<string, Promise<Response>>();
async function refresh(session: WebSession, clientHeaders: Record<string, string>) {
  let pending = refreshes.get(session.refreshToken);
  if (!pending) {
    pending = fetchBackend("auth/refresh", {
      method: "POST", headers: { ...clientHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });
    refreshes.set(session.refreshToken, pending);
  }
  try { return (await pending).clone(); }
  finally { if (refreshes.get(session.refreshToken) === pending) refreshes.delete(session.refreshToken); }
}

export async function handleApi(request: NextRequest, segments: string[]) {
  if (segments.some((segment) => !segment || /[\\/.%?#\x00-\x1f]/.test(segment))) {
    return json({ message: "Invalid API path" }, 400);
  }
  const path = segments.join("/");
  if (!routes.some(([pattern, methods]) => pattern.test(path) && methods.includes(request.method))) {
    return json({ message: "API route not found" }, 404);
  }
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = process.env.APP_ORIGIN || request.nextUrl.origin;
    if (request.headers.get("origin") !== origin || request.headers.get("x-rentora-request") !== "1" ||
        request.headers.get("sec-fetch-site") === "cross-site") {
      return json({ message: "Invalid request origin" }, 403);
    }
  }

  try {
    const clientHeaders = clientAddressHeaders(request);
    let session = readSession(request.cookies.get(sessionCookieName)?.value);
    if (path === "auth/logout") {
      if (session) {
        const upstream = await fetchBackend("auth/logout", {
          method: "POST", headers: { ...clientHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        if (!upstream.ok && upstream.status !== 401) return json({ message: "Unable to sign out. Please retry." }, 502);
      }
      const response = json({ message: "Signed out" });
      writeSession(response, null);
      return response;
    }

    const isPublic = publicRoutes.has(path) || path.startsWith("invites/validate/");
    if (!isPublic && !session) {
      const response = json({ message: "Please sign in again." }, 401);
      writeSession(response, null);
      return response;
    }

    let body = await readBody(request);
    let persistent = true;
    if (authenticationRoutes.has(path)) {
      const payload = JSON.parse(new TextDecoder().decode(body));
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return json({ message: "Invalid request body." }, 400);
      }
      persistent = payload.rememberMe !== false;
      delete payload.rememberMe;
      body = new TextEncoder().encode(JSON.stringify(payload)).buffer;
    }
    const send = (token?: string) => fetchBackend(path + request.nextUrl.search, {
      method: request.method,
      body,
      headers: {
        ...clientHeaders,
        ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type")! } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    let upstream = await send(isPublic ? undefined : session?.accessToken);
    let renewed = false;
    if (upstream.status === 401 && !isPublic && session) {
      const refreshed = await refresh(session, clientHeaders);
      if (refreshed.status === 401) {
        const response = json({ message: "Your session expired. Please sign in again." }, 401);
        writeSession(response, null);
        return response;
      }
      if (!refreshed.ok) return json({ message: "Unable to renew session. Please retry." }, 503);
      const result = await refreshed.json();
      if (typeof result.accessToken !== "string") throw new Error("Invalid refresh response");
      session = { ...session, accessToken: result.accessToken };
      renewed = true;
      upstream = await send(session.accessToken);
    }
    if (upstream.status === 204) {
      const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store", "Vary": "Cookie" } });
      if (path === "auth/account") writeSession(response, null);
      else if (renewed && session) writeSession(response, session);
      return response;
    }
    const data = await upstream.json().catch(() => null);
    if (!data || (upstream.status >= 300 && upstream.status < 400)) throw new Error("Invalid upstream response");
    if (authenticationRoutes.has(path) && upstream.ok) {
      if (!data.user || typeof data.accessToken !== "string" || typeof data.refreshToken !== "string") {
        throw new Error("Incomplete authentication response");
      }
      session = createSession(data.accessToken, data.refreshToken, persistent);
      renewed = true;
    }
    const response = json(sanitize(data), upstream.status);
    if ((!isPublic && upstream.status === 401) || (path === "auth/account" && upstream.ok)) {
      writeSession(response, null);
    } else if (renewed && session) writeSession(response, session);
    return response;
  } catch (error) {
    if (error instanceof RangeError) return json({ message: "Upload exceeds the size limit." }, 413);
    if (error instanceof SyntaxError) return json({ message: "Invalid request body." }, 400);
    return json({ message: "The service is temporarily unavailable. Please retry." }, 503);
  }
}
