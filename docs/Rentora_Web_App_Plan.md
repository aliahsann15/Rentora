# Rentora Web App Product & UX Plan

Version: 1.0  
Date: 2026-07-19  
Scope: Web application planning for Rentora's multi-role property management SaaS.

---

## 1. Purpose

Rentora currently has a backend API and a hybrid mobile app focused on maintenance workflows for landlords, tenants, and vendors. This document defines the planned web app experience, including pages, role-based navigation, workflows, data flow, UI direction, and implementation priorities.

For the first release, the public landing page is the login page. Marketing/public pages will be added later.

The web app should share the existing Rentora product model and design tokens, while feeling more desktop-native, modern, and operational than the mobile app.

---

## 2. Product Direction

The web app should be the command center version of Rentora.

The mobile app is compact and task-first. The web app should be broader, faster to scan, and better suited to property management operations:

- Rich dashboards
- Data tables
- Split-pane detail views
- Search and filters
- Quick actions
- Context drawers
- Bulk-friendly layouts
- Realtime notification updates
- Better visibility across properties, units, tenants, vendors, and requests

The web app should not feel like a stretched mobile app. It should use the same system underneath, but present the data in a more capable desktop workflow.

---

## 3. Design Direction

### 3.1 Design Principle

Keep the Rentora design system as the base, but introduce a more distinctive web identity:

- Mobile app: compact, card-first, stacked flows.
- Web app: spacious, structured, analytical, and command-center-like.

The web app should feel modern and creative, but still trustworthy for property operations.

### 3.2 Existing Tokens To Keep

Use the existing mobile theme tokens as the foundation:

```ts
primary: '#3E54D3'
primaryLight: '#6B78F6'
primarySoft: '#EEF0FF'
primaryDark: '#2E39A8'

secondary: '#6C74A7'
secondaryLight: '#8F95C6'
secondarySoft: '#F0F1F8'

tertiary: '#A44400'
tertiaryLight: '#C86A2B'
tertiarySoft: '#FFF4EA'

success: '#10B981'
successSoft: '#ECFDF5'

warning: '#F59E0B'
warningSoft: '#FFFBEB'

danger: '#DC2626'
dangerSoft: '#FEF2F2'

background: '#F3F4F8'
backgroundDark: '#1F2024'
surface: '#FFFFFF'

textPrimary: '#0F172A'
textSecondary: '#475569'
textMuted: '#94A3B8'

border: '#E2E6F0'
divider: '#EAEDF6'

tenantAccent: '#14B8A6'
vendorAccent: '#6C74A7'
```

Typography:

- Font: Inter
- Keep clear hierarchy and readable density.
- Avoid oversized mobile-style headings inside data-heavy screens.

Radius:

- Most controls: 8px
- Panels/cards: 8px to 12px
- Large modal/dialog containers: 12px to 16px

### 3.3 Web-Specific UI Style

Use these web-specific patterns:

- Left sidebar instead of bottom tabs.
- Top command bar with search, notifications, quick create, and profile menu.
- Dense but readable tables.
- Sticky table headers for long lists.
- Inline filters and saved views.
- Right-side details panel where useful.
- Drawers for quick edit/assignment flows.
- Dialogs for confirmations.
- Toasts for success/error feedback.
- Empty states with direct next actions.
- Skeleton loaders for dashboard/table pages.

Avoid:

- Turning every page section into a floating card.
- Nested cards inside cards.
- Marketing-style hero layouts inside the authenticated app.
- Decorative gradients/orbs as a main visual device.
- Mobile-only stacked layouts on desktop.

### 3.4 Visual Differentiator

To make the web app feel fresh while keeping the design system:

- Add a slim, high-contrast left rail with active route indicators.
- Use soft tinted status bands in dashboards.
- Use split views: list/table on left, context preview on right.
- Add a global command/search affordance in the header.
- Use role-aware accent states:
  - Landlord: primary blue-violet
  - Tenant: teal
  - Vendor: muted secondary blue-gray
- Use subtle data visualizations for status distribution and resolution time.

