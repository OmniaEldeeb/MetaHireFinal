import { api } from "../client";
import type { AuthPayload, AuthUser } from "../types";
import type { UserRole } from "@/lib/constants/enums";

export interface LoginBody {
  email: string;
  password: string;
  device_name: string;
}

export interface RegisterCandidateBody {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}

export interface RegisterCompanyBody {
  name: string;
  email: string;
  company_name: string;
  industry?: string;
  headquarters?: string;
  website?: string;
  password: string;
  password_confirmation: string;
  device_name: string;
}

export interface MeResponse {
  user: AuthUser;
  role: UserRole;
  is_company: boolean;
  is_candidate: boolean;
}

export interface ForgotPasswordResult {
  channel: "email" | "sms";
  use_firebase: boolean;
}

export const authApi = {
  login: (body: LoginBody) => api.post<AuthPayload>("/auth/login", body),

  registerCandidate: (body: RegisterCandidateBody) =>
    api.post<AuthPayload>("/auth/register", body),

  registerCompany: (body: RegisterCompanyBody) =>
    api.post<AuthPayload>("/auth/company/register", body),

  googleSignIn: (body: { id_token: string; device_name: string }) =>
    api.post<AuthPayload>("/auth/google", body),

  me: () => api.get<MeResponse>("/auth/me"),

  logout: () => api.post<unknown>("/auth/logout"),

  logoutAll: () => api.post<unknown>("/auth/logout-all"),

  forgotPassword: (body: { identifier: string }) =>
    api.post<ForgotPasswordResult>("/auth/forgot-password", body),

  verifyOtp: (body: { identifier: string; otp?: string; firebase_token?: string }) =>
    api.post<{ reset_token: string }>("/auth/verify-otp", body),

  resetPassword: (body: {
    identifier: string;
    reset_token: string;
    password: string;
    password_confirmation: string;
  }) => api.post<unknown>("/auth/reset-password", body),

  changePassword: (body: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.post<unknown>("/auth/change-password", body),
};
