import type { User, ValidationErrors } from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export type AuthResponse = {
  message: string;
  user: User | { data: User };
  verification_email_sent?: boolean;
};

export class ApiRequestError extends Error {
  status: number;
  errors?: ValidationErrors;

  constructor(message: string, status: number, errors?: ValidationErrors) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
  }
}

function cookieValue(name: string) {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((item) => item.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

export async function initializeCsrf() {
  const apiOrigin = new URL(API_BASE_URL).origin;
  await fetch(`${apiOrigin}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
}

export async function apiRequest<T>(
  path: string,
  { body, headers, ...options }: ApiOptions = {},
): Promise<T> {
  const hasJsonBody = body !== undefined;
  const csrfToken = cookieValue("XSRF-TOKEN");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "X-XSRF-TOKEN": csrfToken } : {}),
      ...headers,
    },
    body: hasJsonBody ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiRequestError(
      data?.message ?? "Something went wrong.",
      response.status,
      data?.errors,
    );
  }

  return data as T;
}

export function unwrapResource<T>(payload: T | { data: T }) {
  return "data" in (payload as { data?: T })
    ? (payload as { data: T }).data
    : (payload as T);
}

export function unwrapCollection<T>(payload: T[] | { data: T[] }) {
  return Array.isArray(payload) ? payload : payload.data;
}

export function authUser(payload: AuthResponse) {
  return unwrapResource(payload.user);
}