---

## 4. Technology Recommendation

Required stack:

- MongoDB
- Express.js
- React through Next.js
- Node.js
- TypeScript

Web framework:

- Next.js
- App Router
- TypeScript
- Server Components where useful
- Client Components for interactive dashboards, forms, tables, filters, drawers, realtime sockets, and authenticated app state
- fetch-based API client
- Redux Toolkit, RTK Query, or TanStack Query
- Inter font through `next/font`
- CSS Modules, Tailwind, or a local token-based CSS system

Recommended state approach:

- Use server-state tooling for fetched API data if available.
- Keep auth, UI shell, and session state in app state.
- Avoid duplicating backend entities across multiple local stores unless needed.

If using Redux Toolkit to match mobile:

- Keep slices similar to mobile for team familiarity.
- Consider RTK Query for request caching and invalidation.

Recommended Next.js project shape:

```txt
web/
  app/
    (public)/
      page.tsx
      auth/
        login/page.tsx
        register/page.tsx
        forgot-password/page.tsx
        reset-password/[token]/page.tsx
        invite/[token]/page.tsx
    (app)/
      app/
        layout.tsx
        dashboard/page.tsx
        requests/page.tsx
        requests/[requestId]/page.tsx
        properties/page.tsx
        properties/new/page.tsx
        properties/[propertyId]/page.tsx
        properties/[propertyId]/units/new/page.tsx
        units/[unitId]/edit/page.tsx
        users/page.tsx
        users/invite/page.tsx
        vendors/[vendorId]/page.tsx
        notifications/page.tsx
        settings/page.tsx
        settings/profile/page.tsx
        settings/password/page.tsx
        settings/organization/page.tsx
        billing/page.tsx
  components/
  features/
  lib/
    api/
    auth/
    tokens/
  store/
  styles/
  types/
```

Next.js architecture rules:

- Use route groups to separate public auth pages from authenticated app pages.
- Use middleware or protected layout logic to redirect unauthenticated users.
- Use server-rendered shells where practical, but keep token-dependent user interactions in client components unless cookie-based auth is introduced.
- Store tokens carefully. If the backend continues returning bearer tokens to the browser, prefer secure cookie mediation through Next.js route handlers in a future hardening pass.
- Keep backend API ownership in `backend/`; Next.js should call the existing Express API instead of duplicating business logic.
- Optional Next.js route handlers may be used as a thin proxy/BFF layer for auth cookies, file uploads, or Stripe redirect helpers.

---

## 5. Route Map

### 5.1 Public Routes

For now, the login page is the landing page.

```txt
/
/auth/login
/auth/register
/auth/forgot-password
/auth/reset-password/:token
/auth/invite/:token
```

Future public pages:

```txt
/home
/pricing
/features
/contact
/terms
/privacy
```

### 5.2 Authenticated Routes

```txt
/app/dashboard
/app/requests
/app/requests/:requestId
/app/properties
/app/properties/new
/app/properties/:propertyId
/app/properties/:propertyId/units/new
/app/units/:unitId/edit
/app/users
/app/users/invite
/app/vendors/:vendorId
/app/notifications
/app/settings
/app/settings/profile
/app/settings/password
/app/settings/organization
/app/billing
```

### 5.3 Tenant Routes

```txt
/app/my-requests
/app/my-requests/:requestId
/app/new-request
/app/notifications
/app/settings
/app/settings/profile
/app/settings/password
```

### 5.4 Vendor Routes

```txt
/app/assigned-requests
/app/assigned-requests/:requestId
/app/services
/app/notifications
/app/settings
/app/settings/profile
/app/settings/password
```

---

## 6. App Shell

### 6.1 Authenticated Layout

The authenticated app should use a shared shell:

