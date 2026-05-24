## Rentora — Design PRD

Version: 1.0
Date: 2026-05-23

Purpose
-------
This document is a product requirements & design brief (PRD) intended for the Stitch design team to produce high fidelity screens, components, and design tokens for the Rentora mobile app (Expo-managed). The design team may choose the accent color; all other visual and UX constraints are defined below so the chosen color integrates consistently across the product.

Project summary
---------------
- Product name: Rentora
- Platforms: iOS & Android (Expo managed app)
- Audience: Property managers / landlords, tenants, and vendors for maintenance and property management workflows.
- App purpose: Streamline property management tasks — reporting & tracking maintenance requests, assigning vendors, managing properties/units, user invitations and roles, push and real-time notifications, and subscription/payments.

Design goals
------------
- Clarity: Make workflows quick and unambiguous for each role (Tenant, Landlord, Vendor).
- Efficiency: Minimize taps and friction for frequent tasks (create request, view request, assign vendor, update status).
- Accessibility: WCAG AA text sizes, accessible color contrast, screen reader labels.
- Consistency: Reusable components that map to code components in the repo (`components/`, `common/`, `layout/`).
- Branding flexibility: Stitch chooses an accent color. Provide supporting neutral palette and usage rules so accent works for CTAs, status, and highlights.

Primary user roles & personas
------------------------------
- Tenant: Reports issues (maintenance requests), tracks status, views property/unit info, contacts vendors/landlord.
- Landlord / Property Manager: Views all requests, assigns vendors, manages properties & units, invites users, manages subscriptions.
- Vendor: Receives assigned requests, updates status, adds notes and images, communicates with landlord and tenant as needed.

Core features (high level)
--------------------------
- Authentication & onboarding (email invite flow, registration, login, password reset).
- Role-aware navigation and dashboards (Tenant / Landlord / Vendor).
- Maintenance requests: Create (with photos), comment, track status, attach vendors, upload receipts.
- Properties & Units: List, details, add/edit (landlord flows).
- Users & invitations: Invite users, accept invite flows, edit profiles.
- Vendors & vendor services: Browse vendor services, vendor profiles, assigned requests.
- Notifications: Push notifications and realtime socket updates for request status and messages.
- Payments & subscriptions: Subscription management (Stripe native integration) — landing screens and subscription status.
- Settings: Profile, change password, app settings, notification preferences.
- Webhooks: Integrations (backend-facing) — not a mobile UI but relevant for cross-platform behavior.

Technical constraints
---------------------
- Framework: Expo (see `mobile/package.json`). Use React Navigation and Redux persist as implemented.
- Networking: Axios-based API wrapper (`src/services/api`). App expects JSON REST endpoints under `/api/*`.
- Realtime: WebSocket / socket service for live notifications (`notificationsSocket`).
- Push: `expo-notifications` for push token registration.
- Offline: Minimal offline support via Redux persist; CRUD operations should handle network failure gracefully and show retry UI.

Accent color guidance for Stitch
-------------------------------
- Stitch may select the primary accent color. Provide a single HEX for primary. Use system to generate:
  - Primary (accent)
  - Primary 10%/20%/30% for subtle backgrounds
  - Primary dark (for text on primary buttons if needed)
- Use accent for primary CTAs, active tab icon, selected states, important highlights.
- Use neutral palette (grays) for backgrounds, borders, and secondary text. Reserve semantic colors for status (success, warning, danger) — do not overload accent for error states.

Typography & spacing
---------------------
- Base font: Inter (already shipped in app via `@expo-google-fonts/inter`).
- Sizes (suggested):
  - Heading XL: 22-24
  - Heading L: 18-20
  - Body: 14-16
  - Small: 12
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 — keep consistent margins & paddings.

Accessibility
--------------
- Contrast: Ensure minimum contrast ratios (AA) for text and interactive elements.
- Hit targets: 44x44 pt minimum for touch targets.
- Screen reader: Provide accessibility labels for form fields, buttons, and list items.
- Color independent: Do not convey information using color alone; include icons/labels for status.

Navigation & deep linking
-------------------------
- App uses role-aware stacks: Root -> Auth vs App -> AppStackNavigator -> Role navigators (Tenant, Landlord, Vendor).
- Deep links should map to specific screens: `app://request/{id}`, `app://property/{id}`, `app://vendor/{id}`, `app://invite/{token}`.
- If the deep-linked route requires auth and the user is not logged in, route to login then redirect back after authentication.

Data & API mapping (summary)
----------------------------
The mobile app relies on the backend REST API under `/api`. Main route groups (approx):
- `/api/auth` — login, register, logout, refresh, invite registration, password reset
- `/api/users` — profile, edit
- `/api/properties` — list, create, edit, property details
- `/api/units` — units per property, create, edit
- `/api/requests` — maintenance requests (create, list, details, comment, status change)
- `/api/vendors` — vendors list, details, assign
- `/api/vendor-services` — services offered by vendors
- `/api/notifications` — mark read, list
- `/api/subscriptions` — stripe interactions, plan status
- `/api/invites` — create/accept invites
- `/api/organizations` — org-level metadata
- `/api/webhooks` — incoming 3rd party events (used by backend)

