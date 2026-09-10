# Rentora Project Context

This note captures the current Rentora architecture and product behavior for future changes.

## Product Summary

Rentora is a property-management SaaS for landlords/property managers, tenants, and vendors. Its core workflow is maintenance operations:

- Tenants create maintenance requests for their assigned unit.
- Landlords manage properties, units, users, vendors, requests, assignments, and organization settings.
- Vendors view assigned requests, update progress, upload completion images, and manage their services.
- Notifications are sent through persisted notifications, WebSocket updates, and optional push notifications.
- Organizations are subscription-gated and data must remain organization-scoped.

## Repo Layout

- `docs/`: product, design, and implementation plans.
- `backend/`: Node/Express/MongoDB API written in TypeScript.
- `mobile/`: Expo React Native app with React Navigation and Redux Toolkit.
- `web/`: Next.js App Router app for desktop landlord operations.

Generated/build folders exist in `backend/dist`, `web/.next`, and `mobile/android/build`; avoid editing those directly.

## Shared Domain Model

Primary roles:

- `LANDLORD`
- `TENANT`
- `VENDOR`

Request statuses:

- `NEW`
- `ASSIGNED`
- `IN_PROGRESS`
- `DONE`
- `VERIFIED`

Request urgency:

- `LOW`
- `MEDIUM`
- `HIGH`

Core entities:

- `User`: name, email, passwordHash, role, organizationId, phone/avatar, push tokens, active state.
- `Organization`: owner, Stripe IDs/status, plan, unit limit, trial, active state.
- `Property`: organization, name, structured address, totalUnits.
- `Unit`: organization, property, unitNumber, tenantId, rent/lease fields, occupied/vacant status.
- `Vendor`: organization, linked user, services, rating, totalJobs, notes, active state.
- `MaintenanceRequest`: organization, property, unit, tenant, optional vendor, title, description, images, status, urgency.
- `Invite`: email, role, organization, optional unit, token, expiry, accepted flag.
- `Notification`, `FcmToken`, `RefreshToken`, `ActivityLog`.

Always preserve organization scoping in backend queries and client assumptions.

## Backend

Stack:

- Express 5, TypeScript, Mongoose, MongoDB.
- JWT access and refresh tokens.
- Stripe, Firebase Admin, Nodemailer, WebSocket (`ws`), Helmet, CORS, rate limiting.

Entry points:

- `backend/src/server.ts`: loads `.env`, connects MongoDB, starts background jobs, creates HTTP server, starts notification WebSocket gateway.
- `backend/src/app.ts`: Express app, CORS whitelist, Helmet, rate limit, JSON/urlencoded parsing, Mongo payload sanitization, cookie parser, morgan, route mount.

Important middleware:

- `authenticateJWT`: requires `Authorization: Bearer <token>`, verifies token, loads active user, attaches `req.user`.
- `attachOrganization`: rejects missing `req.user.organizationId`.
- `requireRole(role)`: exact role gate.
- `requireSubscriptionActive`: allows active organizations with no status or `ACTIVE`/`TRIALING`.

API route groups:

- `/api/auth`: register, login, refresh, logout, forgot/reset/change password, current user/profile, tenant assignment.
- `/api/users`: landlord-only user and tenant management.
- `/api/organizations`: current organization and landlord organization update.
- `/api/properties`: landlord-only property CRUD.
- `/api/units`: landlord-only unit CRUD.
- `/api/requests`: role-scoped request CRUD/actions.
- `/api/vendors`: landlord-only vendor CRUD.
- `/api/vendor-services`: vendor-only service management.
- `/api/invites`: landlord create/list plus public validate/accept.
- `/api/notifications`: authenticated notification list, read state, device token registration.
- `/api/subscriptions`: checkout and status.
- `/api/webhooks/stripe`: raw-body Stripe webhook.

Request business rules live in `backend/src/services/requestStatusService.ts`:

- Status flow: `NEW -> ASSIGNED -> IN_PROGRESS -> DONE -> VERIFIED`.
- Landlord assigns vendors and can verify done requests.
- Vendor can only update assigned requests: `ASSIGNED -> IN_PROGRESS -> DONE`.
- Tenant cannot update status.
- Tenant can create requests only for self.
- Tenant can delete only own unassigned `NEW` requests.
- Vendor request lists are filtered by the active `Vendor` record for the current user.

Notifications:

- `createNotificationsAndPush` inserts notification records, broadcasts WebSocket updates, and attempts FCM push.
- WebSocket endpoint is `/ws/notifications?token=<accessToken>`.
- Push service filters out Expo-style tokens and expects FCM-compatible device tokens.

## Mobile

Stack:

- Expo 55, React Native 0.83, React 19.
- React Navigation native stack and bottom tabs.
- Redux Toolkit with redux-persist.
- Axios API client and AsyncStorage token persistence.
- Expo notifications with backend device-token registration.

Entry points:

- `mobile/App.tsx`: loads Inter fonts, Redux provider, persist gate, alert provider, navigation container, bootstrap session, push setup, WebSocket setup.
- `mobile/src/navigation/RootNavigator.tsx`: auth stack vs app stack based on `auth.user`.
- `mobile/src/navigation/AppStackNavigator.tsx`: dispatches into role-specific navigators.

Role navigation:

- Landlord tabs: dashboard, requests, properties, users, settings.
- Tenant tabs: my requests, new request, profile/settings.
- Vendor tabs: assigned requests, services, profile.

API layer:

- `mobile/src/services/api.ts`: Axios instance. Default API base is `http://192.168.100.141:5000/api` unless `EXPO_PUBLIC_API_URL` is set.
- Request interceptor attaches bearer token from AsyncStorage.
- Response interceptor clears tokens and forces logout on `401`.
- Services wrap auth, requests, properties, users, vendors, notifications/socket behavior.