```txt
┌─────────────────────────────────────────────────────────────┐
│ Top Command Bar                                             │
│ Breadcrumbs / Search / Quick Create / Notifications/Profile │
├───────────────┬─────────────────────────────────────────────┤
│ Sidebar       │ Main Page Content                           │
│ Navigation    │                                             │
│ Org Summary   │                                             │
│ Collapse      │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

### 6.2 Sidebar

Sidebar content is role-aware.

Landlord:

```txt
Dashboard
Requests
Properties
Users
Vendors
Notifications
Billing
Settings
```

Tenant:

```txt
My Requests
New Request
Notifications
Settings
```

Vendor:

```txt
Assigned Requests
Services
Notifications
Settings
```

Sidebar footer:

- Current organization name
- User role badge
- Collapse/expand control

### 6.3 Top Command Bar

Top bar should include:

- Current page title
- Breadcrumbs on detail pages
- Global search
- Quick Create button
- Notifications icon with unread indicator
- User/profile menu

Quick Create menu by role:

Landlord:

- Add property
- Add unit
- Invite user
- Create request

Tenant:

- New request

Vendor:

- Add service

---

## 7. Authentication & Onboarding

### 7.1 Login Page As Landing Page

Route:

```txt
/
/auth/login
```

Purpose:

- Primary public entrypoint for now.
- Login existing users.
- Route authenticated users into the app by role.

Layout:

- Full-height split screen.
- Left side: brand panel with Rentora logo and a tasteful abstract workflow/property visual.
- Right side: login form.
- No marketing hero yet.

Fields:

- Email
- Password

Actions:

- Login
- Forgot password
- Create landlord account

Do not show Apple/Google buttons unless real OAuth is implemented.

Data flow:

```txt
User enters email/password
POST /api/auth/login
Store accessToken and refreshToken
Store user
Redirect by role
Connect notifications socket
Register push/web notification capability later if supported
```

### 7.2 Register

Route:

```txt
/auth/register
```

Used for landlord signup.

Fields:

- Name
- Email
- Password
- Organization name

Data flow:

```txt
POST /api/auth/register
Backend creates landlord user
Backend creates organization
Backend starts trial state
Frontend stores tokens/user
Redirect to /app/dashboard
```

### 7.3 Forgot Password

Route:

```txt
/auth/forgot-password
```

Fields:

- Email

Data flow:

```txt
POST /api/auth/forgot-password
Show neutral success message
```

### 7.4 Reset Password

Route:

```txt
/auth/reset-password/:token
```

Fields:

- New password
- Confirm password

Data flow:

```txt
POST /api/auth/reset-password
Redirect to login on success
```

### 7.5 Invite Registration

Route:

```txt
/auth/invite/:token
```

Current backend support:

```txt
GET /api/invites/validate/:token
POST /api/invites/accept
```

Fields:

- Name
- Password
- Phone

Note:

The current backend has evolved so landlord-created vendor invites are auto-accepted and create a vendor account directly. The web UI must not promise a true pending vendor invite unless the backend flow is changed.

---

## 8. Role-Based Access

Use route guards:

```txt
RequireAuth
RequireRole
RequireActiveSubscription
```

Role rules:

LANDLORD:

- Full organization management.
- Can manage properties, units, users, vendors, and all requests.

TENANT:

- Can view own requests.
- Can create requests for assigned unit.
- Can delete request only before vendor assignment if backend allows.

VENDOR:

- Can view assigned requests.
- Can update status for assigned requests.
- Can manage own service list.

Subscription rules:

- Backend already gates most organization routes.
- Frontend should show clear subscription-required states when receiving `402`.

---

## 9. Landlord Experience

### 9.1 Landlord Dashboard

Route:

```txt
/app/dashboard
```

Purpose:

Central operational view for property managers.

Sections:

- Metric strip
- Request pipeline
- Recent activity
- Operational alerts
- Recent requests
- Quick actions

Metric cards:

- Total properties
- Total units
- Occupied units
- Vacant units
- Open requests
- Pending assignments
- In-progress requests
- Completed this month

Request pipeline:

- New
- Assigned
- In Progress
- Done
- Verified

Operational alerts:

- Urgent unassigned requests
- Requests older than threshold
- Vacant units
- Subscription/trial warnings

Data flow:

```txt
GET /api/requests
GET /api/properties
GET /api/units
GET /api/users?role=TENANT
GET /api/vendors
GET /api/subscriptions/status
```

Initial frontend can calculate aggregates from list endpoints. Later backend can add:

```txt
GET /api/organizations/summary
GET /api/dashboard/landlord
```

### 9.2 Requests List

Route:

```txt
/app/requests
```

Purpose:

Manage all maintenance requests for the organization.

Toolbar:

- Search by title, tenant, unit, property
- Status filter
- Property filter
- Urgency filter
- Vendor filter
- Date range filter
- Saved views
- Export future action

Table columns:

- Request title
- Status
- Urgency
- Property
- Unit
- Tenant
- Vendor
- Created date
- Updated date
- Row actions

Suggested saved views:

- All
- New
- Unassigned
- In Progress
- High Urgency
- Done Awaiting Verification

Data flow:

```txt
GET /api/requests
GET /api/properties
GET /api/vendors
```

### 9.3 Request Detail

Route:

```txt
/app/requests/:requestId
```

Layout:

- Main content column
- Right context panel

Main content:

- Request title
- Status badge
- Urgency badge
- Description
- Images
- Activity timeline
- Future comments/notes area

Right panel:

- Property information
- Unit information
- Tenant information
- Vendor assignment
- Created/assigned/completed timestamps

Actions:

- Assign vendor
- Update status
- Verify request
- Open property
- Open tenant
- Open vendor

Data flow:

```txt
GET /api/requests/:requestId
GET /api/properties/:propertyId
GET /api/units?propertyId=:propertyId
GET /api/users/:tenantId
GET /api/vendors
PATCH /api/requests/:requestId/assign
PATCH /api/requests/:requestId/status
PATCH /api/requests/:requestId/verify
```

### 9.4 Assign Vendor

Presentation:

- Drawer or modal from request detail.

Features:

- Search vendors
- Filter by service
- Show vendor status
- Show services
- Show rating if available

Data flow:

```txt
GET /api/vendors
PATCH /api/requests/:requestId/assign
```

### 9.5 Properties

Route:

```txt
/app/properties
```

Features:

- Property list/table
- Search by name/address
- Unit count
- Occupied/vacant count
- Active request count
- Add property

Data flow:

```txt
GET /api/properties
GET /api/units
GET /api/requests
```

### 9.6 Property Detail

Route:

```txt
/app/properties/:propertyId
```

Tabs:

```txt
Overview
Units
Requests
Tenants
```

Overview:

- Address
- Total units
- Occupancy summary
- Recent requests

Units:

- Unit table
- Add unit
- Edit unit
- Assign tenant if backend supports

Requests:

- Requests filtered by property

Tenants:

- Tenants assigned to units in this property

Data flow:

```txt
GET /api/properties/:propertyId
GET /api/units?propertyId=:propertyId
GET /api/requests?propertyId=:propertyId
GET /api/users?role=TENANT
```

### 9.7 Add/Edit Property

Routes:

```txt
/app/properties/new
/app/properties/:propertyId/edit
```

Fields:

- Property name
- Address line 1
- City
- State
- Country
- Zip

Data flow:

```txt
POST /api/properties
PATCH /api/properties/:propertyId
```

### 9.8 Add/Edit Unit

Routes:

```txt
/app/properties/:propertyId/units/new
/app/units/:unitId/edit
```

Fields:

- Unit number
- Rent amount
- Lease start
- Lease end
- Status
- Tenant assignment if safe

Data flow:

```txt
POST /api/units
PATCH /api/units/:unitId
```

### 9.9 Users

Route:

```txt
/app/users
```

Tabs:

```txt
Tenants
Vendors
Landlords
Invites
```

Tenant table:

- Name
- Email
- Phone
- Assigned unit
- Active status
- Created date
- Actions

Vendor table:

- Name
- Email
- Services
- Active status
- Rating
- Total jobs
- Actions

Landlords table:

- Name
- Email
- Active status

Invites:

- Email
- Role
- Accepted
- Expires at
- Future: resend/revoke

Data flow:

```txt
GET /api/users
GET /api/users?role=TENANT
GET /api/users?role=VENDOR
GET /api/invites
DELETE /api/users/:userId
```

### 9.10 Invite/Create User

Route:

```txt
/app/users/invite
```

Tenant creation:

- Name
- Email
- Phone
- Unit

Data flow:

```txt
GET /api/units
POST /api/users/tenant
```

Vendor creation:

- Email
- Optional name later
- Initial services later

Current data flow:

```txt
POST /api/invites
```

Important current behavior:

- The backend currently auto-creates vendor users with a temporary password.
- UI should label this clearly as creating a vendor account, not just sending an invite.

### 9.11 Vendor Detail

Route:

```txt
/app/vendors/:vendorId
```

Sections:

- Vendor profile
- Services
- Active assigned requests
- Completed jobs
- Notes

Data flow:

```txt
GET /api/vendors?userId=:vendorUserId
GET /api/requests?vendorId=:vendorId
PATCH /api/vendors/:vendorId
```

---

## 10. Tenant Experience

### 10.1 My Requests

Route:

```txt
/app/my-requests
```

Purpose:

Tenant request tracking.

Features:

- List own requests
- Status filter
- Sort active first
- Create request CTA
- Delete eligible request

Data flow:

```txt
GET /api/requests
GET /api/auth/me-assignment
DELETE /api/requests/:requestId
```

### 10.2 New Request

Route:

```txt
/app/new-request
```

Fields:

- Assigned unit display
- Title
- Description
- Urgency
- Photos

Current backend image behavior:

- Images are stored as URL strings.
- Mobile currently stores local URI strings.
- Proper web release should upload images to Cloudinary/S3 or a backend upload endpoint before creating the request.

Data flow:

```txt
GET /api/auth/me-assignment
POST /api/requests
```

Future upload flow:

```txt
Select files
Upload to Cloudinary/S3 via signed URL
Receive public image URLs
POST /api/requests with image URLs
```

### 10.3 Tenant Request Detail

Route:

```txt
/app/my-requests/:requestId
```

Sections:

- Request title
- Status
- Urgency
- Description
- Images
- Assigned vendor
- Property/unit context
- Timeline future

Actions:

- Delete if request is `NEW` and unassigned
- Add comments/photos in future

Data flow:

```txt
GET /api/requests/:requestId
GET /api/auth/me-assignment
DELETE /api/requests/:requestId
```

---

## 11. Vendor Experience

### 11.1 Assigned Requests

Route:

```txt
/app/assigned-requests
```

Purpose:

Vendor work queue.

Features:

- Assigned requests table/list
- Status filter
- Urgency filter
- Property/unit context
- Quick status actions

Data flow:

```txt
GET /api/requests
```

Backend scopes vendor requests automatically to the vendor profile associated with the logged-in user.

### 11.2 Vendor Request Detail

Route:

```txt
/app/assigned-requests/:requestId
```

Sections:

- Property info
- Tenant info
- Request description
- Images
- Current status
- Completion photos

Actions:

- Start work: `ASSIGNED -> IN_PROGRESS`
- Mark done: `IN_PROGRESS -> DONE`
- Upload completion images

Data flow:

```txt
GET /api/requests/:requestId
PATCH /api/requests/:requestId/status
PATCH /api/requests/:requestId/images
```

### 11.3 Vendor Services

Route:

```txt
/app/services
```

Features:

- View current services
- Add service
- Remove service
- Replace services

Data flow:

```txt
GET /api/vendor-services/me
POST /api/vendor-services/me
DELETE /api/vendor-services/me/:service
PUT /api/vendor-services/me
```

---

## 12. Shared Pages

### 12.1 Notifications

Route:

```txt
/app/notifications
```

Features:

- List notifications
- Filter unread/read
- Mark as read
- Open related request
- Realtime refresh

Data flow:

```txt
GET /api/notifications
PATCH /api/notifications/:notificationId/read
WS /ws/notifications?token=:accessToken
```

### 12.2 Profile

Route:

```txt
/app/settings/profile
```

Fields:

- Full name
- Email
- Profile image URL or upload later
- Landlord company info if landlord
- Tenant assignment info if tenant

Data flow:

```txt
GET /api/auth/profile
PATCH /api/auth/profile
GET /api/auth/me
```

### 12.3 Change Password

Route:

```txt
/app/settings/password
```

Fields:

- New password
- Confirm password

Data flow:

```txt
POST /api/auth/change-password
```

### 12.4 Organization Settings

Route:

```txt
/app/settings/organization
```

Landlord-only.

Fields:

- Organization name
- Company address

Data flow:

```txt
GET /api/organizations/me
PATCH /api/organizations
```

### 12.5 Billing

Route:

```txt
/app/billing
```

Landlord-only.

Sections:

- Current plan
- Subscription status
- Trial end date
- Unit limit
- Stripe checkout CTA

Data flow:

```txt
GET /api/subscriptions/status
POST /api/subscriptions/create-checkout
```

Future:

- Customer portal
- Invoice history
- Plan switching

---

## 13. Data Model Awareness

The web app should preserve the backend entity relationships:

```txt
Organization
  has many Users
  has many Properties
  has many Units
  has many Vendors
  has many Maintenance Requests

