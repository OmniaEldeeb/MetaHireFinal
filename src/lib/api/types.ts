import type { UserRole } from "@/lib/constants/enums";

/** Success envelope: { result: true, message, data } */
export interface ApiSuccess<T> {
  result: true;
  message?: string;
  data: T;
}

/** Error envelope: { result: false, code, message, meta } */
export interface ApiError {
  result: false;
  code: string;
  message: string;
  meta?: {
    errors?: Record<string, string[]>;
    retry_after?: number;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

/** Normalized error thrown by the client interceptor. */
export class ApiException extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string[]>;
  retryAfter?: number;

  constructor(params: {
    status: number;
    code: string;
    message: string;
    fieldErrors?: Record<string, string[]>;
    retryAfter?: number;
  }) {
    super(params.message);
    this.name = "ApiException";
    this.status = params.status;
    this.code = params.code;
    this.fieldErrors = params.fieldErrors;
    this.retryAfter = params.retryAfter;
  }
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  company?: unknown | null;
}

export interface AuthPayload {
  token: string;
  user: AuthUser;
  role: UserRole;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
