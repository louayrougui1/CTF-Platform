import { api } from "@/lib/api-client";
import type { UserProfile } from "./types";

export type UserUpdateResponse = {
  id: string;
  email: string;
  username: string;
  googleId: string | null;
  updatedAt: string;
};

export const userApi = {
  profile: () => api.get<UserProfile>("/user/profile").then((r) => r.data),
  updateProfile: (data: { username: string }) =>
    api.patch<UserUpdateResponse>("/user/profile", data).then((r) => r.data),
};
