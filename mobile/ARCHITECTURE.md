# Rentora Mobile Architecture

## 1. Navigation Structure (Role-Based)

### Root Navigation Flow
```
RootNavigator
├── AuthStack (unauthenticated users)
│   ├── Login
│   ├── Register
│   └── (future: Password Reset, Invite Accept)
└── AppStack (authenticated users)
    ├── LandlordTabs (role: LANDLORD)
    │   ├── Dashboard (DashboardScreen)
    │   ├── Properties (PropertiesScreen) → Property Detail Modal
    │   ├── Requests (RequestsScreen) → Request Detail Modal → Vendor Assignment Flow
    │   ├── Vendors (VendorsScreen) → Vendor Detail Modal
    │   ├── Tenants (TenantsScreen) → Tenant Detail Modal
    │   └── Account (ProfileScreen)
    ├── TenantTabs (role: TENANT)
    │   ├── Dashboard (DashboardScreen - tenant summary)
    │   ├── Create Request (CreateRequestScreen)
    │   ├── My Requests (RequestsScreen - filtered to user)
    │   ├── Notifications (NotificationsScreen)
    │   └── Account (ProfileScreen)
    └── VendorTabs (role: VENDOR)
        ├── Dashboard (DashboardScreen - vendor summary)
        ├── Assigned Requests (RequestsScreen - filtered to assigned)
        ├── Completed (CompletedRequestsScreen)
        ├── Ratings (RatingsScreen)
        └── Account (ProfileScreen)
```

### Navigation Type Definitions
- **RootStackParamList**: Auth vs App routing
- **AuthStackParamList**: Login, Register, etc.
- **LandlordTabParamList**: Dashboard, Properties, Requests, Vendors, Tenants, Profile
- **TenantTabParamList**: Dashboard, Create, Requests, Notifications, Profile
- **VendorTabParamList**: Dashboard, Assigned, Completed, Ratings, Profile
- **DetailsStackParamList**: Modal stacks for property/request/vendor/tenant details

## 2. Folder Structure

```
mobile/
├── src/
│   ├── components/
│   │   ├── AppButton.tsx       # Reusable button with variants
│   │   ├── ScreenContainer.tsx # Reusable screen wrapper
│   │   ├── StatusBadge.tsx     # Request status display
│   │   ├── RequestCard.tsx     # Request list item component
│   │   ├── PropertyCard.tsx    # Property list item component
│   │   ├── VendorCard.tsx      # Vendor list item component
│   │   ├── EmptyState.tsx      # Empty list component
│   │   ├── LoadingSpinner.tsx  # Loading indicator
│   │   └── ErrorState.tsx      # Error display with retry
│   ├── constants/
│   │   ├── navigationConstants.ts   # Route names, deep link config
│   │   └── requestStatusConfig.ts   # Status colors, labels
│   ├── hooks/
│   │   ├── useAppDispatch.ts
│   │   ├── useAppSelector.ts
│   │   ├── useNavigation.ts        # Typed navigation hook
│   │   └── useRequestFilters.ts    # Request filtering logic
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # Main entry point
│   │   ├── AuthNavigator.tsx       # Auth stack
│   │   ├── LandlordNavigator.tsx   # Landlord role stack
│   │   ├── TenantNavigator.tsx     # Tenant role stack
│   │   ├── VendorNavigator.tsx     # Vendor role stack
│   │   ├── types.ts                # Navigation type definitions
│   │   ├── linking.ts              # Deep linking config
│   │   └── screenOptions.ts        # Shared screen options
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── common/
│   │   │   ├── DashboardScreen.tsx      # Role-aware dashboard
│   │   │   ├── ProfileScreen.tsx        # Role-aware profile
│   │   │   └── NotificationsScreen.tsx
│   │   ├── landlord/
│   │   │   ├── PropertiesScreen.tsx
│   │   │   ├── PropertyDetailScreen.tsx (modal)
│   │   │   ├── TenantsScreen.tsx
│   │   │   ├── TenantDetailScreen.tsx (modal)
│   │   │   ├── VendorsScreen.tsx
│   │   │   ├── VendorDetailScreen.tsx (modal)
│   │   │   ├── RequestsScreen.tsx
│   │   │   ├── RequestDetailScreen.tsx (modal)
│   │   │   └── AssignVendorScreen.tsx (modal)
│   │   ├── tenant/
│   │   │   ├── CreateRequestScreen.tsx
│   │   │   ├── RequestsScreen.tsx       # Tenant-filtered
│   │   │   └── RequestDetailScreen.tsx (modal)
│   │   └── vendor/
│   │       ├── AssignedRequestsScreen.tsx
│   │       ├── RequestDetailScreen.tsx (modal)
│   │       ├── CompletedRequestsScreen.tsx
│   │       ├── RatingsScreen.tsx
│   │       └── UpdateStatusScreen.tsx (modal)
│   ├── services/
│   │   ├── api.ts                 # Axios instance + interceptors
│   │   ├── authStorage.ts         # Token persistence
│   │   └── requestService.ts      # Request-specific API calls
│   ├── slices/
│   │   ├── authSlice.ts           # Auth state (user, loading, error)
│   │   ├── requestsSlice.ts       # Requests state (items, filters)
│   │   ├── propertiesSlice.ts     # Properties state (landlord)
│   │   ├── vendorsSlice.ts        # Vendors state (landlord)
│   │   └── notificationsSlice.ts  # Notifications state
│   ├── store/
│   │   └── index.ts               # Redux store configuration
│   ├── types/
│   │   ├── api.ts                 # API response types
│   │   ├── models.ts              # Domain model types
│   │   └── navigation.ts          # Navigation param types
│   ├── utils/
│   │   ├── theme.ts               # Colors, typography, spacing
│   │   ├── validators.ts          # Form validation logic
│   │   ├── formatters.ts          # Date, currency formatting
│   │   └── errorHandler.ts        # Error message mapping
│   ├── App.tsx
│   └── index.ts
├── ARCHITECTURE.md (this file)
└── package.json
```