For each screen below, we list the expected API calls and payload highlights.

Screen Inventory & detailed behavior
-----------------------------------
General UI primitives (re-use existing components):
- `ScreenContainer` / `ScreenWrapper` — base container with safe area and consistent padding.
- `AppButton`, `Button` — primary & secondary styles.
- `Input`, `Modal`, `Loader`, `Badge`, `StatusBadge`.
- Card components: `RequestCard`, `VendorCard`, `PropertyCard`, `UnitCard`.

Auth & Onboarding
------------------
1) Splash / Launch
  - Purpose: Show brand + bootstrap session while `bootstrapSession` runs.
  - Data: checks persisted token & session.
  - Transition: to `Root` (Auth or App stack) after bootstrap.

2) Login Screen
  - Inputs: email, password.
  - Actions: `POST /api/auth/login` -> receive token; store in Redux; navigate to role home.
  - Errors: invalid creds -> inline error; network -> retry modal.

3) Register / InviteRegistration
  - Inputs: invite token or standard signup fields (name, email, password, property/unit selection optional).
  - Actions: `POST /api/auth/register` or `POST /api/invites/accept` depending on flow.

4) Forgot / Reset Password
  - Flows: request reset (`POST /api/auth/forgot`) and reset (`POST /api/auth/reset`).

Tenant flows & screens
----------------------
1) Tenant Dashboard / My Requests
  - Purpose: List of tenant’s requests sorted by active/recent.
  - API: `GET /api/requests?role=tenant` (or filtered by user id).
  - CTA: New Request.

2) New Request Screen
  - Inputs: title, description, property (select), unit (select), priority, photos (image picker), preferred time.
  - Behavior: allow multiple photos, compress images, preview thumbnails.
  - API: `POST /api/requests` -> payload includes images (multipart) or pre-signed uploads.
  - Post-submit: show success modal and push-to relevant watchers.

3) Request Details (Tenant)
  - Data: request details, comments, timeline, assigned vendor, status history.
  - API: `GET /api/requests/:id`, `POST /api/requests/:id/comments`.
  - Actions: add comment, add photos, cancel request (if allowed).

4) Tenant Profile & Settings
  - API: `GET/PUT /api/users/:id`, change password endpoints.

Landlord flows & screens
------------------------
1) Landlord Dashboard
  - Overview: aggregated counts (open requests, pending assignments, overdue), recent activity.
  - API: `GET /api/requests?orgId=...&status=open` and `GET /api/organizations/:id/summary`.

2) Requests List & Request Details (Landlord)
  - Actions: filter by property, status, priority. Assign vendor, change status, add notes, attach files.
  - API: `PATCH /api/requests/:id` (status/assignee updates), `POST /api/requests/:id/assign`.

3) Assign Vendor Screen
  - Vendor search, filter by service & rating.
  - API: `GET /api/vendors?service=plumbing&propertyId=...` and `POST /api/requests/:id/assign`.

4) Property & Unit Management
  - CRUD screens for properties and units.
  - API: `GET/POST/PUT /api/properties`, `GET/POST/PUT /api/units`.

5) Invite User / Users List
  - Create invite: `POST /api/invites` (email, role, property/unit scope).
  - Resend / revoke invites in list.

Vendor flows & screens
----------------------
1) Vendor Home / Assigned Requests
  - Shows assigned requests; quick actions to accept/decline and update status.
  - API: `GET /api/requests?assigneeId={vendorId}`.

2) Vendor Request Details
  - Add work notes, photos, mark as in-progress / completed, attach invoice.
  - API: `PATCH /api/requests/:id` (status, notes), `POST /api/requests/:id/files`.

3) Vendor Services & Profile
  - View/edit services offered, contact info.
  - API: `GET/PUT /api/vendors/:id`, `GET /api/vendor-services`.

Common & Shared screens
-----------------------
- Notifications screen: list of push/realtime notifications (`GET /api/notifications`).
- Inbox / Comments UI: threaded comments within request details.
- Settings: notifications, profile, change password, logout.

Error states & validation
-------------------------
- Form validation: show inline errors mapped to fields. Use consistent error language.
- Offline: show offline banner (local network detection) and queue retries for upload operations.
- Server errors: display retry CTA; log errors to analytics.

Push & Realtime behavior
------------------------
- Push token sent to backend on login: `POST /api/notifications/token`.
- Notifications: tapping a push should deep-link to the target screen; if unauthenticated direct to login then redirect.
- Realtime socket: socket used for live updates; UI should update in-place when socket events arrive (status changes, new comments).

Security & privacy notes for design
----------------------------------
- Never display full secret keys or tokens in screens; mask sensitive items like account numbers.
- On invite flows, clearly show who will have access and what scope they receive.
- Provide confirmation modals for destructive actions (delete request, revoke invite).

