import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export type WebSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  persistent: boolean;
};

export const sessionCookieName = process.env.NODE_ENV === "production"
  ? "__Host-rentora-session" : "rentora-session";

function encryptionKey() {
  const secret = process.env.BFF_SESSION_SECRET || "";
  if (!/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error("BFF_SESSION_SECRET must contain 32 random bytes encoded as hex");
  }
  return Buffer.from(secret, "hex");
}

export function sealSession(session: WebSession): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function readSession(value?: string): WebSession | null {
  const key = encryptionKey();
  if (!value) return null;
  try {
    const buffer = Buffer.from(value, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    const session = JSON.parse(Buffer.concat([
      decipher.update(buffer.subarray(28)), decipher.final(),
    ]).toString("utf8")) as WebSession;
    if (typeof session.accessToken !== "string" || typeof session.refreshToken !== "string" ||
        typeof session.persistent !== "boolean" || !Number.isFinite(session.expiresAt) ||
        session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

// Only read expiry from tokens received directly from our trusted API, never browser input.
export function createSession(accessToken: string, refreshToken: string, persistent: boolean): WebSession {
  const { exp } = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64url").toString("utf8"));
  if (typeof exp !== "number" || exp * 1000 <= Date.now()) throw new Error("Invalid refresh expiry");
  return { accessToken, refreshToken, persistent, expiresAt: Math.min(exp * 1000, Date.now() + 30 * 86400_000) };
}

export function writeSession(response: NextResponse, session: WebSession | null) {
  response.cookies.set(sessionCookieName, session ? sealSession(session) : "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(session ? (session.persistent ? { expires: new Date(session.expiresAt) } : {}) : { maxAge: 0 }),
  });
}