## 3. Screen Hierarchy & Purpose

### Auth Stack
- **LoginScreen**: Email/password login with error handling
- **RegisterScreen**: Organization + user creation

### All Roles (Common)
- **DashboardScreen** (role-aware):
  - Landlord: Properties at glance, recent requests, vendor rating trends
  - Tenant: Personal requests summary, maintenance status, notifications
  - Vendor: Assigned requests, completion metrics, ratings

- **ProfileScreen** (role-aware):
  - Landlord: Org details, subscription, team members, sign out
  - Tenant: Account details, contact info, preferences, sign out
  - Vendor: Profile rating, availability, services, sign out

- **NotificationsScreen**:
  - List unread notifications
  - Group by type (new request, status update, etc.)
  - Mark as read on tap

### Landlord Only
- **PropertiesScreen**: List all org properties with unit counts, rent collection status
  - → PropertyDetailScreen (modal): Edit property, view units, view tenants
- **TenantsScreen**: List all org tenants, contact info, status
  - → TenantDetailScreen (modal): Tenant details, lease info, request history
- **VendorsScreen**: List all org vendors, ratings, active jobs
  - → VendorDetailScreen (modal): Vendor profile, reviews, services
- **RequestsScreen** (landlord view): All org requests by status
  - → RequestDetailScreen (modal): Full request details, images, timeline
  - → AssignVendorScreen (modal): Pick vendor, add notes

### Tenant Only
- **CreateRequestScreen**: Form to submit new maintenance request
  - Select property → Select unit → Fill request details
  - Validates org subscription actively before submission
- **RequestsScreen**: Personal requests only, status badges, timestamps
  - → RequestDetailScreen (modal): View status, assigned vendor, notes

### Vendor Only
- **AssignedRequestsScreen**: Requests assigned to vendor
  - → RequestDetailScreen (modal): View full details, images
  - → UpdateStatusScreen (modal): Change status (ASSIGNED→IN_PROGRESS→DONE)
- **CompletedRequestsScreen**: Archived completed requests
- **RatingsScreen**: Average rating, review breakdown, history

## 4. Redux Store Structure

