import { api, API_BASE_URL } from "@/lib/api-client";
import type { AuthResponse, MessageResponse } from "./types";

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<MessageResponse>("/auth/register", data).then((r) => r.data),

  verifyEmail: (data: { email: string; code: string }) =>
    api.post<AuthResponse>("/auth/verify-email", data).then((r) => r.data),

  resendOtp: (data: { email: string }) =>
    api.post<MessageResponse>("/auth/resend-otp", data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login", data).then((r) => r.data),

  logout: () => api.post("/auth/logout").then((r) => r.data),

  setPassword: (data: { newPassword: string }) =>
    api.post<MessageResponse>("/auth/set-password", data).then((r) => r.data),

  linkGoogle: () => api.post<AuthResponse>("/auth/google/link").then((r) => r.data),

  forgotPassword: (data: { email: string }) =>
    api.post<MessageResponse>("/auth/forgot-password", data).then((r) => r.data),

  verifyResetOtp: (data: { email: string; code: string }) =>
    api.post<MessageResponse>("/auth/verify-reset-otp", data).then((r) => r.data),

  resetPassword: (data: { newPassword: string }) =>
    api.post<MessageResponse>("/auth/reset-password", data).then((r) => r.data),

  googleLoginUrl: () => `${API_BASE_URL}/auth/google/login`,
};