Property
  belongs to Organization
  has many Units
  has many Maintenance Requests

Unit
  belongs to Organization
  belongs to Property
  optionally has Tenant User

User
  belongs to Organization
  has role LANDLORD | TENANT | VENDOR

Vendor
  belongs to Organization
  links to User
  has services

MaintenanceRequest
  belongs to Organization
  belongs to Property
  belongs to Unit
  belongs to Tenant User
  optionally belongs to Vendor
```

Always assume `organizationId` is the tenant boundary.

---

## 14. Request Status Workflow

Backend workflow:

```txt
NEW -> ASSIGNED -> IN_PROGRESS -> DONE -> VERIFIED
```

Role rules:

Tenant:

- Can create request.
- Can view own requests.
- Cannot update status.
- Can delete own request only before assignment.

Landlord:

- Can assign vendor.
- Can move request through allowed transitions.
- Can verify done request.

Vendor:

- Can view assigned requests.
- Can update assigned request from `ASSIGNED` to `IN_PROGRESS`.
- Can update assigned request from `IN_PROGRESS` to `DONE`.
- Can upload images to assigned requests.

UI should disable invalid actions instead of letting users repeatedly hit backend errors.

---

## 15. Global User Data Flow

### 15.1 Session Flow

```txt
App loads
Read stored access token
GET /api/auth/me
If valid:
  hydrate auth user
  route by role
  connect notification socket