```typescript
// RootState
{
  auth: {
    user: AuthUser | null           // Currently logged-in user + role
    loading: boolean
    initializing: boolean             // Session bootstrap state
    error: string | null
  }
  requests: {
    items: RequestItem[]             // Filtered by role + org
    loading: boolean
    creating: boolean
    error: string | null
    filters: {
      status?: RequestStatus
      propertyId?: string
      vendorId?: string
      dateRange?: { start: Date; end: Date }
      sortBy: "createdAt" | "urgency" | "status"
    }
  }
  properties: {                        // Landlord only
    items: Property[]
    loading: boolean
    error: string | null
  }
  vendors: {                           // Landlord only
    items: Vendor[]
    loading: boolean
    error: string | null
  }
  notifications: {
    items: Notification[]
    unreadCount: number
    loading: boolean
  }
}
```

## 5. API Integration Strategy

### Base Configuration
- **Base URL**: `http://localhost:5000/api` (dev), configured via `.env`
- **Request Interceptor**: Attach JWT Bearer token from AsyncStorage
- **Response Interceptor**: Handle 401 → clear tokens → navigate to login

### Endpoint Mapping by Role

**Auth (Public)**
- `POST /auth/login` → login thunk → Redux state
- `POST /auth/register` → register thunk → Redux state
- `GET /auth/me` → bootstrapSession thunk → session restore
- `POST /auth/logout` → logout thunk → clear state

**Requests**
- `GET /requests` → fetchRequests thunk (filtered by role + org)
- `POST /requests` → createMaintenanceRequest thunk
- `PATCH /requests/:id/status` → updateRequestStatus thunk
- `PATCH /requests/:id/assign` → assignVendor thunk (landlord)

**Properties (Landlord)**
- `GET /properties` → fetchProperties thunk
- `GET /properties/:id` → getPropertyDetail
- `POST /properties` → createProperty thunk
- `PATCH /properties/:id` → updateProperty thunk

**Vendors (Landlord)**
- `GET /vendors` → fetchVendors thunk
- `GET /vendors/:id` → getVendorDetail
- `POST /vendors` → createVendor thunk
- `PATCH /vendors/:id` → updateVendor thunk

**Users (Tenant list, Landlord)**
- `GET /users?role=TENANT` → fetchTenants thunk
- `GET /users/:id` → getUserDetail

**Notifications**
- `GET /notifications` → fetchNotifications thunk
- `PATCH /notifications/:id/read` → markNotificationRead thunk

### Error Handling
- 400: Form validation errors → display field-specific messages
- 401: Invalid token → logout + navigate to login
- 403: Insufficient permissions → show error toast
- 404: Resource not found → show "Not found" screen
- 500: Server error → show generic "We're having issues" message + retry button

## 6. Type Safety

### Navigation Types
```typescript
type RootStackParamList = {
  Auth: undefined
  App: undefined
}

type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

type LandlordTabParamList = {
  Dashboard: undefined
  Properties: undefined
  Requests: undefined
  Vendors: undefined
  Tenants: undefined
  Profile: undefined
  // Modals are in separate stacks
}

type DetailsStackParamList = {
  PropertyDetail: { propertyId: string }
  RequestDetail: { requestId: string }
  VendorDetail: { vendorId: string }
  AssignVendor: { requestId: string }
}
```

### Data Types
```typescript
interface AuthUser {
  _id: string
  name: string
  email: string
  role: 'LANDLORD' | 'TENANT' | 'VENDOR'
  organizationId: string
}

interface RequestItem {
  _id: string
  title: string
  description: string
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  tenantId: string
  propertyId: string
  unitId: string
  vendorId?: string
  createdAt: string
  updatedAt: string
  images?: string[]
}
```

## 7. App Bootstrap Flow

```
App.tsx
  ↓
1. Load Inter fonts (4 weights)
  ↓
2. Provide Redux store to app
  ↓
3. BootstrapGate component:
   a. Dispatch bootstrapSession thunk
   b. Check AsyncStorage for tokens
   c. If tokens exist: GET /auth/me
   d. If valid: Set user in Redux state
   e. If invalid/expired: Clear tokens
  ↓
4. When initializing = false (bootstrap complete)
   → Render RootNavigator
  ↓
5. RootNavigator checks Redux user state:
   → user exists? Render role-specific AppStack
   → no user? Render AuthStack
  ↓
6. TabNavigator renders role-specific tabs based on user.role
```

## 8. Screen Transitions

