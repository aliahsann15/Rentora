import { API_BASE_URL } from "@/lib/api/config";
import type { AuthResponse, InviteValidationResponse } from "./types";

type LoginPayload = {
  email: string;
  password: string;
};

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

async function postJson<TResponse, TPayload extends object>(
  path: string,
  payload: TPayload
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = await readJson<TResponse & { message?: string }>(response);

  if (!response.ok) {
    throw new Error(data?.message || "Unable to process request. Please try again.");
  }

  if (!data) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}

function assertAuthResponse(data: AuthResponse, message: string): AuthResponse {
  if (!data.user || !data.accessToken || !data.refreshToken) {
    throw new Error(message);
  }

  return data;
}

export async function loginWithPassword(payload: LoginPayload): Promise<AuthResponse> {
  const data = await postJson<AuthResponse, LoginPayload>("/auth/login", payload);
  return assertAuthResponse(data, "The server returned an incomplete login response.");
}

export async function registerLandlord(payload: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}): Promise<AuthResponse> {
  const data = await postJson<AuthResponse, typeof payload>("/auth/register", payload);
  return assertAuthResponse(data, "The server returned an incomplete registration response.");
}

export async function requestPasswordReset(payload: { email: string }): Promise<{ message: string }> {
  return postJson<{ message: string }, typeof payload>("/auth/forgot-password", payload);
}

export async function resetPassword(payload: { token: string; password: string }): Promise<{ message: string }> {
  return postJson<{ message: string }, typeof payload>("/auth/reset-password", payload);
}

export async function validateInviteToken(token: string): Promise<InviteValidationResponse> {
  const response = await fetch(`${API_BASE_URL}/invites/validate/${encodeURIComponent(token)}`);
  const data = await readJson<InviteValidationResponse & { message?: string }>(response);

  if (!response.ok) {
    throw new Error(data?.message || "Invalid or expired invite token.");
  }

  if (!data?.email || !data.role || !data.organizationId) {
    throw new Error("The server returned an incomplete invite response.");
  }

  return data;
}

export async function registerFromInvite(payload: {
  token: string;
  name: string;
  password: string;
  phone?: string;
}): Promise<AuthResponse> {
  const data = await postJson<AuthResponse, typeof payload>("/invites/accept", payload);
  return assertAuthResponse(data, "The server returned an incomplete invite registration response.");
}
