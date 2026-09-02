import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { LoadingBlock } from "@/components/ui-states";

/**
 * Client-side session gate. The access token lives in localStorage, so the
 * check runs after hydration.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { hydrated, isAuthenticated } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [hydrated, isAuthenticated, navigate]);

  if (!hydrated) return <LoadingBlock label="Checking your session…" />;
  if (!isAuthenticated) return <LoadingBlock label="Redirecting to login…" />;
  return <>{children}</>;
}