If invalid:
  clear tokens
  show login
```

### 15.2 Request Lifecycle

```txt
Tenant creates request
Backend stores request as NEW
Backend notifies landlords
Landlord sees request in dashboard and requests table
Landlord assigns vendor
Backend changes status to ASSIGNED
Backend notifies vendor
Vendor starts work
Backend changes status to IN_PROGRESS
Backend notifies tenant and landlord
Vendor marks done
Backend changes status to DONE
Landlord verifies
Backend changes status to VERIFIED
```

### 15.3 Property And Tenant Flow

```txt
Landlord creates property
Landlord creates units
Landlord creates tenant and assigns unit
Tenant logs in
Tenant creates maintenance request against assigned unit
```

### 15.4 Vendor Flow

```txt
Landlord creates vendor account
Vendor logs in
Vendor manages services
Landlord assigns request to vendor
Vendor updates request status
```

---

## 16. Frontend State Plan

Recommended app state:

```ts
auth: {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  initializing: boolean
  loading: boolean
  error: string | null
}

organization: {
  current: Organization | null
  subscriptionStatus: SubscriptionStatus | null
  loading: boolean
  error: string | null
}

requests: {
  items: RequestItem[]
  selected: RequestItem | null
  filters: RequestFilters
  loading: boolean
  error: string | null
}

