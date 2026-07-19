export type UserRole = "LANDLORD" | "TENANT" | "VENDOR";

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type InviteValidationResponse = {
  email: string;
  role: UserRole;
  organizationId: string;
  expiresAt: string;
};
