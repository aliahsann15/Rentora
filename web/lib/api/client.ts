import { API_BASE_URL } from "./config";
import { clearAuthSession, getAccessToken } from "@/lib/auth/storage";

type ApiErrorPayload = {
  message?: string;
};

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await readJson<TResponse & ApiErrorPayload>(response);

  if (response.status === 401) {
    clearAuthSession();
    window.location.assign("/");
    throw new Error("Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Unable to load data. Please try again.");
  }

  if (!data) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}

export async function apiPatch<TResponse, TPayload extends object>(path: string, payload: TPayload): Promise<TResponse> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: "PATCH",
  });

  const data = await readJson<TResponse & ApiErrorPayload>(response);

  if (response.status === 401) {
    clearAuthSession();
    window.location.assign("/");
    throw new Error("Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Unable to save changes. Please try again.");
  }

  if (!data) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}

export async function apiPost<TResponse, TPayload extends object>(path: string, payload: TPayload): Promise<TResponse> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: "POST",
  });

  const data = await readJson<TResponse & ApiErrorPayload>(response);

  if (response.status === 401) {
    clearAuthSession();
    window.location.assign("/");
    throw new Error("Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Unable to save changes. Please try again.");
  }

  if (!data) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}

export async function apiDelete<TResponse>(path: string): Promise<TResponse> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    method: "DELETE",
  });

  const data = await readJson<TResponse & ApiErrorPayload>(response);

  if (response.status === 401) {
    clearAuthSession();
    window.location.assign("/");
    throw new Error("Your session expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Unable to delete record. Please try again.");
  }

  if (!data) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}