properties: {
  items: PropertyItem[]
  selected: PropertyItem | null
  loading: boolean
  error: string | null
}

units: {
  items: UnitItem[]
  selected: UnitItem | null
}

users: {
  items: UserItem[]
  tenants: UserItem[]
  vendors: UserItem[]
  selected: UserItem | null
}

vendors: {
  items: VendorItem[]
  selected: VendorItem | null
}

notifications: {
  items: NotificationItem[]
  unreadCount: number
  socketConnected: boolean
}

ui: {
  sidebarCollapsed: boolean
  activeModal: string | null
  activeDrawer: string | null
  toast: ToastState | null
  commandPaletteOpen: boolean
}
```

---

## 17. API Client Requirements

The web API client should:

- Use the same backend base URL pattern as mobile.
- Attach `Authorization: Bearer <token>`.
- Clear tokens on `401`.
- Show subscription-specific UI on `402`.
- Normalize error messages.
- Support request cancellation on route changes where useful.

Core endpoints:

```txt
POST /api/auth/login
POST /api/auth/register
GET /api/auth/me
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/change-password
GET /api/auth/profile
PATCH /api/auth/profile
GET /api/auth/me-assignment

GET /api/properties
POST /api/properties
GET /api/properties/:id
PATCH /api/properties/:id
DELETE /api/properties/:id

