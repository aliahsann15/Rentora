import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { NextRequest } = require("next/server");
const cache = new Map();
// Exercise the actual server modules with only the network replaced, without a test framework dependency.
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const loadedModule = new Module(filename);
  cache.set(filename, loadedModule);
  loadedModule.require = (id) => {
    if (id === "server-only") return {};
    if (id.startsWith("@/")) return load(id.slice(2) + ".ts");
    if (id.startsWith(".")) return load(path.resolve(path.dirname(filename), id + ".ts"));
    return require(id);
  };
  loadedModule._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  return loadedModule.exports;
}

process.env.BFF_SESSION_SECRET = "a".repeat(64);
process.env.BACKEND_API_URL = "http://backend.internal/api";
process.env.APP_ORIGIN = "http://localhost:3000";
const { handleApi } = load("lib/server/bff.ts");
const { sealSession, readSession, sessionCookieName, createSession } = load("lib/server/session.ts");
const { GET: getMedia } = load("app/media/[...path]/route.ts");
const { clientAddressHeaders } = load("lib/server/backend.ts");
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const user = { _id: "a".repeat(24), name: "Test user", role: "LANDLORD" };
const refreshToken = `header.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.signature`;
function session(persistent = true) { return createSession("access-private", refreshToken, persistent); }
function request(route, { method = "GET", cookie, body, origin = "http://localhost:3000", headers = {} } = {}) {
  return new NextRequest(`http://localhost:3000/api/${route}`, {
    method, ...(body === undefined ? {} : { body }),
    headers: { origin, "x-rentora-request": "1", ...(cookie ? { cookie: `${sessionCookieName}=${cookie}` } : {}), ...headers },
  });
}
function json(body, status = 200) { return Response.json(body, { status }); }
function run(route, options) { return handleApi(request(route, options), route.split("?", 1)[0].split("/")); }

test("cookie encryption, tamper protection, and absolute expiry", () => {
  const value = session();
  const sealed = sealSession(value);
  assert.deepEqual(readSession(sealed), value);
  assert.ok(!sealed.includes(value.accessToken));
  assert.equal(readSession("broken"), null);
  const bytes = Buffer.from(sealed, "base64url"); bytes[30] ^= 1;
  assert.equal(readSession(bytes.toString("base64url")), null);
  assert.equal(readSession(sealSession({ ...value, expiresAt: Date.now() - 1 })), null);
});

for (const route of ["auth/login", "auth/register", "invites/accept"]) {
  for (const persistent of [true, false]) {
    test(`${route} returns only user data and ${persistent ? "persistent" : "session"} HttpOnly cookie`, async () => {
      globalThis.fetch = async (url, init) => {
        assert.equal(url.toString(), `http://backend.internal/api/${route}`);
        assert.equal(JSON.parse(new TextDecoder().decode(init.body)).rememberMe, undefined);
        assert.equal(init.headers.Authorization, undefined);
        return json({ user, accessToken: "access-private", refreshToken });
      };
      const response = await run(route, { method: "POST", body: JSON.stringify({ rememberMe: persistent }), headers: { "Content-Type": "application/json" } });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { user });
      const cookie = response.headers.get("set-cookie");
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /SameSite=lax/i);
      assert.equal(/; Secure(?:;|$)/i.test(cookie), process.env.NODE_ENV === "production");
      assert.equal(sessionCookieName.startsWith("__Host-"), process.env.NODE_ENV === "production");
      assert.ok(!/; Domain=/i.test(cookie));
      assert.equal(/Expires=/i.test(cookie), persistent);
      assert.equal(readSession(response.cookies.get(sessionCookieName).value).persistent, persistent);
    });
  }
}

test("CSRF and unsupported paths rejected before any upstream call", async () => {
  globalThis.fetch = async () => { throw new Error("must not call upstream"); };
  assert.equal((await run("auth/login", { method: "POST", origin: "https://attacker.example" })).status, 403);
  assert.equal((await run("auth/login", { method: "POST", headers: { "x-rentora-request": "" } })).status, 403);
  assert.equal((await run("auth/refresh", { method: "POST" })).status, 404);
  assert.equal((await handleApi(request("requests"), ["requests", "..", "auth"])).status, 400);
  assert.equal((await run("webhooks/stripe", { method: "POST" })).status, 404);
});

