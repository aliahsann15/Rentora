import { API_BASE_URL } from "./config";
import { refreshStoredAccessToken } from "@/lib/auth/refresh";
import { clearAuthSession, getAccessToken } from "@/lib/auth/storage";

type ApiErrorPayload = {
  message?: string;
};

async function readJson<T>(response: Response): Promise<T | null> {
  return response.json().catch(() => null) as Promise<T | null>;
}

function getHeaders(headers?: HeadersInit, token = getAccessToken()): Headers {
  const nextHeaders = new Headers(headers);

  if (token) {
    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
}

async function parseResponse<TResponse>(response: Response, fallbackMessage: string): Promise<TResponse> {
  const data = await readJson<TResponse & ApiErrorPayload>(response);

  if (!response.ok) {
    throw new Error(data?.message || fallbackMessage);
  }

  if (!data) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}

async function requestWithAuth<TResponse>(
  path: string,
  init: RequestInit,
  fallbackMessage: string,
): Promise<TResponse> {
  const request = (token?: string | null) =>
    fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: getHeaders(init.headers, token),
    });

  const response = await request();

  if (response.status !== 401) {
    return parseResponse<TResponse>(response, fallbackMessage);
  }

  const refreshedAccessToken = await refreshStoredAccessToken();

  if (!refreshedAccessToken) {
    clearAuthSession();
    redirectToLogin();
    throw new Error("Your session expired. Please sign in again.");
  }

  const retryResponse = await request(refreshedAccessToken);

  if (retryResponse.status === 401) {
    clearAuthSession();
    redirectToLogin();
    throw new Error("Your session expired. Please sign in again.");
  }

  return parseResponse<TResponse>(retryResponse, fallbackMessage);
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  return requestWithAuth<TResponse>(path, {}, "Unable to load data. Please try again.");
}

export async function apiPatch<TResponse, TPayload extends object>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  return requestWithAuth<TResponse>(
    path,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    },
    "Unable to save changes. Please try again.",
  );
}

export async function apiPatchForm<TResponse>(path: string, payload: FormData): Promise<TResponse> {
  return requestWithAuth<TResponse>(
    path,
    { body: payload, method: "PATCH" },
    "Unable to save changes. Please try again.",
  );
}

export async function apiPost<TResponse, TPayload extends object>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  return requestWithAuth<TResponse>(
    path,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Unable to save changes. Please try again.",
  );
}

export async function apiDelete<TResponse>(path: string): Promise<TResponse> {
  return requestWithAuth<TResponse>(
    path,
    { method: "DELETE" },
    "Unable to delete record. Please try again.",
  );
}