GET /api/units
POST /api/units
PATCH /api/units/:id
DELETE /api/units/:id

GET /api/requests
POST /api/requests
GET /api/requests/:id
DELETE /api/requests/:id
PATCH /api/requests/:id/status
PATCH /api/requests/:id/images
PATCH /api/requests/:id/assign
PATCH /api/requests/:id/verify

GET /api/users
POST /api/users/tenant
GET /api/users/:id
PATCH /api/users/:id
DELETE /api/users/:id

GET /api/vendors
POST /api/vendors
PATCH /api/vendors/:id
DELETE /api/vendors/:id

GET /api/vendor-services/me
PUT /api/vendor-services/me
POST /api/vendor-services/me
DELETE /api/vendor-services/me/:service

GET /api/notifications
POST /api/notifications/register-token
PATCH /api/notifications/:id/read

GET /api/organizations/me
PATCH /api/organizations

GET /api/subscriptions/status
POST /api/subscriptions/create-checkout

GET /api/invites
POST /api/invites
GET /api/invites/validate/:token
POST /api/invites/accept
```

---

## 18. Component Plan

### 18.1 Layout Components

- `AppShell`
- `Sidebar`
- `TopBar`
- `Breadcrumbs`
- `PageHeader`
- `ContentGrid`
- `SplitPane`
- `RightDrawer`
- `Dialog`

### 18.2 Form Components

- `TextField`
- `PasswordField`
- `Select`
- `Combobox`
- `DateField`
- `Textarea`
- `FileUploader`
- `FormSection`
- `FormActions`

### 18.3 Data Components

- `DataTable`
- `TableToolbar`
- `FilterBar`
- `StatusBadge`
- `UrgencyBadge`
- `RoleBadge`
- `MetricCard`
- `EmptyState`
- `Skeleton`
- `Pagination`

### 18.4 Domain Components

- `RequestStatusPipeline`
- `RequestTimeline`
- `RequestImages`
- `VendorPicker`
- `PropertySummary`
- `UnitOccupancySummary`
- `UserInviteForm`
- `SubscriptionStatusCard`
- `NotificationList`

---

## 19. UX States

Each data page should support:

- Loading
- Empty
- Error
- Success
- Refreshing
- Filtering with no results
- Permission denied
- Subscription inactive

Every destructive action should use a confirmation dialog:

- Delete property
- Delete unit
- Delete user
- Delete request
- Future revoke invite

---

## 20. Responsive Behavior

Desktop:

- Full sidebar and command bar.
- Tables as primary data view.
- Detail pages use two columns.

Tablet:

- Collapsible sidebar.
- Tables may hide secondary columns.
- Right panels become drawers.

Mobile web:

- Sidebar becomes drawer.
- Tables become stacked rows.
- Keep actions accessible in row menus.

The web app can be responsive, but native mobile remains the primary mobile experience.

---

## 21. Accessibility Requirements

- All form fields must have labels.
- All icon-only buttons must have accessible labels.
- Minimum hit target: 44px.
- Keyboard navigation for sidebar, menus, dialogs, tables, and forms.
- Focus trap inside modals/drawers.
- Visible focus rings.
- Do not rely on color alone for statuses.
- Use semantic buttons and links.

---

## 22. Realtime Notifications

Connect WebSocket after login:

```txt
WS /ws/notifications?token=:accessToken
```

On `notifications:updated`:

- Refresh notifications count.
- Refresh affected request lists if current page depends on request data.
- Show toast for visible updates where helpful.

Recommended behavior:

- Landlord dashboard and request list refresh on notification events.
- Request detail refreshes if event reference matches current request.
- Notification bell updates unread count.

---

## 23. Image Upload Strategy

Current backend accepts image URL strings on requests.

For production-quality web:

1. User selects image files.
2. Frontend uploads images to Cloudinary/S3 using signed upload.
3. Upload service returns image URLs.
4. Frontend submits image URLs to backend.

Needed backend addition:

```txt
POST /api/uploads/sign
```

or:

```txt
POST /api/uploads
```

Until this exists, the web app can support URL entry for internal/demo builds.

---

## 24. Known Backend/Mobile Reality Notes

These are important mismatches to remember while building web:

- Vendor invites currently auto-create vendor users and mark invites as accepted.
- Tenant creation currently uses a temporary password flow.
- There is no comments/timeline API yet.
- There is an `ActivityLog` model, but request timelines are not fully exposed through API routes.
- Request images are URL arrays, not uploaded files.
- Landlord dashboard summary endpoints do not exist yet.
- Billing exists as checkout/status endpoints, but there is no full subscription management UI.
- Web public marketing pages are future scope.
- OAuth buttons in mobile are visual-only and should not be copied to web unless OAuth is implemented.

---

## 25. Implementation Roadmap

### Phase 1: Foundation

- Create Next.js web app project.
- Add routing.
- Add token-aware API client.
- Add auth/session bootstrap.
- Add role guards.
- Add app shell.
- Add base design tokens and shared components.

### Phase 2: Landlord MVP

- Dashboard.
- Requests list.
- Request detail.
- Assign vendor flow.
- Properties list.
- Property detail.
- Add/edit property.
- Add/edit unit.

### Phase 3: User Management

- Users page.
- Tenant creation.
- Vendor creation/invite.
- Vendor detail.
- Delete user confirmations.

### Phase 4: Tenant Web

- My requests.
- New request.
- Tenant request detail.
- Tenant profile/settings.

### Phase 5: Vendor Web

- Assigned requests.
- Vendor request detail.
- Vendor services.
- Vendor profile/settings.

### Phase 6: Shared Systems

- Notifications page.
- Notification bell.
- WebSocket refresh.
- Billing page.
- Organization settings.
- Password/profile flows.

### Phase 7: Polish

- Skeleton loaders.
- Empty states.
- Better table filtering.
- Responsive layouts.
- Accessibility pass.
- Error state polish.
- Optional charts.

---

## 26. Suggested First Build Milestone

The first usable web release should include:

- Login as landing page.
- Register landlord.
- Session restore.
- Role-based redirect.
- Landlord app shell.
- Landlord dashboard.
- Requests table.
- Request detail.
- Assign vendor.
- Properties list/detail.
- Add property and add unit.
- Users list.
- Create tenant/vendor account.
- Settings/profile/password.

This gives landlords the core desktop management loop first, which is the highest-value web use case.

---

## 27. Success Criteria

The web app is successful when:

- A landlord can manage properties, units, users, vendors, and requests faster than on mobile.
- A tenant can submit and track a request from web if needed.
- A vendor can manage assigned work from web if needed.
- Realtime updates are visible without manual reload.
- UI feels like Rentora, but not like a stretched mobile app.
- The app preserves organization isolation and role permissions.
- The first screen is login until public pages are intentionally added.