State:

- `authSlice`: login/register/bootstrap/logout, invite validation/registration, forgot/reset password.
- `requestSlice`: fetch/create/assign/status, plus filters and optimistic replacement after updates.
- `propertySlice`, `unitSlice`, `vendorSlice`, `userSlice`, `organizationSlice`, `uiSlice`.
- `requestsSlice.ts` currently re-exports request-slice behavior for naming compatibility.

Key screens:

- Auth: splash, login, register, forgot/reset password, invite registration.
- Landlord: dashboard, request list/detail/assign vendor, properties/add/detail/unit edit, users/invite/vendor detail, profile/settings/password.
- Tenant: my requests, new request, request detail, profile/settings/password.
- Vendor: assigned requests, request detail, vendor services.

Realtime pattern:

- Screens such as landlord dashboard/request list, tenant request list, and vendor assigned list subscribe to `subscribeNotifications` and refetch on notification updates.

## Web

Stack:

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS v4 tokens via `globals.css`.
- Fetch-based API helpers.
- Browser local/session storage for tokens and cached user.

App shape:

- `web/app/page.tsx`: public landing page.
- `web/app/login/page.tsx` and `web/app/auth/*`: auth routes.
- `web/app/app/layout.tsx`: authenticated shell.
- `web/components/app`: sidebar, topbar, navigation.
- `web/features/*`: feature pages for dashboard, requests, properties, people, settings, auth.

Important routes:

- `/login` and `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/reset-password/[token]`
- `/auth/invite/[token]`
- `/app/dashboard`
- `/app/requests`
- `/app/requests/[requestId]`
- `/app/properties`
- `/app/tenants`
- `/app/vendors`
- `/app/settings`

Web API layer:

- `web/lib/api/config.ts`: default API base is `http://localhost:5000/api` unless `NEXT_PUBLIC_API_URL` is set.
- `web/lib/api/client.ts`: `apiGet`, `apiPost`, `apiPatch`, `apiDelete`, adds bearer token, clears session and redirects to `/login` on `401`.
- `web/lib/auth/storage.ts`: stores tokens and auth user in localStorage or sessionStorage, emits auth-user-change events.
- `web/lib/auth/routes.ts`: post-login routing currently returns tenant/vendor paths that do not yet exist in `web/app/app`; landlord dashboard exists.

Implemented web feature focus:

- Dashboard loads requests, properties, units, tenants, vendors, and subscription status.
- Requests page loads requests/properties/vendors, then filters locally by search, status, urgency, property, vendor, and date.
- Request detail page loads request plus vendors, supports assign, status updates, and verification.
- Properties page manages properties and units and links related requests.
- Tenants page lists/creates/updates/deletes tenants and uses `/users/tenant`.
- Vendors page invites vendors, updates vendor/user details, and deletes vendor/user records.
- Settings page manages auth profile, organization details, local notification preferences, password changes, logout, and subscription status.
- Topbar polls notifications and can mark notifications read, routing request notifications to request detail pages.

## Design System

Mobile and web share the same Rentora tokens:

- Primary: `#3E54D3`
- Primary light: `#6B78F6`
- Primary soft: `#EEF0FF`
- Primary dark: `#2E39A8`
- Tenant accent: `#14B8A6`
- Vendor accent: `#6C74A7`
- Success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#DC2626`
- Background: `#F3F4F8`
- Surface: `#FFFFFF`
- Text primary: `#0F172A`
- Text secondary: `#475569`
- Border/divider: `#E2E6F0` / `#EAEDF6`

Design intent:

- Mobile: compact, role-aware, card-first, task-focused.
- Web: desktop command center with sidebar, topbar, dense tables, filters, split/detail workflows, practical operational UI.

For future UI changes:

- Prefer existing components in `mobile/src/components`, `web/components/ui`, and `web/components/app`.
- Keep authenticated web screens operational, not marketing-like.
- Avoid nested cards and excessive decoration.
- Use role accents intentionally.
- Keep text compact and scannable in dashboard/table contexts.

## Known Gaps And Cautions

- Web tenant/vendor post-login paths (`/app/my-requests`, `/app/assigned-requests`) are referenced but not implemented in the current route tree.
- Web authenticated layout is client-side session based; there is no strong server-side route protection yet.
- Mobile default API base is a local LAN IP. Use `EXPO_PUBLIC_API_URL` when moving between environments.
- Backend `/api/auth/me` and `/api/auth/me-assignment` decode bearer tokens manually rather than using the full authenticated route middleware.
- Request image upload is currently represented as image URL/string arrays; full multipart or object-storage upload flow is not yet implemented.
- Stripe, SMTP, Firebase, Cloudinary/S3 depend on environment configuration.
- There are no meaningful test scripts at present; backend `npm test` is a placeholder.
- When deleting properties or users, backend controllers cascade related records. Review carefully before changing delete behavior.

## Commands

Backend:

```bash
cd backend
npm run dev
npm run build
npm run seed:data
```

Web:

```bash
cd web
npm run dev
npm run build
npm run lint
```

Mobile:

```bash
cd mobile
npm start
npm run android
npm run ios
```

## Change Guidance

Before changing behavior:

- Check the relevant docs in `docs/`.
- Check backend route/middleware ownership first.
- Keep API payloads aligned with `web/lib/api/types.ts` and `mobile/src/services/api.ts`.
- Maintain status-transition rules in `requestStatusService`.
- Preserve tenant/vendor scoping and landlord-only management gates.
- Update both clients if an API contract changes.
- Prefer focused tests or at least `npm run build` for the touched package.
