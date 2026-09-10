# Web Sessions And BFF

The browser calls same-origin Next.js `/api/*` routes. Next.js calls Express using
server-held bearer credentials. Mobile continues using its existing bearer API;
this migration deliberately does not change the native authentication contract.

## Configuration

Set these server-only values in `web/.env` for local development or your production
secret manager. Never prefix them with `NEXT_PUBLIC_` or commit secrets.

```dotenv
BACKEND_API_URL=http://localhost:5000/api
BFF_SESSION_SECRET=<64 hexadecimal characters from 32 random bytes>
# Required behind a production reverse proxy; exact public origin, no trailing slash.
APP_ORIGIN=https://rentora.example.com
```

Generate the session key with `openssl rand -hex 32`. Keep it stable across restarts
and identical on every Next.js instance. Rotating it requires users to sign in again.
For direct localhost development, omit `APP_ORIGIN` to use the incoming request origin.
`NEXT_PUBLIC_API_URL` is no longer used by the web app. Start Express as usual, then
run `npm run dev` in `web/`. Production requires HTTPS because session cookies are Secure.

## Session Lifecycle

- Login, landlord registration, and invitation acceptance create an AES-256-GCM
  encrypted, authenticated HttpOnly cookie. Access/refresh tokens are removed from
  browser-facing JSON. The production cookie uses the `__Host-` prefix, no Domain,
  `Path=/`, `Secure`, and `SameSite=Lax`.
- Remember me sets a persistent cookie, capped at 30 days and the refresh JWT's expiry.
  Unchecked uses a session cookie with the same server-enforced absolute expiry.
  Browser session-restore settings can retain session cookies after a restart.
  Registration and invitation acceptance default to persistent sessions.
- On an upstream 401, the BFF refreshes server-side and retries once. Renewal does
  not extend the original absolute session expiry or change Remember me. Concurrent
  renewals share one in-flight refresh within each Next.js process.
- Invalid/revoked credentials expire the cookie. Network/service failures preserve
  it and return a retryable error. Dashboard content waits for `/api/auth/me` to
  verify the current user; the in-memory user cache is rendering data, not authority.
- Logout revokes the backend refresh token before clearing the cookie. Failed
  revocation reports an error so the user can retry. Successful account deletion
  also clears the cookie. Existing password-change/reset behavior is preserved.
- Old localStorage/sessionStorage credentials are deleted, never imported. Existing
  web users must sign in once after deployment. Notification preferences still use
  localStorage because they are not credentials.

## Proxy Boundary

- Only explicitly allowed API paths and methods are forwarded. Browser Authorization,
  Cookie, Host, and arbitrary forwarded headers are never relayed upstream.
- Mutations require a matching Origin and `X-Rentora-Request: 1`; cross-site requests
  are rejected. The public BFF does not expose `/auth/refresh` or Stripe webhooks.
- Responses are not cached; credentials and debug error fields are stripped.
  Redirects are not followed. Multipart uploads retain their bytes/content type,
  with a 3 MiB BFF body limit (the existing backend profile file limit remains 2 MiB).
- `/media/<category>/<filename>` streams supported backend images on the web origin.
  Storage remains in backend `media/`, which stays ignored by Git. Public media stays
  public; this is not a new private-file authorization system. Existing external
  image URLs are unchanged.

## Production Checklist

1. Configure HTTPS, a strong stable session key, the backend API URL, and the exact
   public `APP_ORIGIN`. Never cache `/api/*` or Set-Cookie responses at the CDN.
2. Put Next.js behind trusted ingress. To preserve per-client backend rate limits,
   set `BFF_CLIENT_IP_HEADER=x-real-ip` only when ingress overwrites this header with
   a single verified client IP and direct access to Next.js cannot bypass ingress.
   Do not enable this on an internet-facing Next.js server with spoofable headers.
   Without it, Express sees the BFF address and web clients share its rate-limit bucket.
3. Configure Express `TRUST_PROXY` for the actual trusted path. The BFF forwards one
   validated client address when configured. Ensure any mobile/public gateway also
   strips untrusted forwarding headers. Apply edge limits to login/reset routes;
   Express's in-memory limiter is per process, not a distributed rate-limit service.
4. Backend URLs no longer need to appear in web requests, but a proxy does not make
   Express private by itself. Restrict network ingress appropriately while retaining
   the mobile API, mobile WebSocket, and Stripe webhook access paths. Backend role,
   active-user, organization, and subscription authorization remain mandatory.
5. Keep strong backend JWT secrets. HttpOnly prevents script access to credentials,
   but cannot prevent malicious same-origin scripts from performing authenticated
   actions. This migration is not a replacement for XSS prevention or access control.
6. Logout revokes refresh credentials using the existing backend contract. Already
   issued backend access JWTs remain valid until expiry; instant access-token
   revocation across all clients is not introduced by this migration.

## Verification

Run `npm run test:bff`, `npm run lint`, and `npm run build` from `web/`.
The BFF tests exercise real route/session modules with a mocked upstream, including
CSRF, cookie integrity/expiry, auth flows, renewal, logout, deletion, uploads, and media.
Run `npm run test:session` from `backend/` for backend session-error regressions.
Before production rollout, smoke-test login with both Remember me states, reload,
profile upload/save/cancel, request creation, notification actions, password changes,
logout, and tenant/vendor accounts against a disposable test database.
