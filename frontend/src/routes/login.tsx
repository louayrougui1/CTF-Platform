import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { AuthLayout, GoogleButton } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — CaptureBase" },
      { name: "description", content: "Log in to your CaptureBase CTF account." },
      { property: "og:title", content: "Log in — CaptureBase" },
      { property: "og:description", content: "Log in to your CaptureBase CTF account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const { hydrated, isAuthenticated } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (hydrated && isAuthenticated) navigate({ to: "/dashboard", replace: true });
  }, [hydrated, isAuthenticated, navigate]);

  const login = useMutation({
    mutationFn: () => authApi.login({ email, password }),
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
      toast.success(`Welcome back, ${data.user.username}`);
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <AuthLayout
      title="Log in"
      description="Use your email and password, or continue with Google."
      footer={
        <span className="text-muted-foreground">
          No account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </span>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Log in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <GoogleButton />

      <p className="text-center text-xs text-muted-foreground">
        Haven't verified your email?{" "}
        <Link to="/verify-email" search={{ email }} className="text-primary hover:underline">
          Enter your code
        </Link>
      </p>
    </AuthLayout>
  );
}