Assets, icons & imagery
-----------------------
- Iconography: use a simple, modern icon set consistent with Expo vector icons.
- Illustrations: optional onboarding illustrations for first-run; keep them neutral and property-themed.
- Photos: allow tenants to upload multiple photos; show thumbnails and full-screen modal previews.

Platform differences
---------------------
- Expo-managed: follow platform UI patterns (Android: material touch ripples; iOS: standard nav gestures.)
- Use platform-specific spacing and system font metrics where required; Inter is used everywhere for consistency.

Analytics & metrics
--------------------
- Track key events: `login`, `request_created`, `request_status_changed`, `vendor_assigned`, `invite_sent`, `purchase_subscription`.
- Track screen times and failures to optimize UX bottlenecks.

Handoff deliverables & acceptance criteria
-----------------------------------------
For Stitch deliverable set, provide the following:
1) High-fidelity screens for each listed screen in mobile sizes (iPhone 14 and Pixel 6 baseline).
2) Design system tokens: primary accent HEX (chosen by Stitch), neutrals, semantic colors (success/warning/error), type scale, spacing scale.
3) Component library spec: Button (primary/secondary/ghost), Input (states: default, focused, error, disabled), Modal, Card, Header, TabBar, Loader, Badge, File/Photo picker UI, Toasts.
4) Interaction spec: animations for navigation, modals, pull-to-refresh, image picker transitions, loading states, and optimistic updates.
5) Accessibility checklist & annotated screens (contrast, labels, touch targets).
6) Assets: exported PNG/SVG icons, 1x/2x assets for platform images, any illustration files (SVG/source).
7) A tidy component spec document (symbols / tokens) the dev team can map to `components/` in the repo.

Prioritization & milestones
---------------------------
- Phase 1 (MVP): Auth, Tenant request flow (create, list, details, comments), Push notifications, Profile.
- Phase 2: Landlord request management (assign vendor, property/unit CRUD), invites, vendor assignment flows.
- Phase 3: Vendor app polish, payments/subscriptions, analytics, offline improvements.

Open questions & notes for Stitch
--------------------------------
- Accent color: please choose a single primary accent and provide the suggested tints & darker variant.
- Microcopy: we can provide suggested copy for CTAs and empty states, but confirm tone: professional vs conversational.
- Confirmation of any legal text needed for payments or subscriptions screens.

Appendix — quick API mapping (for designer reference)
----------------------------------------------------
- Auth: `/api/auth/*` — login, register, forgot, reset
- Users: `/api/users/*` — profile read & update
- Requests: `/api/requests/*` — list, create, get, update, comments
- Properties: `/api/properties/*` — list & manage
- Units: `/api/units/*`
- Vendors: `/api/vendors/*`
- Vendor services: `/api/vendor-services/*`
- Notifications: `/api/notifications/*`
- Invitations: `/api/invites/*`
- Subscriptions: `/api/subscriptions/*`

Contact & handoff
-----------------
If Stitch needs any additional project artifacts (API contracts, mock data, or a brief walkthrough of the repo structure), contact the engineering lead or request access to the staging API. Development repo paths to reference while implementing designs:
- Mobile app root: `mobile/` — screens: `mobile/src/screens`, components: `mobile/src/components`, services: `mobile/src/services`.
- Backend: `backend/` — API routes: `backend/src/routes`, controllers: `backend/src/controllers`, models: `backend/src/models`.

Version history
---------------
- 1.0 — Initial PRD created 2026-05-23

---

Notes to engineers & designers:
- Designers: choose the primary accent and return a palette; devs will map token names to `theme.ts` and `constants`.
- Engineers: if an endpoint or field is ambiguous, open an issue describing the missing contract and request a sample response.

Screen index by role
--------------------

Auth / onboarding
- Splash / Launch
- Login Screen
- Register Screen
- Invite Registration Screen
- Forgot Password Screen
- Reset Password Screen

Tenant
- Tenant Dashboard
- My Requests Screen
- New Request Screen
- Tenant Request Details Screen
- Tenant Profile Screen
- Edit Tenant Profile Screen
- Tenant Settings Screen
- Tenant Change Password Screen

Landlord
- Landlord Dashboard Screen
- Properties List Screen
- Property Details Screen
- Add Property Screen
- Edit Property Screen
- Units List / Unit Management Screens
- Add Unit Screen
- Edit Unit Screen
- Requests List Screen
- Request Details Screen
- Assign Vendor Screen
- Users List Screen
- Invite User Screen
- Landlord Profile Screen
- Edit Landlord Profile Screen
- Landlord Settings Screen
- Landlord Change Password Screen

Vendor
- Vendor Home / Assigned Requests Screen
- Vendor Request Details Screen
- Vendor Services Screen
- Vendor Profile Screen

Shared / utility
- Notifications Screen
- Change Password Screen
- Edit Profile Screen
- Subscription / Billing Screen
- Settings Screen

