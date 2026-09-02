import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search["email"] === "string" ? (search["email"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — CaptureBase" },
      { name: "description", content: "Enter the one-time code we emailed you to activate your CaptureBase account." },
      { property: "og:title", content: "Verify your email — CaptureBase" },
      { property: "og:description", content: "Enter your one-time verification code." },
    ],
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email: initialEmail } = Route.useSearch();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const verify = useMutation({
    mutationFn: () => authApi.verifyEmail({ email, code }),
    onSuccess: (data) => {
      setSession(data.access_token, data.user);
      toast.success("Email verified. You're in.");
      navigate({ to: "/dashboard", replace: true });
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  const resend = useMutation({
    mutationFn: () => authApi.resendOtp({ email }),
    onSuccess: (data) => toast.success(data?.message ?? "A new code is on its way."),
    onError: (error) => toast.error(apiErrorMessage(error)),
  });

  return (
    <AuthLayout
      title="Verify your email"
      description="Enter the one-time code we sent to your inbox."
      footer={
        <Link to="/login" className="text-muted-foreground hover:text-primary">
          Back to login
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          verify.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            required
            inputMode="numeric"
            className="font-mono tracking-[0.3em]"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={verify.isPending}>
          {verify.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          Verify email
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        className="w-full"
        disabled={resend.isPending || !email}
        onClick={() => resend.mutate()}
      >
        {resend.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Resend code
      </Button>
    </AuthLayout>
  );
}