test("missing or forged session cannot authorize protected requests", async () => {
  let calls = 0; globalThis.fetch = async () => { calls++; return json({}); };
  const response = await run("requests", { headers: { Authorization: "Bearer attacker" } });
  assert.equal(response.status, 401);
  assert.equal((await run("requests", { cookie: "forged" })).status, 401);
  assert.equal(calls, 0);
});

test("proxy uses cookie credential, preserves query, strips debug fields and disables caching", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url.toString(), "http://backend.internal/api/requests?status=NEW");
    assert.equal(init.headers.Authorization, "Bearer access-private");
    assert.equal(init.headers.cookie, undefined);
    assert.equal(init.cache, "no-store");
    assert.equal(init.redirect, "manual");
    return json({ items: [], error: { secret: "internal" }, nested: { accessToken: "hidden" } });
  };
  const response = await run("requests?status=NEW", { cookie: sealSession(session()), headers: { Authorization: "Bearer attacker" } });
  assert.deepEqual(await response.json(), { items: [], nested: {} });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("401 refreshes once, retries the request, and preserves original cookie expiry", async () => {
  const original = session(false);
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    if (url.pathname.endsWith("/refresh")) {
      assert.deepEqual(JSON.parse(init.body), { refreshToken });
      return json({ accessToken: "renewed" });
    }
    return init.headers.Authorization === "Bearer renewed" ? json({ user }) : json({}, 401);
  };
  const response = await run("auth/me", { cookie: sealSession(original) });
  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(readSession(response.cookies.get(sessionCookieName).value), { ...original, accessToken: "renewed" });
  assert.ok(!response.headers.get("set-cookie").includes("Expires="));
});

test("refresh rejection clears cookie, but backend outages retain it", async () => {
  globalThis.fetch = async () => json({}, 401);
  const response = await run("requests", { cookie: sealSession(session()) });
  assert.equal(response.status, 401);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
  globalThis.fetch = async (url) => json({}, url.pathname.endsWith("/refresh") ? 503 : 401);
  const unavailable = await run("requests", { cookie: sealSession(session()) });
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get("set-cookie"), null);
});

test("logout revokes the refresh token and expires the cookie", async () => {
  globalThis.fetch = async (url, init) => {
    assert.equal(url.pathname, "/api/auth/logout");
    assert.deepEqual(JSON.parse(init.body), { refreshToken });
    return json({ message: "Logged out" });
  };
  const response = await run("auth/logout", { method: "POST", cookie: sealSession(session()) });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});

test("account deletion clears the session only after upstream success", async () => {
  globalThis.fetch = async () => json({ message: "Deleted" });
  const response = await run("auth/account", { method: "DELETE", cookie: sealSession(session()) });
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
  globalThis.fetch = async () => json({ message: "Forbidden" }, 403);
  const failed = await run("auth/account", { method: "DELETE", cookie: sealSession(session()) });
  assert.equal(failed.headers.get("set-cookie"), null);
});

test("multipart profile upload retains boundary and bytes", async () => {
  const body = "--test-boundary\r\nContent-Disposition: form-data; name=fullName\r\n\r\nTest User\r\n--test-boundary--";
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.headers["Content-Type"], "multipart/form-data; boundary=test-boundary");
    assert.equal(new TextDecoder().decode(init.body), body);
    return json({ profile: { fullName: "Test User", profileImage: "/media/landlords/avatar.png" } });
  };
  assert.equal((await run("auth/profile", { method: "PATCH", body, cookie: sealSession(session()), headers: { "Content-Type": "multipart/form-data; boundary=test-boundary" } })).status, 200);
});