### Tenant User Journey
```
LoginScreen
  ↓ (successful login)
DashboardScreen
  ├─ Tab: "Create Request" → CreateRequestScreen
  │   ↓ (submit)
  │   → RequestsScreen (updated list)
  │
  ├─ Tab: "My Requests" → RequestsScreen
  │   ↓ (tap request card)
  │   → RequestDetailScreen (modal)
  │
  └─ Tab: "Account" → ProfileScreen
      ↓ (Sign Out button)
      → LoginScreen
```

### Landlord User Journey
```
LoginScreen
  ↓ (successful login)
DashboardScreen
  ├─ Tab: "Properties" → PropertiesScreen
  │   ↓ (tap property card)
  │   → PropertyDetailScreen (modal)
  │
  ├─ Tab: "Requests" → RequestsScreen
  │   ↓ (tap request + Assign button)
  │   → AssignVendorScreen (modal)
  │       ↓ (select vendor)
  │       → Back to RequestDetailScreen
  │
  ├─ Tab: "Vendors" → VendorsScreen
  │   ↓ (tap vendor)
  │   → VendorDetailScreen (modal)
  │
  └─ Tab: "Account" → ProfileScreen
```

### Vendor User Journey
```
LoginScreen
  ↓ (successful login)
DashboardScreen
  ├─ Tab: "Assigned Requests" → AssignedRequestsScreen
  │   ↓ (tap request)
  │   → RequestDetailScreen (modal)
  │       ↓ (Update Status button)
  │       → UpdateStatusScreen (modal)
  │
  ├─ Tab: "Completed" → CompletedRequestsScreen
  │
  ├─ Tab: "Ratings" → RatingsScreen
  │
  └─ Tab: "Account" → ProfileScreen
```

## 9. Validation Layer

### Form Validation
- **Login**: Email required & valid, password required
- **Register**: Name required, email valid, password 8+ chars, org name required
- **Create Request**: Property + Unit selected, title required (min 5 chars), description (min 10 chars)
- **Assign Vendor**: Vendor selected (required)

### Business Logic Validation
- **Create Request**: User must be TENANT, org subscription must be ACTIVE/TRIALING
- **Assign Vendor**: User must be LANDLORD, request must be in NEW status
- **Update Status**: User must be assigned VENDOR, transition must be legal

## 10. Error & Loading States

### Loading States
- **Screen level**: Full-screen spinner with message (e.g., "Loading requests...")
- **Item level**: Skeleton loaders in card positions
- **Button level**: Disabled state + activity indicator during submission

### Error States
- **Retry able errors** (4xx/5xx): Show error message + "Retry" button
- **Session errors** (401): Auto-logout + redirect to login
- **Network errors**: Show "Connection lost. Please check your internet." + retry

### Empty States
- **No results**: Contextual message (e.g., "No properties yet" on PropertiesScreen)
- **No auth**: Show LoginScreen

## 11. Performance Considerations

- **Pagination**: RequestsScreen supports paginated API calls
- **Caching**: Redux state persists between screens, fresh fetch on tab reactivation
- **Code splitting**: Role-specific screen imports lazy-loaded
- **Image caching**: Request images downloaded once, cached by Expo
- **Memo optimization**: RequestCard, PropertyCard components memo-wrapped to prevent rerenders

## 12. Accessibility

- Screen reader support via accessible labels on custom components
- Minimum touch target size: 48px (all buttons)
- Color contrast: WCAG AA compliant (text on backgrounds)
- Form labels associated with input fields
- Error messages linked to form fields

## 13. Deep Linking Configuration

```typescript
linking: {
  prefixes: ['rentora://', 'https://rentora.app'],
  config: {
    screens: {
      Auth: 'auth/:action',
      App: {
        screens: {
          Dashboard: 'dashboard',
          Requests: 'requests/:requestId?',
          Properties: 'properties/:propertyId?',
          Vendors: 'vendors/:vendorId?',
          Profile: 'profile'
        }
      }
    }
  }
}
```

---

**This architecture ensures:**
- Type-safe navigation across all roles
- Clear separation of concerns (auth vs app, role-specific stacks)
- Scalable API integration strategy
- Consistent user experience across roles
- Production-ready error handling and loading states
