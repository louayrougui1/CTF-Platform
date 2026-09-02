import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/lib/auth-store";

export function useSession() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  return { token, user, hydrated, isAuthenticated: Boolean(token) };
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useCallback(async () => {
    await queryClient.cancelQueries();
    try {
      await authApi.logout();
    } catch {
      // ignore — clear the local session regardless
    }
    clear();
    queryClient.clear();
    navigate({ to: "/login", replace: true });
  }, [clear, navigate, queryClient]);
}