test("oversized body is rejected without upstream traffic", async () => {
  globalThis.fetch = async () => { assert.fail("must not upload"); };
  assert.equal((await run("auth/login", { method: "POST", body: "{}", headers: { "content-length": "4000000" } })).status, 413);
});

test("malformed auth input is rejected before reaching backend", async () => {
  globalThis.fetch = async () => { assert.fail("must not call backend"); };
  for (const body of ["null", "[]", "{", "42"]) {
    assert.equal((await run("auth/login", { method: "POST", body })).status, 400);
  }
});

test("renewal updates cookies on empty responses and never retries indefinitely", async () => {
  let calls = 0;
  globalThis.fetch = async (url, init) => {
    calls++;
    if (url.pathname.endsWith("/refresh")) return json({ accessToken: "renewed" });
    return init.headers.Authorization === "Bearer renewed" ? new Response(null, { status: 204 }) : json({}, 401);
  };
  const response = await run("notifications/" + "a".repeat(24) + "/read", { method: "PATCH", cookie: sealSession(session()) });
  assert.equal(response.status, 204);
  assert.equal(readSession(response.cookies.get(sessionCookieName).value).accessToken, "renewed");
  assert.equal(calls, 3);
  calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    return url.pathname.endsWith("/refresh") ? json({ accessToken: "renewed" }) : json({}, 401);
  };
  const rejected = await run("requests", { cookie: sealSession(session()) });
  assert.equal(rejected.status, 401);
  assert.match(rejected.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(calls, 3);
});

test("simultaneous expired requests share one in-flight refresh", async () => {
  let refreshCount = 0;
  globalThis.fetch = async (url, init) => {
    if (url.pathname.endsWith("/refresh")) {
      refreshCount++;
      await new Promise((resolve) => setTimeout(resolve, 10));
      return json({ accessToken: "renewed" });
    }
    return init.headers.Authorization === "Bearer renewed" ? json([]) : json({}, 401);
  };
  const cookie = sealSession(session());
  const responses = await Promise.all([run("requests", { cookie }), run("notifications", { cookie })]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200]);
  assert.equal(refreshCount, 1);
});

test("transport failures and failed logout keep the existing session", async () => {
  globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
  for (const [route, method] of [["auth/me", "GET"], ["auth/logout", "POST"]]) {
    const response = await run(route, { method, cookie: sealSession(session()) });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

test("media streams image bytes from backend without accepting arbitrary targets", async () => {
  const bytes = new Uint8Array([137, 80, 78, 71]);
  globalThis.fetch = async (url) => {
    assert.equal(url.toString(), "http://backend.internal/media/landlords/profile-test.png");
    return new Response(bytes, { headers: { "Content-Type": "image/png" } });
  };
  const response = await getMedia(request("unused"), { params: Promise.resolve({ path: ["landlords", "profile-test.png"] }) });
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);
  globalThis.fetch = async () => { assert.fail("must not fetch invalid media"); };
  for (const path of [["..", "secret.png"], ["landlords", "../secret.png"], ["landlords", "script.svg"]]) {
    assert.equal((await getMedia(request("unused"), { params: Promise.resolve({ path }) })).status, 404);
  }
});

test("client IP forwarding is disabled unless explicitly trusted and valid", () => {
  const original = process.env.BFF_CLIENT_IP_HEADER;
  try {
    delete process.env.BFF_CLIENT_IP_HEADER;
    const req = request("requests", { headers: { "x-real-ip": "192.0.2.1", "x-forwarded-for": "attacker" } });
    assert.deepEqual(clientAddressHeaders(req), {});
    process.env.BFF_CLIENT_IP_HEADER = "x-real-ip";
    assert.deepEqual(clientAddressHeaders(req), { "X-Forwarded-For": "192.0.2.1" });
    assert.deepEqual(clientAddressHeaders(request("requests", { headers: { "x-real-ip": "bad, 192.0.2.1" } })), {});
  } finally {
    if (original === undefined) delete process.env.BFF_CLIENT_IP_HEADER;
    else process.env.BFF_CLIENT_IP_HEADER = original;
  }
});
