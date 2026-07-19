import type { RequestStatus, UrgencyLevel, UserRole } from "@/lib/design-system";

export type RequestItem = {
  _id: string;
  title: string;
  description: string;
  images?: string[];
  status: RequestStatus;
  urgency: UrgencyLevel;
  tenantId?: string;
  vendorId?: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  tenantName?: string;
  vendorName?: string;
  vendorServices?: string[];
  createdAt: string;
  updatedAt?: string;
};

export type PropertyItem = {
  _id: string;
  name: string;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    country?: string;
    zip?: string;
  };
  totalUnits?: number;
  createdAt?: string;
};

export type UnitItem = {
  _id: string;
  propertyId: string;
  unitNumber: string;
  tenantId?: string;
  rentAmount?: number;
  leaseStart?: string;
  leaseEnd?: string;
  status: "OCCUPIED" | "VACANT";
  createdAt?: string;
};

export type VendorItem = {
  _id: string;
  userId?: string | {
    _id?: string;
    email?: string;
    name?: string;
  };
  name?: string;
  email?: string;
  services?: string[];
  rating?: number;
  totalJobs?: number;
  isActive?: boolean;
  createdAt?: string;
};

export type UserItem = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedUnitNumber?: string | null;
  createdAt?: string;
};

export type SubscriptionStatus = {
  subscriptionStatus?: string;
  planType?: string;
  unitLimit?: number;
  trialEndsAt?: string;
};

export type NotificationItem = {
  _id: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  referenceId?: string;
  title: string;
  type: string;
};
