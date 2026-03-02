# Rentora --- Hybrid Mobile SaaS Plan (MERN Edition)

A property management automation mobile app built with a pure MERN
stack, focused on small landlords (5--50 units), student housing, and
short-term rental operators.

------------------------------------------------------------------------

## Product Vision

Rentora centralizes:

-   Tenant maintenance requests\
-   Vendor assignments\
-   Status tracking\
-   Automatic notifications\
-   Subscription billing

Goal:

> Remove scattered WhatsApp messages, emails, and manual follow-ups ---
> replace them with a clean structured workflow.

------------------------------------------------------------------------

## Core Architecture

### Frontend (Hybrid Mobile)

-   React Native (Expo or CLI)
-   TypeScript
-   Redux Toolkit
-   React Navigation
-   Axios
-   Stripe React Native SDK
-   Firebase Cloud Messaging (Push Notifications)

### Backend

-   Node.js
-   Express.js
-   MongoDB (Atlas recommended)
-   Mongoose
-   JWT Authentication
-   Role-based middleware
-   Stripe API
-   Cloudinary / S3 for images

### Hosting

-   VPS (Ubuntu)
-   NGINX
-   PM2 (cluster mode)
-   SSL (Let's Encrypt)
-   MongoDB Atlas (recommended)

------------------------------------------------------------------------

## User Role System

### Default Role

When a user signs up normally:

**Default Role = LANDLORD**

Why? - Paying customer - Creates organization - Manages properties and
invites others

------------------------------------------------------------------------

## Role Assignment Flow

### Step 1 -- Landlord Registers

-   Account created
-   Organization created
-   Role = LANDLORD
-   Stripe trial started

### Step 2 -- Landlord Invites Users

Can invite: - TENANT - VENDOR

Invite includes: - Email - Role - Organization ID - Optional Unit ID

### Step 3 -- Invited User Registers

-   System checks invite token
-   Role pre-assigned
-   Linked to organization
-   Access controlled via RBAC

------------------------------------------------------------------------

## Database Design (MongoDB)

### Users Collection

``` js
{
  _id,
  name,
  email,
  password,
  role: "LANDLORD" | "TENANT" | "VENDOR",
  organizationId,
  phone,
  createdAt
}
```

### Organizations Collection

``` js
{
  _id,
  name,
  ownerId,
  stripeCustomerId,
  stripeSubscriptionId,
  planType,
  unitLimit,
  createdAt
}
```

### Properties Collection

``` js
{
  _id,
  organizationId,
  name,
  address,
  createdAt
}
```

### Units Collection

``` js
{
  _id,
  propertyId,
  organizationId,
  unitNumber,
  tenantId,
  rentAmount,
  leaseStart,
  leaseEnd
}
```

### Vendors Collection

``` js
{
  _id,
  userId,
  organizationId,
  services: ["plumbing", "electrical"],
  rating,
  notes
}
```

### Maintenance Requests Collection

``` js
{
  _id,
  organizationId,
  propertyId,
  unitId,
  tenantId,
  vendorId,
  title,
  description,
  images: [],
  status: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "DONE",
  urgency,
  activityLogs: [],
  createdAt
}
```

### Indexing Strategy

Index: - organizationId - status - propertyId - vendorId

Always filter queries by organizationId.

------------------------------------------------------------------------

## Status Workflow

NEW → ASSIGNED → IN_PROGRESS → DONE\
Optional: DONE → VERIFIED

------------------------------------------------------------------------

## Mobile App Views

### Tenant

-   Submit request
-   Upload photos
-   Track status
-   Receive notifications

### Manager (Landlord)

-   Dashboard overview
-   Filter by property & status
-   Assign vendor
-   Change status
-   Add properties & units
-   Invite users

### Vendor

-   View assigned requests
-   Update status
-   Upload completion photos

------------------------------------------------------------------------

## Notifications

Triggered on: - New request - Vendor assignment - Status change -
Completion

Sent via: - Push (FCM) - Optional email

------------------------------------------------------------------------

## Monetization (Stripe)

### Pricing Options

**Per Unit** - \$2--\$5 per unit/month

**Tiered** - 5--20 units → \$29/month - 21--50 units → \$79/month

### Stripe Flow

-   Create Product
-   Tiered pricing
-   Webhooks:
    -   invoice.paid
    -   subscription.deleted

On payment: - Update organization plan - Enforce unit limit

------------------------------------------------------------------------

## Authentication & Security

-   JWT Access Token
-   Refresh Token
-   Role-based middleware
-   Organization query filtering
-   Stripe webhook verification
-   Signed URL image uploads

------------------------------------------------------------------------

## API Structure

POST /auth/register\
POST /auth/login

GET /properties\
POST /properties

GET /units\
POST /units

GET /requests\
POST /requests\
PATCH /requests/:id/status\
PATCH /requests/:id/assign

POST /invite\
GET /vendors\
POST /vendors

------------------------------------------------------------------------

## Backend Folder Structure

    src/
     ├── config/
     ├── controllers/
     ├── routes/
     ├── models/
     ├── middlewares/
     ├── services/
     ├── utils/
     ├── jobs/
     └── server.js

------------------------------------------------------------------------

## Mobile Folder Structure

    src/
     ├── screens/
     ├── components/
     ├── navigation/
     ├── store/
     ├── slices/
     ├── services/
     ├── hooks/
     └── utils/

------------------------------------------------------------------------

## Development Roadmap

### Phase 1 -- MVP (4--6 Weeks)

-   Auth system
-   Organization system
-   Property & unit CRUD
-   Maintenance request flow
-   Status tracking
-   Push notifications
-   Stripe subscription

### Phase 2

-   In-app chat
-   Vendor rating
-   Analytics dashboard
-   Activity timeline

### Phase 3

-   Rent tracking
-   Expense tracking
-   AI categorization
-   Auto vendor assignment

------------------------------------------------------------------------

## Key Metrics

-   Active units
-   Requests per unit
-   Average resolution time
-   Vendor performance
-   Churn rate
-   MRR

------------------------------------------------------------------------

## Final Summary

Rentora is a MERN-based hybrid mobile SaaS platform for small landlords.

Architecture: - React Native + Redux - Express backend - MongoDB -
Stripe billing - FCM notifications - VPS deployment

Role Model: - Default role = LANDLORD - Tenants & vendors invited -
Single users collection - Role-based access control

Multi-tenant system built using organizationId isolation.
